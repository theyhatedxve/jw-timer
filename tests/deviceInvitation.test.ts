import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseDeviceInvitation,
} from '../src/backend/domain/devices/deviceInvitation';

const invitation = {
  kind: 'jw-timer-device-invitation',
  version: 1,
  publicKey: `${'A'.repeat(122)}==`,
  fingerprint: `sha256:${'a'.repeat(64)}`,
};

test('accepts a structurally valid invitation', () => {
  assert.equal(
    parseDeviceInvitation(JSON.stringify(invitation)).version,
    1,
  );
});

test('rejects unsupported versions and extra fields', () => {
  for (const change of [
    { version: 2 },
    { trusted: true },
    { fingerprint: 'invalid' },
  ]) {
    assert.throws(() =>
      parseDeviceInvitation(JSON.stringify({
        ...invitation,
        ...change,
      })),
    );
  }
});

test('rejects oversized and malformed input', () => {
  assert.throws(() => parseDeviceInvitation('x'.repeat(1025)));
  assert.throws(() => parseDeviceInvitation('{'));
});