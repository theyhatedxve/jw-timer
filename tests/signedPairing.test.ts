import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  generateKeyPairSync,
  sign,
  verify,
} from 'node:crypto';

import {
  PAIRING_TTL,
  pairingSigningText,
  parsePairingPacket,
  type PairingBody,
} from '../src/backend/domain/devices/signedPairing';

const first = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});
const second = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});

function publicKey(key: typeof first.publicKey): string {
  return key.export({
    type: 'spki',
    format: 'der',
  }).toString('base64');
}

const now = Date.now();

const body: PairingBody = {
  version: 1,
  type: 'challenge',
  from: publicKey(first.publicKey),
  to: publicKey(second.publicKey),
  nonce: 'a'.repeat(64),
  peerNonce: '',
  expiresAt: now + PAIRING_TTL,
};

const signature = sign(
  'sha256',
  Buffer.from(pairingSigningText(body), 'utf8'),
  first.privateKey,
).toString('base64');

test('accepts a signed challenge packet', () => {
  const packet = parsePairingPacket(
    JSON.stringify({ ...body, signature }),
    now,
  );

  assert.equal(verify(
    'sha256',
    Buffer.from(pairingSigningText(packet), 'utf8'),
    first.publicKey,
    Buffer.from(packet.signature, 'base64'),
  ), true);
});

test('modified nonce invalidates the signature', () => {
  assert.equal(verify(
    'sha256',
    Buffer.from(pairingSigningText({
      ...body,
      nonce: 'b'.repeat(64),
    }), 'utf8'),
    first.publicKey,
    Buffer.from(signature, 'base64'),
  ), false);
});

test('rejects expired and unsupported packets', () => {
  for (const change of [
    { expiresAt: now },
    { version: 2 },
    { unexpected: true },
  ]) {
    assert.throws(() => parsePairingPacket(
      JSON.stringify({ ...body, signature, ...change }),
      now,
    ));
  }
});

test('approval requires a different peer nonce', () => {
  assert.throws(() => parsePairingPacket(JSON.stringify({
    ...body,
    type: 'approval',
    peerNonce: body.nonce,
    signature,
  }), now));
});
