import {
  elapsed,
  type TimerState,
} from '../../backend/domain/timer/timer';

export function timerProgressPercent(
  timer: TimerState,
  nowMs: number,
): number {
  return Math.floor(Math.min(
    100,
    Math.max(0, elapsed(timer, nowMs) / timer.durationMs * 100),
  ));
}
