import type { DeviceRequest } from '../domain/devices/deviceInvitation';
import { isDeviceFingerprint } from '../domain/devices/devicePermissions';
import { parseLanConnection } from '../domain/devices/lanConnection';
import { isCongregationId } from '../domain/profile/profile';
import type { DeviceIdentityService } from './deviceIdentityService';
import type { DevicePermissionService } from './devicePermissionService';
import type { ProfileService } from './profileService';
import {
  parseSharedSchedule,
  type SharedSchedule,
} from '../domain/devices/sharedSchedule';

export interface ScheduleExchange {
  exportSchedule(scope: string): string;
  read(owner: string, localScope: string, peer: string): string | null;
  save(owner: string, localScope: string, peer: string, serialized: string): void;
}

interface Subscription { remove(): void }
interface Transport {
  token(): Promise<string>;
  describe(scope: string): Promise<unknown>;
  start(id: string, peer: string, scope: string): Promise<unknown>;
  probe(peer: string, code: string, operation?: 'session.check' | 'schedule.read', body?: string, clientId?: string): Promise<unknown>;
  resolve(ticket: string, allowed: boolean, schedule?: string): Promise<void>;
  stop(expectedHostId?: string): Promise<void>;
  cancelClient(clientId: string): Promise<void>;
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
  exchange: ScheduleExchange,
  rpc?: { handle(fingerprint: string, scope: string, body: string): Promise<string> },
) {
  let generation = 0;
  let activeClient: string | null = null;
  let active: { id: string; subscriptions: Subscription[] } | null = null;
  let preview: {
    owner: string;
    localScope: string;
    peer: string;
    peerRevision: number;
    serialized: string;
  } | null = null;

  function requireCurrentPeer(owner: string, fingerprint: string, revision: number): void {
    const current = requests.list(owner).find(item => item.fingerprint === fingerprint);
    if (!current || current.state !== 'trusted' || current.revision !== revision) {
      throw new Error('Peer trust changed');
    }
  }

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
    preview = null;
    generation++;
    const lease = active;
    const client = activeClient;
    active = null;
    activeClient = null;
    lease?.subscriptions.forEach(item => item.remove());
    await Promise.all([
      lease ? transport.stop(lease.id) : Promise.resolve(),
      client ? transport.cancelClient(client) : Promise.resolve(),
    ]);
  }

  async function send(publicKey: string, code: string, operation: 'session.check' | 'schedule.read', expected: number) {
    const id = await transport.token();
    if (generation !== expected) throw new Error('Cancelled');
    activeClient = id;
    try { return await transport.probe(publicKey, code, operation, '', id); }
    finally { if (activeClient === id) activeClient = null; }
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
      const currentGeneration = generation + 1;
      await stop();
      if (generation !== currentGeneration) throw new Error('Cancelled');
      const { own, peer } = await context(fingerprint);
      const congregationId = scope();
      const lease = { id: await transport.token(), subscriptions: [] as Subscription[] };
      if (generation !== currentGeneration) throw new Error('Cancelled');
      active = lease;
      try {
        lease.subscriptions.push(transport.onAuthorize(input => {
          let event: Record<string, unknown>;
          try {
            event = record(input);
          } catch {
            return;
          }
          if (typeof event.ticket !== 'string' || !/^[a-f0-9]{64}$/.test(event.ticket)) return;
          const ticket = event.ticket;
          void (async () => {
            let allowed = false;
            let serialized = '';
            try {
              if (active !== lease || event.hostId !== lease.id ||
                event.peerFingerprint !== peer.fingerprint ||
                event.congregationId !== congregationId || !isDeviceFingerprint(event.peerFingerprint) ||
                (event.operation !== 'session.check' && event.operation !== 'schedule.read' && event.operation !== 'sync.exchange')) {
                throw new Error('Unrelated authorization event');
              }
              // This fingerprint came from the native mutual TLS certificate.
              await permissions.assertReadAllowed(event.peerFingerprint, congregationId);
              if (event.operation === 'sync.exchange') {
                if (!rpc || typeof event.body !== 'string') throw new Error('Unsupported sync operation');
                serialized = await rpc.handle(event.peerFingerprint, congregationId, event.body);
                await permissions.assertReadAllowed(event.peerFingerprint, congregationId);
              }
              if (event.operation === 'schedule.read') {
                serialized = exchange.exportSchedule(congregationId);
                const snapshot = parseSharedSchedule(JSON.parse(serialized));
                if (snapshot.congregationId !== congregationId) {
                  throw new Error('Schedule scope changed');
                }
                serialized = JSON.stringify(snapshot);
                // Recheck immediately before releasing private data.
                await permissions.assertReadAllowed(event.peerFingerprint, congregationId);
              }
              allowed = active === lease;
            } catch {
              allowed = false;
              serialized = '';
            } finally {
              await transport.resolve(ticket, allowed, allowed ? serialized : '').catch(() => undefined);
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
        if (active === lease) await stop();
        else await transport.stop(lease.id);
        throw error;
      }
    },

    async probe(fingerprint: string, serialized: string): Promise<boolean> {
      if (active) throw new Error('Stop hosting first');
      const expected = generation;
      const { own, peer } = await context(fingerprint);
      const code = parseLanConnection(serialized);
      if (code.fingerprint !== peer.fingerprint) throw new Error('Wrong peer');
      const response = record(await send(peer.publicKey, JSON.stringify(code), 'session.check', expected));
      const latest = requests.list(own.fingerprint).find(item => item.fingerprint === peer.fingerprint);
      if (generation !== expected || !latest || latest.state !== 'trusted' || latest.revision !== peer.revision ||
        response.peerFingerprint !== peer.fingerprint || typeof response.accepted !== 'boolean') {
        throw new Error('Peer no longer trusted');
      }
      return response.accepted;
    },
    async download(fingerprint: string, connectionCode: string): Promise<SharedSchedule | null> {
      preview = null;
      if (active) throw new Error('Stop hosting first');
      const currentGeneration = generation;
      const { own, peer } = await context(fingerprint);
      const localScope = scope();
      const code = parseLanConnection(connectionCode);
      if (code.fingerprint !== peer.fingerprint) throw new Error('Wrong hosting device');
      const response = record(await send(
        peer.publicKey, JSON.stringify(code), 'schedule.read', currentGeneration,
      ));
      requireCurrentPeer(own.fingerprint, peer.fingerprint, peer.revision);
      if (generation !== currentGeneration || scope() !== localScope ||
        response.peerFingerprint !== peer.fingerprint || typeof response.accepted !== 'boolean') {
        throw new Error('Transfer context changed');
      }
      if (!response.accepted) return null;
      if (typeof response.schedule !== 'string' || response.schedule.length > 65_536) {
        throw new Error('Invalid schedule response');
      }
      const snapshot = parseSharedSchedule(JSON.parse(response.schedule));
      if (snapshot.congregationId !== code.congregationId) {
        throw new Error('Received the wrong congregation');
      }
      preview = {
        owner: own.fingerprint, localScope, peer: peer.fingerprint,
        peerRevision: peer.revision, serialized: JSON.stringify(snapshot),
      };
      return snapshot;
    },

    async saveReceived(fingerprint: string): Promise<void> {
      const candidate = preview;
      if (!candidate || candidate.peer !== fingerprint) {
        throw new Error('Download and preview a schedule first');
      }
      const { own, peer } = await context(fingerprint);
      requireCurrentPeer(own.fingerprint, peer.fingerprint, candidate.peerRevision);
      if (preview !== candidate || own.fingerprint !== candidate.owner || scope() !== candidate.localScope) {
        throw new Error('Preview is no longer valid');
      }
      exchange.save(candidate.owner, candidate.localScope, candidate.peer, candidate.serialized);
      preview = null;
    },

    async loadReceived(fingerprint: string): Promise<SharedSchedule | null> {
      preview = null;
      const { own, peer } = await context(fingerprint);
      requireCurrentPeer(own.fingerprint, peer.fingerprint, peer.revision);
      const serialized = exchange.read(own.fingerprint, scope(), peer.fingerprint);
      return serialized === null ? null : parseSharedSchedule(JSON.parse(serialized));
    },
    checkProtocol: () => transport.checkProtocol(),
  };
}

export type LanProbeService = ReturnType<typeof createLanProbeService>;
