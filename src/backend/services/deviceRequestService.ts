import type { DeviceIdentityService } from './deviceIdentityService';

import {
  PairingFailure,
  parseDeviceInvitation,
  type DeviceInvitation,
  type DeviceRequest,
} from '../domain/devices/deviceInvitation';

interface Repository {
  list(owner: string): readonly DeviceRequest[];
  add(owner: string, label: string, peer: DeviceInvitation): void;
  revoke(owner: string, fingerprint: string): void;
  reopen(owner: string, fingerprint: string): void;
}

interface PeerInspector {
  inspect(publicKey: string): Promise<unknown>;
}

export function createDeviceRequestService(
  identities: DeviceIdentityService,
  repository: Repository,
  inspector: PeerInspector,
) {
  async function ownIdentity() {
    const result = await identities.read();

    if (!result.ok || !result.value) {
      throw new PairingFailure('identity');
    }

    return result.value;
  }

  return {
    async requestAgain(fingerprint: string): Promise<void> {
      if (!/^sha256:[a-f0-9]{64}$/.test(fingerprint)) {
        throw new PairingFailure('invalid');
      }

      const own = await ownIdentity();
      repository.reopen(own.fingerprint, fingerprint);
    },

    async load() {
      const own = await ownIdentity();

      return {
        invitation: JSON.stringify({
          kind: 'jw-timer-device-invitation',
          version: 1,
          publicKey: own.publicKey,
          fingerprint: own.fingerprint,
        }),
        requests: repository.list(own.fingerprint),
      };
    },

    async add(label: string, serialized: string): Promise<void> {
      const name = label.trim();

      if (
        name.length === 0 ||
        name.length > 100 ||
        /[\u0000-\u001f\u007f]/.test(name)
      ) {
        throw new PairingFailure('invalid');
      }

      const own = await ownIdentity();
      const invitation = parseDeviceInvitation(serialized);
      const inspected = await inspector.inspect(invitation.publicKey);

      if (
        typeof inspected !== 'object' ||
        inspected === null ||
        !('publicKey' in inspected) ||
        !('fingerprint' in inspected) ||
        inspected.publicKey !== invitation.publicKey ||
        inspected.fingerprint !== invitation.fingerprint
      ) {
        throw new PairingFailure('invalid');
      }

      if (invitation.fingerprint === own.fingerprint) {
        throw new PairingFailure('ownDevice');
      }

      repository.add(own.fingerprint, name, invitation);
    },

    async revoke(fingerprint: string): Promise<void> {
      if (!/^sha256:[a-f0-9]{64}$/.test(fingerprint)) {
        throw new PairingFailure('invalid');
      }

      const own = await ownIdentity();
      repository.revoke(own.fingerprint, fingerprint);
    },
  };
}

export type DeviceRequestService =
  ReturnType<typeof createDeviceRequestService>;
