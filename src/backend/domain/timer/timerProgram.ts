import type {
  MeetingDraft,
  MeetingType,
} from '../meetings/meeting.types';

import {
  isCalendarDate,
  isTimezone,
  MEETING_LIMITS,
  validateMeetingDraft,
} from '../meetings/meetingValidation';
import {
  createTimer,
  elapsed,
  isCheckpoint,
  MAX_TIMER_DURATION_MS,
  PART_TITLES,
  type TimerState,
  type TimerStatus,
} from './timer';

export interface TimedPart {
  readonly id: string;
  readonly title: string;
  readonly durationMs: number;
  readonly sectionTitle?: string;
  readonly sectionIndex?: number;
}

export interface TimerProgram {
  readonly meetingId: string | null;
  readonly revision: number;
  readonly title: string;
  readonly meetingDate?: string;
  readonly meetingType?: MeetingType;
  readonly timezone?: string;
  readonly parts: readonly TimedPart[];
}

export interface SessionCheckpoint {
  readonly schemaVersion: 2;
  readonly program: TimerProgram;
  readonly partIndex: number;
  readonly elapsedMs: number;
  readonly status: TimerStatus;
  readonly savedAtMs: number;
}

interface SavedProgramInput {
  readonly id: string;
  readonly revision: number;
  readonly draft: MeetingDraft;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validTitle(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= MEETING_LIMITS.titleLength
  );
}

export function isTimerProgram(
  value: unknown,
): value is TimerProgram {
  if (!isRecord(value)) return false;

  const meetingProgram = value.meetingId !== null;

  if (
    (
      meetingProgram &&
      (
        typeof value.meetingId !== 'string' ||
        !/^[a-f0-9]{32}$/.test(value.meetingId)
      )
    ) ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    (meetingProgram
      ? value.revision < 1
      : value.revision !== 0) ||
    !validTitle(value.title) ||
    (
      value.meetingDate !== undefined &&
      !isCalendarDate(value.meetingDate)
    ) ||
    (
      value.timezone !== undefined &&
      !isTimezone(value.timezone)
    ) ||
    (
      value.meetingType !== undefined &&
      value.meetingType !== 'midweek' &&
      value.meetingType !== 'weekend'
    ) ||
    !Array.isArray(value.parts) ||
    value.parts.length === 0 ||
    value.parts.length >
      MEETING_LIMITS.sectionCount *
      MEETING_LIMITS.partsPerSection
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const part of value.parts) {
    if (
      !isRecord(part) ||
      typeof part.id !== 'string' ||
      part.id.length === 0 ||
      part.id.length > 100 ||
      (meetingProgram && !/^[a-f0-9]{32}$/.test(part.id)) ||
      ids.has(part.id) ||
      !validTitle(part.title) ||
      typeof part.durationMs !== 'number' ||
      !Number.isSafeInteger(part.durationMs) ||
      part.durationMs <= 0 ||
      part.durationMs > MAX_TIMER_DURATION_MS ||
      (
        part.sectionTitle !== undefined &&
        !validTitle(part.sectionTitle)
      ) ||
      (
        part.sectionIndex !== undefined &&
        (
          typeof part.sectionIndex !== 'number' ||
          !Number.isSafeInteger(part.sectionIndex) ||
          part.sectionIndex < 0 ||
          part.sectionIndex >= MEETING_LIMITS.sectionCount
        )
      )
    ) {
      return false;
    }

    ids.add(part.id);
  }

  return true;
}

export function practiceProgram(
  durationMs = 10_000,
): TimerProgram {
  const program: TimerProgram = {
    meetingId: null,
    revision: 0,
    title: 'Practice program',
    parts: PART_TITLES.map((title, index) => ({
      id: `practice-${index + 1}`,
      title,
      durationMs,
    })),
  };

  if (!isTimerProgram(program)) {
    throw new Error('Invalid practice program.');
  }

  return program;
}

