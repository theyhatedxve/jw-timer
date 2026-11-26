import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createTimer,
  elapsed,
  restart,
  next,
  start,
} from '../src/backend/domain/timer/timer';

import {
  isTimerProgram,
  makeSessionCheckpoint,
  parseSessionCheckpoint,
  restoreSession,
  type TimerProgram,
} from '../src/backend/domain/timer/timerProgram';

import {
  remainingProgramMs,
  selectProgramPart,
  switchProgramPart,
} from '../src/backend/domain/timer/timerAgenda';

const program: TimerProgram = {
  meetingId: null,
  revision: 0,
  title: 'Sample program',
  parts: [
    {
      id: 'first',
      title: 'First part',
      durationMs: 10_000,
    },
    {
      id: 'second',
      title: 'Second part',
      durationMs: 20_000,
    },
  ],
};

test('selecting a row loads Ready without starting', () => {
  const selected = selectProgramPart(program, 1);

  assert.equal(selected.partIndex, 1);
  assert.equal(selected.durationMs, 20_000);
  assert.equal(selected.status, 'ready');
  assert.equal(selected.elapsedBeforeMs, 0);
  assert.equal(selected.startedAtMs, null);
});

test('selection rejects an unavailable row', () => {
  assert.throws(() => selectProgramPart(program, -1));
  assert.throws(() => selectProgramPart(program, 2));
});

test('remaining time includes the active and later parts', () => {
  const running = start(createTimer(10_000), 1000);

  assert.equal(
    remainingProgramMs(program, running, 6000),
    25_000,
  );
});

test('overtime does not subtract from later allotted time', () => {
  const running = start(createTimer(10_000), 1000);

  assert.equal(
    remainingProgramMs(program, running, 15_000),
    20_000,
  );
});

test('a completed program has no remaining scheduled time', () => {
  const durations = [10_000, 20_000];

  const second = next(createTimer(), 0, durations);
  const completed = next(second, 0, durations);

  assert.equal(
    remainingProgramMs(program, completed, 0),
    0,
  );
});

test('optional date metadata rejects impossible dates', () => {
  assert.equal(
    isTimerProgram({
      ...program,
      meetingDate: '2026-02-30',
    }),
    false,
  );

  assert.equal(isTimerProgram(program), true);
});

test('switching timers preserves elapsed time for each part and resumes from it', () => {
  const first = start(selectProgramPart(program, 0), 1000);
  const second = switchProgramPart(program, first, 1, 3750);
  assert.equal(second.status, 'ready');

  const returning = switchProgramPart(program, start(second, 5000), 0, 6500);
  assert.equal(returning.elapsedBeforeMs, 2750);
  assert.equal(returning.status, 'paused');
  assert.equal(elapsed(start(returning, 8000), 9000), 3750);
  assert.equal(remainingProgramMs(program, returning, 6500), 7250 + 18500);

  const saved = makeSessionCheckpoint(program, returning, 6500, 10000);
  const recovered = restoreSession(parseSessionCheckpoint(JSON.parse(JSON.stringify(saved))));
  const secondAgain = switchProgramPart(program, recovered, 1, 7000);
  assert.equal(secondAgain.elapsedBeforeMs, 1500);
  assert.equal(secondAgain.status, 'paused');
});

test('Restart part clears only that part while retaining other timers', () => {
  const second = switchProgramPart(program, start(selectProgramPart(program, 0), 0), 1, 3000);
  const firstAgain = switchProgramPart(program, start(second, 4000), 0, 6000);
  const resetFirst = restart(firstAgain);
  const returnSecond = switchProgramPart(program, resetFirst, 1, 7000);
  assert.equal(returnSecond.elapsedBeforeMs, 2000);
  assert.equal(switchProgramPart(program, returnSecond, 0, 8000).elapsedBeforeMs, 0);
});

test('timer history retains overtime and rejects malformed persisted progress', () => {
  const second = switchProgramPart(program, start(selectProgramPart(program, 0), 0), 1, 12000);
  const firstAgain = switchProgramPart(program, second, 0, 13000);
  assert.equal(firstAgain.elapsedBeforeMs, 12000);
  const saved = makeSessionCheckpoint(program, firstAgain, 13000, 20000);
  assert.throws(() => parseSessionCheckpoint({ ...saved, partElapsedMs: [1] }));
  assert.throws(() => parseSessionCheckpoint({ ...saved, partElapsedMs: [-1, 0] }));
  assert.throws(() => parseSessionCheckpoint({ ...saved, partElapsedMs: [0, 0] }));
  assert.throws(() => parseSessionCheckpoint({ ...saved, partElapsedMs: [12000, 0.5] }));
});

test('legacy session checkpoints can begin preserving per-part elapsed time', () => {
  const saved = makeSessionCheckpoint(program, start(selectProgramPart(program, 0), 1000), 5000, 10000);
  assert.equal(saved.partElapsedMs, undefined);
  const recovered = restoreSession(saved);
  const second = switchProgramPart(program, recovered, 1, 6000);
  const firstAgain = switchProgramPart(program, second, 0, 7000);
  assert.equal(firstAgain.elapsedBeforeMs, 4000);
});
