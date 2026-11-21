import { isCongregationId } from '../profile/profile';

export interface ReadGrant {
  readonly congregationId: string;
  readonly peerFingerprint: string;
  readonly issuerFingerprint: string;
  readonly permission: 'schedule.read';
  readonly peerRevision: number;
  readonly enabled: boolean;
  readonly revision: number;
  readonly expiresAt: number | null;
}

export interface ReadGrantCommand {
  readonly congregationId: string;
  readonly peerFingerprint: string;
  readonly peerRevision: number;
  readonly grantRevision: number;
  readonly enabled: boolean;
}

export class PermissionFailure extends Error {
  constructor(
    readonly code:
      | 'invalid'
      | 'identity'
      | 'profile'
      | 'peer'
      | 'conflict'
      | 'denied'
      | 'storage',
  ) {
    super(code);
  }
}

export function isDeviceFingerprint(value: unknown): value is string {
  return typeof value === 'string' &&
    /^sha256:[a-f0-9]{64}$/.test(value);
}

export function parseReadGrantCommand(
  input: unknown,
): ReadGrantCommand {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new PermissionFailure('invalid');
  }

  const value = input as Record<string, unknown>;

  if (
    Object.keys(value).sort().join(',') !==
      'congregationId,enabled,grantRevision,peerFingerprint,peerRevision' ||
    !isCongregationId(value.congregationId) ||
    !isDeviceFingerprint(value.peerFingerprint) ||
    typeof value.enabled !== 'boolean' ||
    typeof value.peerRevision !== 'number' ||
    !Number.isSafeInteger(value.peerRevision) ||
    value.peerRevision < 1 ||
    typeof value.grantRevision !== 'number' ||
    !Number.isSafeInteger(value.grantRevision) ||
    value.grantRevision < 0 ||
    value.grantRevision >= Number.MAX_SAFE_INTEGER
  ) {
    throw new PermissionFailure('invalid');
  }

  return {
    congregationId: value.congregationId,
    peerFingerprint: value.peerFingerprint,
    peerRevision: value.peerRevision,
    grantRevision: value.grantRevision,
    enabled: value.enabled,
  };
}

export function mayReadSchedule(input: {
  readonly ownerFingerprint: string;
  readonly peerFingerprint: string;
  readonly currentCongregationId: string;
  readonly requestedCongregationId: string;
  readonly permission: string;
  readonly peer: {
    readonly state: string;
    readonly revision: number;
  } | null;
  readonly grant: ReadGrant | null;
  readonly now: number;
}): boolean {
  const { grant, peer } = input;

  return input.permission === 'schedule.read' &&
    isDeviceFingerprint(input.ownerFingerprint) &&
    isDeviceFingerprint(input.peerFingerprint) &&
    input.ownerFingerprint !== input.peerFingerprint &&
    isCongregationId(input.currentCongregationId) &&
    input.currentCongregationId === input.requestedCongregationId &&
    peer?.state === 'trusted' &&
    Number.isSafeInteger(peer.revision) &&
    peer.revision >= 1 &&
    grant !== null &&
    grant.enabled === true &&
    grant.permission === 'schedule.read' &&
    grant.congregationId === input.currentCongregationId &&
    grant.peerFingerprint === input.peerFingerprint &&
    grant.issuerFingerprint === input.ownerFingerprint &&
    grant.peerRevision === peer.revision &&
    Number.isSafeInteger(grant.revision) &&
    grant.revision >= 1 &&
    (
      grant.expiresAt === null ||
      (
        Number.isSafeInteger(grant.expiresAt) &&
        grant.expiresAt > input.now
      )
    );
}