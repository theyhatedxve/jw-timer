import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createHomeService } from '../src/backend/services/homeService';
import type { SavedMeeting } from '../src/backend/services/meetingService';

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
      startLocalTime: '18:30',
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

function fixture(records: readonly SavedMeeting[]) {
  return createHomeService({
    sessions: { load: () => null },
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

test('totals include all parts but only timed duration', () => {
  const result = fixture([
    meeting('a'.repeat(32), '2026-11-22'),
  ]).load(now);

  assert.ok(result.ok);
  assert.ok(result.value.next);
  assert.equal(result.value.next.partCount, 2);
  assert.equal(result.value.next.durationSeconds, 60);
});
