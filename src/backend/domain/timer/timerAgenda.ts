import {
  createTimer,
  elapsed,
  type TimerState,
} from './timer';

import {
  isTimerProgram,
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
    .reduce((total, item) => total + item.durationMs, 0);

  return currentRemaining + laterRemaining;
}