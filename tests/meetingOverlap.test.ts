import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  checkMeetingOverlap,
  type MeetingSchedule,
} from '../src/backend/domain/legacy/meetingOverlap';

const first: MeetingSchedule = {
  id: 'first',
  title: 'First meeting',
  meetingDate: '2026-11-25',
  startLocalTime: '18:30',
  endLocalTime: '20:00',
  timezone: 'Asia/Manila',
};

const second: MeetingSchedule = {
  ...first,
  id: 'second',
  title: 'Second meeting',
};

test('rejects overlap and containment', () => {
  for (const times of [
    ['19:00', '21:00'],
    ['18:00', '21:00'],
    ['19:00', '19:30'],
  ] as const) {
    assert.equal(
      checkMeetingOverlap(first, [{
        ...second,
        startLocalTime: times[0],
        endLocalTime: times[1],
      }]).kind,
      'conflict',
    );
  }
});

test('allows touching boundaries and another date', () => {
  for (const other of [
    { ...second, startLocalTime: '20:00', endLocalTime: '21:00' },
    { ...second, startLocalTime: '17:00', endLocalTime: '18:30' },
    { ...second, meetingDate: '2026-11-26' },
  ]) {
    assert.equal(
      checkMeetingOverlap(first, [other]).kind,
      'clear',
    );
  }
});

test('compares different time zones as actual instants', () => {
  assert.equal(
    checkMeetingOverlap(first, [{
      ...second,
      timezone: 'UTC',
      startLocalTime: '11:00',
      endLocalTime: '12:30',
    }]).kind,
    'conflict',
  );
});

test('reports missing times as unverified', () => {
  assert.equal(
    checkMeetingOverlap(
      { ...first, endLocalTime: null },
      [],
    ).kind,
    'unverified',
  );

  assert.equal(
    checkMeetingOverlap(first, [{
      ...second,
      startLocalTime: null,
    }]).kind,
    'unverified',
  );
});

test('rejects ambiguous and nonexistent daylight-saving times', () => {
  for (const meetingDate of ['2026-03-08', '2026-11-01']) {
    assert.equal(
      checkMeetingOverlap({
        ...first,
        meetingDate,
        timezone: 'America/New_York',
        startLocalTime:
          meetingDate === '2026-03-08' ? '02:15' : '01:15',
        endLocalTime: '03:30',
      }, []).kind,
      'unverified',
    );
  }
});
