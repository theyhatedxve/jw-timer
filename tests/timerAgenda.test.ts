import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createTimer,
  elapsed,
  pause,
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
  estimatedProgramFinishMs,
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

test('finish estimate stays fixed while running and moves later during pauses', () => {
  const running = start(selectProgramPart(program, 0), 1000);
  const finish = estimatedProgramFinishMs(program, running, 1000, 101000);
  assert.equal(finish, 131000);
  assert.equal(estimatedProgramFinishMs(program, running, 6000, 106000, finish), finish);

  const paused = pause(running, 6000);
  assert.equal(elapsed(paused, 60000), 5000);
  assert.equal(estimatedProgramFinishMs(program, paused, 7000, 107000, finish), finish + 1000);
  assert.equal(estimatedProgramFinishMs(program, paused, 60000, 160000, finish), 185000);

  const resumed = start(paused, 60000);
  assert.equal(estimatedProgramFinishMs(program, resumed, 60000, 160000, finish), 185000);
  assert.equal(estimatedProgramFinishMs(program, resumed, 65000, 165000, finish), 185000);
});

test('running overtime adds to the finish without consuming later allotted time', () => {
  const running = start(selectProgramPart(program, 0), 1000);
  assert.equal(estimatedProgramFinishMs(program, running, 11000, 111000), 131000);
  const overtimeFinish = estimatedProgramFinishMs(program, running, 16000, 116000);
  assert.equal(overtimeFinish, 136000);
  assert.equal(
    estimatedProgramFinishMs(program, pause(running, 16000), 60000, 160000, overtimeFinish),
    overtimeFinish + 44000,
  );
});

test('finish estimate uses saved remaining durations when a selected part starts', () => {
  const first = start(selectProgramPart(program, 0), 1000);
  const second = switchProgramPart(program, first, 1, 3750);
  const returning = switchProgramPart(program, start(second, 5000), 0, 6500);
  const resumed = start(returning, 10000);
  assert.equal(estimatedProgramFinishMs(program, resumed, 10000, 110000), 135750);
});

test('initial ready estimate includes all upcoming parts and completion retains the finish', () => {
  const ready = selectProgramPart(program, 0);
  assert.equal(estimatedProgramFinishMs(program, ready, 0, 100000), 130000);
  assert.equal(estimatedProgramFinishMs(program, ready, 5000, 105000, 130000), 135000);
  const completed = next(next(ready, 0, [10000, 20000]), 0, [10000, 20000]);
  assert.equal(estimatedProgramFinishMs(program, completed, 60000, 160000, 130000), 130000);
});
