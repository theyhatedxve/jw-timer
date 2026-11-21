import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseSharedSchedule,
  SHARED_SCHEDULE_LIMITS,
} from '../src/backend/domain/devices/sharedSchedule';

const duties = [
  'mic-server', 'sound-operator', 'laptop-operator', 'microphone-adjuster',
].map(key => ({ key, publisherName: null }));

function fixture() {
  return {
    version: 1,
    congregationId: 'a'.repeat(32),
    createdAt: 1,
    meetings: [{
      id: 'b'.repeat(32),
      revision: 1,
      draft: {
        title: 'Midweek Meeting',
        meetingType: 'midweek',
        meetingDate: '2026-11-25',
        startLocalTime: '18:00',
        endLocalTime: '20:00',
        timezone: 'Asia/Manila',
        programLanguage: 'war',
        sections: [],
      },
      duties: duties.map(duty => ({ ...duty })),
    }],
  };
}

test('accepts a program with exactly the four technical duties', () => {
  const parsed = parseSharedSchedule(fixture());
  assert.equal(parsed.meetings[0]?.duties.length, 4);
  assert.equal(parsed.meetings[0]?.draft.programLanguage, 'war');
});

test('rejects additional or repeated duty types', () => {
  const extra = fixture();
  extra.meetings[0]!.duties.push({ key: 'reader', publisherName: null });
  assert.throws(() => parseSharedSchedule(extra));
  const repeated = fixture();
  repeated.meetings[0]!.duties[1]!.key = 'mic-server';
  assert.throws(() => parseSharedSchedule(repeated));
});

test('rejects duplicate meeting identifiers', () => {
  const value = fixture();
  value.meetings.push(structuredClone(value.meetings[0]!));
  assert.throws(() => parseSharedSchedule(value));
});

test('rejects invalid programs, scopes, and oversized payloads', () => {
  const program = fixture();
  program.meetings[0]!.draft.meetingDate = '2026-02-30';
  assert.throws(() => parseSharedSchedule(program));
  const scope = fixture();
  scope.congregationId = 'invalid';
  assert.throws(() => parseSharedSchedule(scope));
  assert.throws(() => parseSharedSchedule({
    ...fixture(),
    extra: 'x'.repeat(SHARED_SCHEDULE_LIMITS.characters),
  }));
});

test('rejects unexpected top-level data', () => {
  assert.throws(() => parseSharedSchedule({ ...fixture(), timerCheckpoint: {} }));
});
