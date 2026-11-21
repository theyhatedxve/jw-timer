import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  checkpoint,
  createTimer,
  elapsed,
  next,
  start,
} from '../src/backend/domain/timer/timer';

import {
  createProgramTimer,
  makeSessionCheckpoint,
  parseSessionCheckpoint,
  programFromMeeting,
  restoreSession,
} from '../src/backend/domain/timer/timerProgram';

function meeting() {
  return {
    id: 'a'.repeat(32),
    revision: 1,
    draft: {
      title: 'Midweek program',
      meetingType: 'midweek' as const,
      meetingDate: '2026-11-25',
      startLocalTime: '18:30',
      timezone: 'Asia/Manila',
      programLanguage: 'en' as const,
      sections: [
        {
          id: 'b'.repeat(32),
          title: 'First section',
          parts: [
            {
              id: '1'.repeat(32),
              title: 'First timed part',
              kind: 'talk' as const,
              durationSeconds: 10,
              isTimed: true,
            },
            {
              id: '2'.repeat(32),
              title: 'Untimed prayer',
              kind: 'prayer' as const,
              durationSeconds: 0,
              isTimed: false,
            },
            {
              id: '3'.repeat(32),
              title: 'Second timed part',
              kind: 'study' as const,
              durationSeconds: 20,
              isTimed: true,
            },
            {
              id: '4'.repeat(32),
              title: 'Third timed part',
              kind: 'comments' as const,
              durationSeconds: 30,
              isTimed: true,
            },
          ],
        },
      ],
    },
  };
}

test('program preserves order and excludes untimed parts', () => {
  const program = programFromMeeting(meeting());

  assert.deepEqual(
    program.parts.map(part => part.title),
    [
      'First timed part',
      'Second timed part',
      'Third timed part',
    ],
  );

  assert.deepEqual(
    program.parts.map(part => part.durationMs),
    [10_000, 20_000, 30_000],
  );
});

test('meeting timer stays Ready until explicit Start', () => {
  const state = createProgramTimer(
    programFromMeeting(meeting()),
  );

  assert.equal(state.status, 'ready');
  assert.equal(elapsed(state, 50_000), 0);
});

test('Next uses each duration and waits for Start', () => {
  const program = programFromMeeting(meeting());
  const durations = program.parts.map(part => part.durationMs);

  const first = start(createProgramTimer(program), 1000);
  const second = next(first, 15_000, durations);

  assert.equal(first.status, 'running');
  assert.equal(first.partIndex, 0);
  assert.equal(second.partIndex, 1);
  assert.equal(second.durationMs, 20_000);
  assert.equal(second.status, 'ready');

  const third = next(second, 20_000, durations);

  assert.equal(third.partIndex, 2);
  assert.equal(third.durationMs, 30_000);
  assert.equal(third.status, 'ready');
  assert.equal(next(third, 25_000, durations).status, 'completed');
});

test('recovery keeps the snapshot and restores paused', () => {
  const input = meeting();
  const program = programFromMeeting(input);

  const saved = makeSessionCheckpoint(
    program,
    start(createProgramTimer(program), 1000),
    5000,
    100_000,
  );

  input.draft.title = 'Changed meeting title';

  const restored = restoreSession(
    parseSessionCheckpoint(
      JSON.parse(JSON.stringify(saved)),
    ),
  );

  assert.equal(saved.program.title, 'Midweek program');
  assert.equal(restored.status, 'paused');
  assert.equal(restored.startedAtMs, null);
  assert.equal(elapsed(restored, 900_000), 4000);
});

test('legacy checkpoints remain readable', () => {
  const legacy = checkpoint(createTimer(), 0, 1000);
  const converted = parseSessionCheckpoint(legacy);

  assert.equal(converted.schemaVersion, 2);
  assert.equal(converted.program.meetingId, null);
  assert.equal(converted.program.parts.length, 2);
  assert.equal(restoreSession(converted).status, 'ready');
});

test('invalid checkpoint indexes are rejected', () => {
  const program = programFromMeeting(meeting());

  const saved = makeSessionCheckpoint(
    program,
    createProgramTimer(program),
    0,
    1000,
  );

  assert.throws(() =>
    parseSessionCheckpoint({
      ...saved,
      partIndex: program.parts.length,
    }),
  );
});

test('a program without timed parts is rejected', () => {
  const input = meeting();

  input.draft.sections = [];

  assert.throws(
    () => programFromMeeting(input),
    /no timed parts/,
  );
});