import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createHomeService } from '../src/backend/services/homeService';
import type { SavedMeeting } from '../src/backend/services/meetingService';
import type { MeetingDuty } from '../src/backend/domain/assignments/meetingDuty';

const now = Date.UTC(2026, 10, 21, 17);

function meeting(id: string, date: string): SavedMeeting {
  return {
    id,
    revision: 1,
    updatedAt: 1,
    draft: {
      title: 'Test program',
      meetingType: 'midweek',
      meetingDate: date,
      startLocalTime: null,
      timezone: 'Asia/Manila',
      programLanguage: 'en',
      sections: [{
        title: 'Test section',
        parts: [
          { title: 'Timed', kind: 'talk', durationSeconds: 60, isTimed: true },
          { title: 'Untimed', kind: 'other', durationSeconds: 90, isTimed: false },
        ],
      }],
    },
  };
}

function fixture(
  records: readonly SavedMeeting[],
  assigned: readonly MeetingDuty[] = [],
  failDuties = false,
) {
  return createHomeService({
    profiles: {
      load: () => ({
        ok: true,
        value: {
          recordVersion: 1,
          interfaceLanguage: 'en',
          revision: 1,
          name: 'Test',
          timezone: 'Asia/Manila',
          programLanguage: 'en',
        },
      }),
    },
    meetings: {
      list: () => ({
        ok: true,
        value: records.map(record => ({
          id: record.id,
          revision: record.revision,
          title: record.draft.title,
          meetingDate: record.draft.meetingDate,
          meetingType: record.draft.meetingType,
        })),
      }),
      get: id => ({
        ok: true,
        value: records.find(record => record.id === id) ?? null,
      }),
    },
    duties: {
      list: () => failDuties
        ? { ok: false, error: { field: 'storage', message: 'Unavailable' } }
        : { ok: true, value: assigned },
    },
  });
}

test('empty data returns no meeting and the next local midnight', () => {
  const result = fixture([]).load(now);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.next, null);
  assert.equal(result.value.refreshAt, Date.UTC(2026, 10, 22, 16));
});

test('selection uses the congregation date instead of the UTC date', () => {
  const result = fixture([
    meeting('a'.repeat(32), '2026-11-21'),
    meeting('b'.repeat(32), '2026-11-22'),
  ]).load(now);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.next?.meeting.id, 'b'.repeat(32));
});

test('same-date meetings have a stable identifier tie-break', () => {
  const result = fixture([
    meeting('b'.repeat(32), '2026-11-22'),
    meeting('a'.repeat(32), '2026-11-22'),
  ]).load(now);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.next?.meeting.id, 'a'.repeat(32));
});

test('totals include all parts but only timed duration and filled slots', () => {
  const id = 'a'.repeat(32);
  const publisherId = 'c'.repeat(32);

  const result = fixture([meeting(id, '2026-11-22')], [
    { meetingId: id, key: 'mic-server', publisherId, revision: 1 },
    { meetingId: id, key: 'sound-operator', publisherId: null, revision: 1 },
  ]).load(now);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.next?.partCount, 2);
  assert.equal(result.value.next?.durationSeconds, 60);
  assert.equal(result.value.next?.assignedSlots, 1);
});

test('failed duty reads do not present a false zero count', () => {
  const service = fixture(
    [meeting('a'.repeat(32), '2026-11-22')],
    [],
    true,
  );

  assert.deepEqual(service.load(now), { ok: false });
});