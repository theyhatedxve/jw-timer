import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  currentMeetingWeek,
  calendarMonthDays,
  shiftCalendarMonth,
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

test('calendar grids align Monday first and include leap-day without time-zone conversion', () => {
  const february = calendarMonthDays('2024-02-17');
  assert.equal(february.length, 35);
  assert.deepEqual(february.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.ok(february.includes('2024-02-29'));
  assert.equal(february.filter(Boolean).length, 29);
  assert.equal(calendarMonthDays('2026-02-01').filter(Boolean).length, 28);
  assert.equal(calendarMonthDays('2026-11-23').length, 42);
});

test('calendar month navigation crosses years and respects supported date bounds', () => {
  assert.equal(shiftCalendarMonth('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftCalendarMonth('2024-03-31', -1), '2024-02-01');
  assert.equal(shiftCalendarMonth('0001-01-01', -1), null);
  assert.equal(shiftCalendarMonth('9999-12-01', 1), null);
  assert.equal(shiftCalendarMonth('invalid', 1), null);
});
