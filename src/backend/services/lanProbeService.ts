import type { DeviceRequest } from '../domain/devices/deviceInvitation';
import { isDeviceFingerprint } from '../domain/devices/devicePermissions';
import { parseLanConnection } from '../domain/devices/lanConnection';
import { isCongregationId } from '../domain/profile/profile';
import type { DeviceIdentityService } from './deviceIdentityService';
import type { DevicePermissionService } from './devicePermissionService';
import type { ProfileService } from './profileService';

interface Subscription { remove(): void }
interface Transport {
  token(): Promise<string>;
  describe(scope: string): Promise<unknown>;
  start(id: string, peer: string, scope: string): Promise<unknown>;
  probe(peer: string, code: string): Promise<unknown>;
  resolve(ticket: string, allowed: boolean): Promise<void>;
  stop(): Promise<void>;
  checkProtocol(): Promise<boolean>;
  onAuthorize(callback: (event: unknown) => void): Subscription;
  onStopped(callback: (event: unknown) => void): Subscription;
}

function record(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Invalid LAN reply');
  }
  return input as Record<string, unknown>;
}

export function createLanProbeService(
  identities: Pick<DeviceIdentityService, 'read'>,
  profiles: Pick<ProfileService, 'load'>,
  requests: { list(owner: string): readonly DeviceRequest[] },
  inspector: { inspect(key: string): Promise<unknown> },
  permissions: Pick<DevicePermissionService, 'assertReadAllowed'>,
  transport: Transport,
) {
  let generation = 0;
  let active: { id: string; subscriptions: Subscription[] } | null = null;

  async function context(fingerprint: string) {
    if (!isDeviceFingerprint(fingerprint)) throw new Error('Invalid peer');
    const identity = await identities.read();
    if (!identity.ok || !identity.value) throw new Error('Identity unavailable');
    const own = identity.value;
    const peer = requests.list(own.fingerprint).find(item => item.fingerprint === fingerprint);
    if (!peer || peer.state !== 'trusted' || fingerprint === own.fingerprint) {
      throw new Error('Trusted peer required');
    }
    const inspected = record(await inspector.inspect(peer.publicKey));
    if (inspected.publicKey !== peer.publicKey || inspected.fingerprint !== peer.fingerprint) {
      throw new Error('Peer key mismatch');
    }
    return { own, peer };
  }

  function scope(): string {
    const profile = profiles.load();
    if (!profile.ok || !profile.value || !isCongregationId(profile.value.congregationId)) {
      throw new Error('Profile unavailable');
    }
    return profile.value.congregationId;
  }

  async function stop(): Promise<void> {
    generation++;
    const lease = active;
    active = null;
    lease?.subscriptions.forEach(item => item.remove());
    await transport.stop();
  }

  return {
    stop,
    async describe(fingerprint: string): Promise<string> {
      const { own } = await context(fingerprint);
      const congregationId = scope();
      const code = parseLanConnection(JSON.stringify(await transport.describe(congregationId)));
      if (code.fingerprint !== own.fingerprint || code.congregationId !== congregationId) {
        throw new Error('Endpoint mismatch');
      }
      return JSON.stringify(code);
    },

    async start(fingerprint: string, onStopped: () => void): Promise<string> {
      await stop();
      const currentGeneration = generation;
      const { own, peer } = await context(fingerprint);
      const congregationId = scope();
      const lease = { id: await transport.token(), subscriptions: [] as Subscription[] };
      if (generation !== currentGeneration) throw new Error('Cancelled');
      active = lease;
      try {
        lease.subscriptions.push(transport.onAuthorize(input => {
          const event = record(input);
          if (typeof event.ticket !== 'string' || !/^[a-f0-9]{64}$/.test(event.ticket)) return;
          const ticket = event.ticket;
          void (async () => {
            let allowed = false;
            try {
              if (active !== lease || event.hostId !== lease.id ||
                event.peerFingerprint !== peer.fingerprint ||
                event.congregationId !== congregationId || !isDeviceFingerprint(event.peerFingerprint)) {
                throw new Error('Unrelated authorization event');
              }
              // This fingerprint came from the native mutual TLS certificate.
              await permissions.assertReadAllowed(event.peerFingerprint, congregationId);
              allowed = active === lease;
            } catch {
              allowed = false;
            } finally {
              await transport.resolve(ticket, allowed).catch(() => undefined);
            }
          })();
        }));
        lease.subscriptions.push(transport.onStopped(input => {
          const event = record(input);
          if (active !== lease || event.hostId !== lease.id) return;
          active = null;
          lease.subscriptions.forEach(item => item.remove());
          onStopped();
        }));
        const code = parseLanConnection(JSON.stringify(
          await transport.start(lease.id, peer.publicKey, congregationId),
        ));
        if (active !== lease || code.fingerprint !== own.fingerprint || code.congregationId !== congregationId) {
          throw new Error('Endpoint mismatch');
        }
        return JSON.stringify(code);
      } catch (error) {
        await stop();
        throw error;
      }
    },

    async probe(fingerprint: string, serialized: string): Promise<boolean> {
      if (active) throw new Error('Stop hosting first');
      const { own, peer } = await context(fingerprint);
      const code = parseLanConnection(serialized);
      if (code.fingerprint !== peer.fingerprint) throw new Error('Wrong peer');
      const response = record(await transport.probe(peer.publicKey, JSON.stringify(code)));
      const latest = requests.list(own.fingerprint).find(item => item.fingerprint === peer.fingerprint);
      if (!latest || latest.state !== 'trusted' || latest.revision !== peer.revision ||
        response.peerFingerprint !== peer.fingerprint || typeof response.accepted !== 'boolean') {
        throw new Error('Peer no longer trusted');
      }
      return response.accepted;
    },
    checkProtocol: () => transport.checkProtocol(),
  };
}

export type LanProbeService = ReturnType<typeof createLanProbeService>;
