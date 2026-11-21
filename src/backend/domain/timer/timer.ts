export type TimerStatus = 'ready' | 'running' | 'paused' | 'completed';

export interface TimerState {
  readonly partIndex: number;
  readonly durationMs: number;
  readonly elapsedBeforeMs: number;
  readonly startedAtMs: number | null;
  readonly status: TimerStatus;
}

export interface TimerCheckpoint {
  readonly schemaVersion: 1;
  readonly partIndex: number;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly status: TimerStatus;
  readonly savedAtMs: number;
}

export const PART_TITLES = ['Synthetic part 1', 'Synthetic part 2'] as const;

export function createTimer(durationMs = 10_000): TimerState {
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0 || durationMs > 3_600_000) {
    throw new Error('Prototype duration must be between 1 ms and 60 minutes.');
  }
  return { partIndex: 0, durationMs, elapsedBeforeMs: 0, startedAtMs: null, status: 'ready' };
}

export function elapsed(state: TimerState, nowMs: number): number {
  return state.elapsedBeforeMs + (
    state.status === 'running' && state.startedAtMs !== null
      ? Math.max(0, nowMs - state.startedAtMs) : 0
  );
}

export function start(state: TimerState, nowMs: number): TimerState {
  if (state.status !== 'ready' && state.status !== 'paused') return state;
  return { ...state, status: 'running', startedAtMs: nowMs };
}

export function pause(state: TimerState, nowMs: number): TimerState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', elapsedBeforeMs: elapsed(state, nowMs), startedAtMs: null };
}

export function restart(state: TimerState): TimerState {
  return { ...state, status: 'ready', elapsedBeforeMs: 0, startedAtMs: null };
}

export function next(state: TimerState, nowMs: number): TimerState {
  if (state.status === 'completed') return state;
  if (state.partIndex === PART_TITLES.length - 1) {
    return { ...state, status: 'completed', elapsedBeforeMs: elapsed(state, nowMs), startedAtMs: null };
  }
  return { ...restart(state), partIndex: state.partIndex + 1 };
}

export function checkpoint(state: TimerState, nowMs: number, savedAtMs: number): TimerCheckpoint {
  return {
    schemaVersion: 1, partIndex: state.partIndex, durationMs: state.durationMs,
    elapsedMs: Math.floor(elapsed(state, nowMs)), status: state.status, savedAtMs,
  };
}

export function recover(saved: TimerCheckpoint): TimerState {
  return {
    partIndex: saved.partIndex, durationMs: saved.durationMs,
    elapsedBeforeMs: saved.elapsedMs, startedAtMs: null,
    status: saved.status === 'running' ? 'paused' : saved.status,
  };
}

export function isCheckpoint(value: unknown): value is TimerCheckpoint {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return row.schemaVersion === 1 &&
    typeof row.partIndex === 'number' && Number.isInteger(row.partIndex) &&
    row.partIndex >= 0 && row.partIndex < PART_TITLES.length &&
    typeof row.durationMs === 'number' && Number.isSafeInteger(row.durationMs) &&
    row.durationMs > 0 && row.durationMs <= 3_600_000 &&
    typeof row.elapsedMs === 'number' && Number.isSafeInteger(row.elapsedMs) && row.elapsedMs >= 0 &&
    typeof row.savedAtMs === 'number' && Number.isSafeInteger(row.savedAtMs) && row.savedAtMs >= 0 &&
    typeof row.status === 'string' && ['ready', 'running', 'paused', 'completed'].includes(row.status);
}

export function formatTime(state: TimerState, nowMs: number): string {
  const remaining = state.durationMs - elapsed(state, nowMs);
  const seconds = remaining > 0 ? Math.ceil(remaining / 1000) : Math.floor(-remaining / 1000);
  const digits = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return remaining <= 0 ? `+${digits}` : digits;
}
