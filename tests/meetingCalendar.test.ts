import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  currentMeetingWeek,
  meetingsInWeek,
  shiftMeetingWeek,
} from '../src/frontend/utils/meetingCalendar';

import { sectionTone } from '../src/constants/meetingProgramTheme';
import type { MeetingSummary } from '../src/backend/services/meetingService';

function meeting(
  id: string,
  meetingDate: string,
  meetingType: 'midweek' | 'weekend',
): MeetingSummary {
  return { id, revision: 1, title: id, meetingDate, meetingType };
}

test('current week uses congregation time zone at a UTC boundary', () => {
  const now = Date.UTC(2026, 10, 22, 17);

  assert.equal(currentMeetingWeek('Asia/Manila', now), '2026-11-23');
  assert.equal(currentMeetingWeek('America/New_York', now), '2026-11-16');
});

test('week navigation crosses year and leap-day boundaries', () => {
  assert.equal(shiftMeetingWeek('2026-12-28', 1), '2027-01-04');
  assert.equal(shiftMeetingWeek('2024-02-26', 1), '2024-03-04');
  assert.equal(shiftMeetingWeek('2024-03-04', -1), '2024-02-26');
});

test('invalid dates and unsupported year navigation fail safely', () => {
  assert.equal(shiftMeetingWeek('2026-02-30', 1), null);
  assert.equal(shiftMeetingWeek('9999-12-27', 1), null);
});

test('filters by Monday-based week and meeting type without mutating input', () => {
  const records = [
    meeting('b', '2026-11-25', 'midweek'),
    meeting('c', '2026-11-29', 'weekend'),
    meeting('a', '2026-11-25', 'midweek'),
    meeting('d', '2026-11-30', 'midweek'),
  ];

  const original = [...records];

  assert.deepEqual(
    meetingsInWeek(records, '2026-11-23', 'midweek').map(value => value.id),
    ['a', 'b'],
  );

  assert.deepEqual(records, original);
  assert.deepEqual(meetingsInWeek(records, '2026-12-07', 'midweek'), []);
});

test('recognized headings get colors while custom titles stay neutral', () => {
  assert.equal(sectionTone('Treasures from God’s Word'), 'treasures');
  assert.equal(sectionTone('Magin Mas Epektibo ha Ministeryo'), 'ministry');
  assert.equal(sectionTone('Pagkinabuhi Sugad nga mga Kristiano'), 'living');
  assert.equal(sectionTone('Custom discussion'), 'neutral');
});
