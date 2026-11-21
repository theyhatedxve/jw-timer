import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseIdentityReply,
} from '../src/backend/domain/devices/deviceIdentity';

import {
  createDeviceIdentityService,
} from '../src/backend/services/deviceIdentityService';

// Structural native-response fixture, not a peer certificate.
const ready = {
  status: 'ready',
  fingerprint: `sha256:${'a'.repeat(64)}`,
  publicKey: `${'A'.repeat(122)}==`,
  protection: 'tee',
};

test('accepts missing identity without creating one', async () => {
  let creations = 0;

  const service = createDeviceIdentityService({
    read: async () => ({ status: 'missing' }),
    create: async () => {
      creations += 1;
      return ready;
    },
    check: async () => true,
  });

  assert.deepEqual(await service.read(), {
    ok: true,
    value: null,
  });
  assert.equal(creations, 0);

  assert.equal((await service.create()).ok, true);
  assert.equal(creations, 1);
});

test('accepts hardware-backed native metadata', () => {
  assert.equal(parseIdentityReply(ready).ok, true);
});

test('rejects malformed fingerprints and software backing', () => {
  assert.equal(
    parseIdentityReply({ ...ready, fingerprint: 'invalid' }).ok,
    false,
  );

  assert.equal(
    parseIdentityReply({ ...ready, protection: 'software' }).ok,
    false,
  );
});

test('reports unsuccessful native signing verification', async () => {
  const service = createDeviceIdentityService({
    read: async () => ready,
    create: async () => ready,
    check: async () => false,
  });

  assert.deepEqual(await service.check(), {
    ok: false,
    code: 'verification',
  });
});