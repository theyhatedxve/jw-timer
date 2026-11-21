import { PairingFailure } from './deviceInvitation';

export const PAIRING_TTL = 5 * 60 * 1000;

export interface PairingBody {
  readonly version: 1;
  readonly type: 'challenge' | 'approval';
  readonly from: string;
  readonly to: string;
  readonly nonce: string;
  readonly peerNonce: string;
  readonly expiresAt: number;
}

export interface PairingPacket extends PairingBody {
  readonly signature: string;
}

export function pairingPayload(body: PairingBody): string {
  return JSON.stringify({
    version: body.version,
    type: body.type,
    from: body.from,
    to: body.to,
    nonce: body.nonce,
    peerNonce: body.peerNonce,
    expiresAt: body.expiresAt,
  });
}

export function pairingSigningText(body: PairingBody): string {
  return [
    'JW-Timer/pairing/v1',
    body.type,
    body.from,
    body.to,
    body.nonce,
    body.peerNonce,
    String(body.expiresAt),
  ].join('\n');
}

export function parsePairingPacket(
  serialized: string,
  now = Date.now(),
): PairingPacket {
  if (serialized.length > 2048) {
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
  const keyPattern = /^[A-Za-z0-9+/]{122}==$/;
  const noncePattern = /^[a-f0-9]{64}$/;

  if (
    Object.keys(value).sort().join(',') !==
      'expiresAt,from,nonce,peerNonce,signature,to,type,version' ||
    value.version !== 1 ||
    (value.type !== 'challenge' && value.type !== 'approval') ||
    typeof value.from !== 'string' ||
    !keyPattern.test(value.from) ||
    typeof value.to !== 'string' ||
    !keyPattern.test(value.to) ||
    value.from === value.to ||
    typeof value.nonce !== 'string' ||
    !noncePattern.test(value.nonce) ||
    typeof value.peerNonce !== 'string' ||
    (
      value.type === 'challenge'
        ? value.peerNonce !== ''
        : !noncePattern.test(value.peerNonce) ||
          value.peerNonce === value.nonce
    ) ||
    typeof value.expiresAt !== 'number' ||
    !Number.isSafeInteger(value.expiresAt) ||
    value.expiresAt <= now ||
    value.expiresAt > now + PAIRING_TTL + 60_000 ||
    typeof value.signature !== 'string' ||
    !/^[A-Za-z0-9+/]{80,104}={0,2}$/.test(value.signature)
  ) {
    throw new PairingFailure('invalid');
  }

  return {
    version: 1,
    type: value.type,
    from: value.from,
    to: value.to,
    nonce: value.nonce,
    peerNonce: value.peerNonce,
    expiresAt: value.expiresAt,
    signature: value.signature,
  };
}