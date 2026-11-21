import type { ProfileService } from './profileService';
import type { DeviceIdentityService } from './deviceIdentityService';
import type { DeviceRequest } from '../domain/devices/deviceInvitation';
import { isCongregationId } from '../domain/profile/profile';

import {
  isDeviceFingerprint,
  mayReadSchedule,
  parseReadGrantCommand,
  PermissionFailure,
  type ReadGrant,
  type ReadGrantCommand,
} from '../domain/devices/devicePermissions';

interface Devices {
  list(owner: string): readonly DeviceRequest[];
}

interface Grants {
  read(
    owner: string,
    peer: string,
    congregationId: string,
  ): ReadGrant | null;
  set(owner: string, command: ReadGrantCommand): void;
}

export function createDevicePermissionService(
  identities: Pick<DeviceIdentityService, 'read'>,
  profiles: Pick<ProfileService, 'load'>,
  devices: Devices,
  grants: Grants,
) {
  async function context(fingerprint: string) {
    if (!isDeviceFingerprint(fingerprint)) {
      throw new PermissionFailure('invalid');
    }

    const identity = await identities.read();

    if (!identity.ok || !identity.value) {
      throw new PermissionFailure('identity');
    }

    const profile = profiles.load();

    if (
      !profile.ok ||
      !profile.value ||
      !isCongregationId(profile.value.congregationId)
    ) {
      throw new PermissionFailure('profile');
    }

    const peer = devices.list(identity.value.fingerprint).find(
      device => device.fingerprint === fingerprint,
    );

    if (!peer || fingerprint === identity.value.fingerprint) {
      throw new PermissionFailure('peer');
    }

    return {
      owner: identity.value.fingerprint,
      congregationId: profile.value.congregationId,
      congregationName: profile.value.name,
      peer,
    };
  }

  async function isAllowed(
    verifiedPeerFingerprint: string,
    requestedCongregationId: string,
    permission: string,
  ): Promise<boolean> {
    if (permission !== 'schedule.read') return false;

    try {
      const current = await context(verifiedPeerFingerprint);

      return mayReadSchedule({
        ownerFingerprint: current.owner,
        peerFingerprint: verifiedPeerFingerprint,
        currentCongregationId: current.congregationId,
        requestedCongregationId,
        permission,
        peer: current.peer,
        grant: grants.read(
          current.owner,
          verifiedPeerFingerprint,
          current.congregationId,
        ),
        now: Date.now(),
      });
    } catch {
      return false;
    }
  }

  return {
    async load(fingerprint: string) {
      const current = await context(fingerprint);
      const grant = grants.read(
        current.owner,
        fingerprint,
        current.congregationId,
      );

      const allowed = mayReadSchedule({
        ownerFingerprint: current.owner,
        peerFingerprint: fingerprint,
        currentCongregationId: current.congregationId,
        requestedCongregationId: current.congregationId,
        permission: 'schedule.read',
        peer: current.peer,
        grant,
        now: Date.now(),
      });

      return {
        congregationId: current.congregationId,
        congregationName: current.congregationName,
        label: current.peer.label,
        peerState: current.peer.state,
        peerRevision: current.peer.revision,
        grantRevision: grant?.revision ?? 0,
        allowed,
      };
    },

    async set(input: unknown): Promise<void> {
      const command = parseReadGrantCommand(input);
      const current = await context(command.peerFingerprint);

      if (
        command.congregationId !== current.congregationId ||
        command.peerRevision !== current.peer.revision
      ) {
        throw new PermissionFailure('conflict');
      }

      if (command.enabled && current.peer.state !== 'trusted') {
        throw new PermissionFailure('denied');
      }

      grants.set(current.owner, command);
    },

    // Only an authenticated transport may supply this fingerprint.
    // This method authorizes access; it does not authenticate identity.
    isAllowedForVerifiedPeer: isAllowed,

    async assertReadAllowed(
      verifiedPeerFingerprint: string,
      congregationId: string,
    ): Promise<void> {
      if (!await isAllowed(
        verifiedPeerFingerprint,
        congregationId,
        'schedule.read',
      )) {
        throw new PermissionFailure('denied');
      }
    },
  };
}

export type DevicePermissionService =
  ReturnType<typeof createDevicePermissionService>;