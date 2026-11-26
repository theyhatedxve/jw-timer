import assert from 'node:assert/strict';
import { test } from 'node:test';

import { meetingWeek } from '../src/backend/domain/meetings/meetingWeek';

test('Monday and Sunday belong to the same Monday-based week', () => {
  assert.equal(meetingWeek('2026-11-23'), '2026-11-23');
  assert.equal(meetingWeek('2026-11-29'), '2026-11-23');
});

test('handles year boundaries, leap days, and early years', () => {
  assert.equal(meetingWeek('2027-01-03'), '2026-12-28');
  assert.equal(meetingWeek('2024-02-29'), '2024-02-26');
  assert.equal(meetingWeek('0001-01-01'), '0001-01-01');
});

test('rejects invalid calendar dates', () => {
  for (const date of ['invalid', '2026-02-30', '2026-13-01']) {
    assert.throws(() => meetingWeek(date), /Invalid meeting date/);
  }
});
