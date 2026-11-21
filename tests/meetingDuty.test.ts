import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  validateMeetingDuty,
} from '../src/backend/domain/assignments/meetingDuty';

const command = {
  meetingId: 'a'.repeat(32),
  key: 'microphone-left',
  publisherId: 'b'.repeat(32),
  meetingRevision: 1,
  expectedRevision: 0,
};

test('named microphone slots are accepted', () => {
  assert.equal(validateMeetingDuty(command).ok, true);

  assert.equal(validateMeetingDuty({
    ...command,
    key: 'microphone-right',
  }).ok, true);
});

test('a duty can be explicitly unassigned', () => {
  const result = validateMeetingDuty({
    ...command,
    publisherId: null,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.value.publisherId, null);
  }
});

test('unknown duties and invalid revisions are rejected', () => {
  assert.equal(
    validateMeetingDuty({ ...command, key: 'unknown' }).ok,
    false,
  );

  assert.equal(
    validateMeetingDuty({
      ...command,
      expectedRevision: -1,
    }).ok,
    false,
  );
});