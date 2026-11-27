import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createHomeService } from '../src/backend/services/homeService';
import type { SavedMeeting } from '../src/backend/services/meetingService';
import type { SessionCheckpoint } from '../src/backend/domain/timer/timerProgram';

function program(
  id: string,
  date: string,
  parser: 'wol-v1' | 'workbook-v2',
  startLocalTime: string | null = null,
  meetingType: 'midweek' | 'weekend' = 'midweek',
): SavedMeeting {
  return {
    id, revision: 1, updatedAt: 0,
    draft: {
      title: 'Imported program', meetingType, meetingDate: date,
      startLocalTime, timezone: 'Asia/Manila', programLanguage: 'en',
      importSource: parser === 'wol-v1'
        ? { filename: 'WOL program', page: 1, parser, url: 'https://wol.jw.org/en/wol/d/r1/lp-e/202026404', retrievedAt: '2026-11-23T00:00:00.000Z' }
        : { filename: 'mwb_E_202611.pdf', page: 1, parser },
      sections: [{
        title: 'Agenda',
        parts: [
          { title: 'Talk', kind: 'talk', durationSeconds: 600, isTimed: true },
          { title: 'Prayer', kind: 'prayer', durationSeconds: 0, isTimed: false },
        ],
      }],
    },
  };
}

function home(records: readonly SavedMeeting[], timezone = 'Asia/Manila', saved: SessionCheckpoint | null = null) {
  return createHomeService({
    sessions: { load: () => saved },
    profiles: { load: () => ({
      ok: true,
      value: {
        recordVersion: 1, revision: 1, name: 'Local profile',
        timezone, programLanguage: 'en', interfaceLanguage: 'en',
      },
    }) },
    meetings: {
      list: () => ({
        ok: true,
        value: records.map(saved => ({
          id: saved.id, revision: saved.revision, title: saved.draft.title,
          meetingDate: saved.draft.meetingDate, meetingType: saved.draft.meetingType,
        })),
      }),
      get: id => ({ ok: true, value: records.find(saved => saved.id === id) ?? null }),
    },
  });
}

const friday = Date.UTC(2026, 10, 27, 5);

test('Home shows current-week online and PDF programs after their Monday week key', () => {
  for (const parser of ['wol-v1', 'workbook-v2'] as const) {
    for (const type of ['midweek', 'weekend'] as const) {
      const current = program('a'.repeat(32), '2026-11-23', parser, null, type);
      const upcoming = program('b'.repeat(32), '2026-11-30', 'workbook-v2');
      const result = home([upcoming, current]).load(friday);
      assert.ok(result.ok);
      assert.equal(result.value.next?.meeting.id, current.id);
      assert.equal(result.value.next?.partCount, 2);
      assert.equal(result.value.next?.durationSeconds, 600);
    }
  }
});

test('Home excludes past scheduled meetings and programs from previous weeks', () => {
  const old = program('a'.repeat(32), '2026-11-16', 'wol-v1');
  const scheduled = program('b'.repeat(32), '2026-11-25', 'workbook-v2', '18:30');
  const future = program('c'.repeat(32), '2026-11-30', 'wol-v1');
  const result = home([old, scheduled, future]).load(friday);
  assert.ok(result.ok);
  assert.equal(result.value.next?.meeting.id, future.id);
  const empty = home([old, scheduled]).load(friday);
  assert.ok(empty.ok);
  assert.equal(empty.value.next, null);
});

test('Home uses the profile time zone when the current week changes', () => {
  const current = program('a'.repeat(32), '2026-11-23', 'wol-v1');
  const mondayInManila = Date.UTC(2026, 10, 29, 17);
  const manila = home([current]).load(mondayInManila);
  const newYork = home([current], 'America/New_York').load(mondayInManila);
  assert.ok(manila.ok);
  assert.ok(newYork.ok);
  assert.equal(manila.value.next, null);
  assert.equal(newYork.value.next?.meeting.id, current.id);
});

test('Home recent session uses the actual saved part and remaining time without a future meeting', () => {
  const saved: SessionCheckpoint = {
    schemaVersion: 2,
    program: {
      meetingId: 'a'.repeat(32), revision: 1, title: 'Saved meeting',
      parts: [{ id: 'b'.repeat(32), title: 'Karantahon 158', durationMs: 300000 }],
    },
    partIndex: 0, elapsedMs: 5000, status: 'paused', savedAtMs: friday,
  };
  const result = home([], 'Asia/Manila', saved).load(friday);
  assert.ok(result.ok);
  assert.equal(result.value.next, null);
  assert.deepEqual(result.value.recent, {
    partTitle: 'Karantahon 158', digits: '04:55', status: 'paused',
  });
  assert.equal(saved.status, 'paused');
  assert.equal(saved.elapsedMs, 5000);

  const overtime = home([], 'Asia/Manila', { ...saved, elapsedMs: 302000, status: 'running' }).load(friday);
  assert.ok(overtime.ok);
  assert.deepEqual(overtime.value.recent, {
    partTitle: 'Karantahon 158', digits: '+00:02', status: 'running',
  });
});

test('Home does not manufacture a recent session from practice data or an empty checkpoint', () => {
  const practice: SessionCheckpoint = {
    schemaVersion: 2,
    program: {
      meetingId: null, revision: 0, title: 'Practice program',
      parts: [{ id: 'practice-1', title: 'Synthetic part', durationMs: 10000 }],
    },
    partIndex: 0, elapsedMs: 0, status: 'ready', savedAtMs: friday,
  };
  for (const saved of [null, practice]) {
    const result = home([], 'Asia/Manila', saved).load(friday);
    assert.ok(result.ok);
    assert.equal(result.value.recent, null);
  }
});