export function programFromMeeting(
  input: SavedProgramInput,
): TimerProgram {
  const validated = validateMeetingDraft(input.draft);

  if (!validated.ok) {
    throw new Error(validated.error.message);
  }

  const parts: TimedPart[] = [];

  for (
    const [sectionIndex, section]
      of validated.value.sections.entries()
  ) {
    for (const part of section.parts) {
      if (!part.isTimed) continue;

      if (!part.id) {
        throw new Error(
          'Save the meeting before opening its timer.',
        );
      }

      parts.push({
        id: part.id,
        title: part.title,
        durationMs: part.durationSeconds * 1000,
        sectionTitle: section.title,
        sectionIndex,
      });
    }
  }

  if (parts.length === 0) {
    throw new Error(
      'This meeting has no timed parts. Edit it and enable timing for at least one part.',
    );
  }

  const program: TimerProgram = {
    meetingId: input.id,
    revision: input.revision,
    title: validated.value.title,
    meetingDate: validated.value.meetingDate,
    meetingType: validated.value.meetingType,
    timezone: validated.value.timezone,
    parts,
  };

  if (!isTimerProgram(program)) {
    throw new Error('The saved timer program is invalid.');
  }

  return program;
}

export function createProgramTimer(
  program: TimerProgram,
): TimerState {
  if (!isTimerProgram(program)) {
    throw new Error('Invalid timer program.');
  }

  const first = program.parts[0];

  if (!first) throw new Error('The program has no timed parts.');

  return createTimer(first.durationMs);
}

export function isSessionCheckpoint(
  value: unknown,
): value is SessionCheckpoint {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 2 ||
    !isTimerProgram(value.program) ||
    typeof value.partIndex !== 'number' ||
    !Number.isSafeInteger(value.partIndex) ||
    value.partIndex < 0 ||
    value.partIndex >= value.program.parts.length ||
    typeof value.elapsedMs !== 'number' ||
    !Number.isSafeInteger(value.elapsedMs) ||
    value.elapsedMs < 0 ||
    typeof value.savedAtMs !== 'number' ||
    !Number.isSafeInteger(value.savedAtMs) ||
    value.savedAtMs < 0 ||
    typeof value.status !== 'string' ||
    !['ready', 'running', 'paused', 'completed'].includes(
      value.status,
    )
  ) {
    return false;
  }

  if (value.status === 'ready' && value.elapsedMs !== 0) {
    return false;
  }

  return (
    value.status !== 'completed' ||
    value.partIndex === value.program.parts.length - 1
  );
}

export function parseSessionCheckpoint(
  value: unknown,
): SessionCheckpoint {
  if (isSessionCheckpoint(value)) return value;

  // Convert a valid legacy checkpoint in memory.
  // The stored row changes only after an explicit save.
  if (isCheckpoint(value)) {
    const converted: SessionCheckpoint = {
      schemaVersion: 2,
      program: practiceProgram(value.durationMs),
      partIndex: value.partIndex,
      elapsedMs: value.elapsedMs,
      status: value.status,
      savedAtMs: value.savedAtMs,
    };

    if (isSessionCheckpoint(converted)) return converted;
  }

  throw new Error(
    'The saved timer checkpoint is invalid. No data was reset.',
  );
}

export function makeSessionCheckpoint(
  program: TimerProgram,
  state: TimerState,
  nowMs: number,
  savedAtMs: number,
): SessionCheckpoint {
  const part = program.parts[state.partIndex];

  if (!part || part.durationMs !== state.durationMs) {
    throw new Error('Timer state does not match its program.');
  }

  const saved: SessionCheckpoint = {
    schemaVersion: 2,
    program,
    partIndex: state.partIndex,
    elapsedMs: Math.floor(elapsed(state, nowMs)),
    status: state.status,
    savedAtMs,
  };

  if (!isSessionCheckpoint(saved)) {
    throw new Error('Invalid timer checkpoint.');
  }

  return saved;
}

export function restoreSession(
  saved: SessionCheckpoint,
): TimerState {
  const part = saved.program.parts[saved.partIndex];

  if (!part) throw new Error('Saved timer part is unavailable.');

  return {
    partIndex: saved.partIndex,
    durationMs: part.durationMs,
    elapsedBeforeMs: saved.elapsedMs,
    startedAtMs: null,
    status: saved.status === 'running'
      ? 'paused'
      : saved.status,
  };
}