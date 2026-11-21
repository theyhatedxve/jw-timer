export type IdentityProtection = 'tee' | 'strongbox' | 'hardware';

export interface DeviceIdentity {
  readonly fingerprint: string;
  readonly publicKey: string;
  readonly protection: IdentityProtection;
}

export type IdentityErrorCode =
  | 'native'
  | 'keystore'
  | 'invalid'
  | 'verification';

export class DeviceIdentityFailure extends Error {
  constructor(readonly code: IdentityErrorCode) {
    super(code);
  }
}

export type IdentityResult =
  | { readonly ok: true; readonly value: DeviceIdentity | null }
  | { readonly ok: false; readonly code: IdentityErrorCode };

export type IdentityCheckResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: IdentityErrorCode };

export function parseIdentityReply(input: unknown): IdentityResult {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    return { ok: false, code: 'invalid' };
  }

  const value = input as Record<string, unknown>;

  if (value.status === 'missing') {
    return { ok: true, value: null };
  }

  if (value.status === 'error') {
    return { ok: false, code: 'keystore' };
  }

  if (
    value.status !== 'ready' ||
    typeof value.fingerprint !== 'string' ||
    !/^sha256:[a-f0-9]{64}$/.test(value.fingerprint) ||
    typeof value.publicKey !== 'string' ||
    !/^[A-Za-z0-9+/]{122}==$/.test(value.publicKey) ||
    (
      value.protection !== 'tee' &&
      value.protection !== 'strongbox' &&
      value.protection !== 'hardware'
    )
  ) {
    return { ok: false, code: 'invalid' };
  }

  return {
    ok: true,
    value: {
      fingerprint: value.fingerprint,
      publicKey: value.publicKey,
      protection: value.protection,
    },
  };
}