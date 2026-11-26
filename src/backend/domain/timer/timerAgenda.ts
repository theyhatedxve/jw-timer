import {
  createTimer,
  elapsed,
  type TimerState,
} from './timer';

import {
  isTimerProgram,
  makeSessionCheckpoint,
  type TimerProgram,
} from './timerProgram';

export function selectProgramPart(
  program: TimerProgram,
  index: number,
): TimerState {
  if (
    !isTimerProgram(program) ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= program.parts.length
  ) {
    throw new Error('Invalid selected part.');
  }

  const part = program.parts[index];

  if (!part) throw new Error('Selected part is unavailable.');

  return {
    ...createTimer(part.durationMs),
    partIndex: index,
  };
}

export function switchProgramPart(
  program: TimerProgram,
  state: TimerState,
  index: number,
  nowMs: number,
): TimerState {
  const selected = selectProgramPart(program, index);
  const saved = makeSessionCheckpoint(program, state, nowMs, 0);
  const progress = saved.partElapsedMs
    ? [...saved.partElapsedMs]
    : program.parts.map(() => 0);
  progress[state.partIndex] = saved.elapsedMs;
  const selectedElapsed = progress[index] ?? 0;

  return {
    ...selected,
    partElapsedMs: progress,
    elapsedBeforeMs: selectedElapsed,
    status: selectedElapsed > 0 ? 'paused' : 'ready',
  };
}

export function remainingProgramMs(
  program: TimerProgram,
  state: TimerState,
  nowMs: number,
): number {
  if (state.status === 'completed') return 0;

  const part = program.parts[state.partIndex];

  if (!part || part.durationMs !== state.durationMs) {
    throw new Error('Timer state does not match the program.');
  }

  const currentRemaining = Math.max(
    0,
    state.durationMs - elapsed(state, nowMs),
  );

  const laterRemaining = program.parts
    .slice(state.partIndex + 1)
    .reduce((total, item, offset) => total + Math.max(
      0,
      item.durationMs - (state.partElapsedMs?.[state.partIndex + 1 + offset] ?? 0),
    ), 0);

  return currentRemaining + laterRemaining;
}