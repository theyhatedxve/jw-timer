export interface DeviceInvitation {
  readonly kind: 'jw-timer-device-invitation';
  readonly version: 1;
  readonly publicKey: string;
  readonly fingerprint: string;
}

export interface DeviceRequest {
  readonly label: string;
  readonly publicKey: string;
  readonly fingerprint: string;
  readonly state: 'pending' | 'trusted' | 'revoked';
  readonly createdAt: number;
  readonly revision: number;
}

export type PairingErrorCode =
  | 'invalid'
  | 'identity'
  | 'ownDevice'
  | 'duplicate'
  | 'storage';

export class PairingFailure extends Error {
  constructor(readonly code: PairingErrorCode) {
    super(code);
  }
}

export function parseDeviceInvitation(
  serialized: string,
): DeviceInvitation {
  if (serialized.length > 1024) {
    throw new PairingFailure('invalid');
  }

  let input: unknown;

  try {
    input = JSON.parse(serialized);
  } catch {
    throw new PairingFailure('invalid');
  }

  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new PairingFailure('invalid');
  }

  const value = input as Record<string, unknown>;

  if (
    Object.keys(value).sort().join(',') !==
      'fingerprint,kind,publicKey,version' ||
    value.kind !== 'jw-timer-device-invitation' ||
    value.version !== 1 ||
    typeof value.publicKey !== 'string' ||
    !/^[A-Za-z0-9+/]{122}==$/.test(value.publicKey) ||
    typeof value.fingerprint !== 'string' ||
    !/^sha256:[a-f0-9]{64}$/.test(value.fingerprint)
  ) {
    throw new PairingFailure('invalid');
  }

  return {
    kind: 'jw-timer-device-invitation',
    version: 1,
    publicKey: value.publicKey,
    fingerprint: value.fingerprint,
  };
}