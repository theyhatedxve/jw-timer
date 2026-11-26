import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PublisherStorageError,
  DutyError,
  decodePublisherRecord,
  decodeDutyForBackup,
} from '../src/backend/database/repositories/legacyStoredRecords';
import { MEETING_DUTY_SLOTS } from '../src/backend/domain/legacy/meetingDutyRecord';
import { isDeviceFingerprint } from '../src/backend/domain/legacy/deviceFingerprint';

const publisher = {
  id: 'a'.repeat(32),
  display_name: 'José',
  is_active: 1,
  revision: 2,
  updated_at: 100,
};

test('reads historical publisher metadata and responsibilities', () => {
  const result = decodePublisherRecord(publisher, ['sound']);

  assert.equal(result.id, publisher.id);
  assert.equal(result.displayName, 'José');
  assert.equal(result.isActive, true);
  assert.equal(result.revision, 2);
  assert.equal(result.updatedAt, 100);
  assert.deepEqual(result.roles, ['sound']);
});

test('rejects malformed historical publisher records', () => {
  for (const row of [
    { ...publisher, id: 'invalid' },
    { ...publisher, is_active: 2 },
    { ...publisher, revision: 0 },
    { ...publisher, updated_at: -1 },
    { ...publisher, display_name: '' },
  ]) {
    assert.throws(
      () => decodePublisherRecord(row, ['sound']),
      PublisherStorageError,
    );
  }

  assert.throws(
    () => decodePublisherRecord(publisher, ['sound', 'sound']),
    PublisherStorageError,
  );
});

test('accepts all four historical duties with explicit unassigned values', () => {
  for (const slot of MEETING_DUTY_SLOTS) {
    const result = decodeDutyForBackup({
      meeting_id: 'b'.repeat(32),
      duty_key: slot.key,
      publisher_id: null,
      revision: 1,
    });

    assert.equal(result.key, slot.key);
    assert.equal(result.publisherId, null);
  }
});

test('rejects invalid historical duty metadata', () => {
  const row = {
    meeting_id: 'b'.repeat(32),
    duty_key: 'mic-server',
    publisher_id: null,
    revision: 1,
  };

  for (const invalid of [
    { ...row, meeting_id: 'invalid' },
    { ...row, duty_key: 'unsupported' },
    { ...row, publisher_id: 'invalid' },
    { ...row, revision: 0 },
  ]) {
    assert.throws(() => decodeDutyForBackup(invalid), DutyError);
  }
});

test('validates historical device fingerprint format', () => {
  assert.equal(isDeviceFingerprint(`sha256:${'a'.repeat(64)}`), true);

  for (const value of [
    null,
    '',
    `sha256:${'a'.repeat(63)}`,
    `sha256:${'A'.repeat(64)}`,
    `sha1:${'a'.repeat(64)}`,
  ]) {
    assert.equal(isDeviceFingerprint(value), false);
  }
});
