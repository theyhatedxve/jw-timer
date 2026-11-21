import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MEETING_DUTY_SLOTS,
  validateMeetingDuty,
} from '../src/backend/domain/assignments/meetingDuty';

const command = {
  meetingId: 'a'.repeat(32),
  publisherId: 'b'.repeat(32),
  meetingRevision: 1,
  expectedRevision: 0,
};

test('only the four technical duties are offered', () => {
  assert.deepEqual(
    MEETING_DUTY_SLOTS.map(slot => slot.key),
    ['mic-server', 'sound-operator', 'laptop-operator', 'microphone-adjuster'],
  );
  for (const slot of MEETING_DUTY_SLOTS) {
    assert.equal(validateMeetingDuty({ ...command, key: slot.key }).ok, true);
  }
});

test('old duty keys are rejected for new assignments', () => {
  for (const key of ['timer', 'attendant', 'microphone-left']) {
    assert.equal(validateMeetingDuty({ ...command, key }).ok, false);
  }
});

test('assignments can be cleared and invalid revisions rejected', () => {
  assert.equal(validateMeetingDuty({ ...command, key: 'mic-server', publisherId: null }).ok, true);
  assert.equal(validateMeetingDuty({ ...command, key: 'mic-server', expectedRevision: -1 }).ok, false);
});
