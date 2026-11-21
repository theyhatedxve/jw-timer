import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseStoredProfile } from '../src/backend/domain/profile/profile';

const profile = {
  name: 'Example Congregation',
  timezone: 'Asia/Manila',
  programLanguage: 'en',
  recordVersion: 1,
  interfaceLanguage: 'en',
  revision: 1,
};

test('older profiles remain readable', () => {
  assert.equal(parseStoredProfile(profile).ok, true);
});

test('preserves the congregation ID when parsing edits', () => {
  const congregationId = 'a'.repeat(32);

  const result = parseStoredProfile({
    ...profile,
    name: 'Updated congregation name',
    congregationId,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.value.congregationId, congregationId);
  }
});

test('rejects malformed congregation IDs', () => {
  assert.equal(parseStoredProfile({
    ...profile,
    congregationId: 'invalid',
  }).ok, false);
});