import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createTimer,
  next,
  start,
} from '../src/backend/domain/timer/timer';

import {
  isTimerProgram,
  type TimerProgram,
} from '../src/backend/domain/timer/timerProgram';

import {
  remainingProgramMs,
  selectProgramPart,
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