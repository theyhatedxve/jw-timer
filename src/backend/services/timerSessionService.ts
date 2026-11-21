import type { MeetingResult } from '../domain/meetings/meeting.types';
import type { TimerState } from '../domain/timer/timer';

import {
  makeSessionCheckpoint,
  practiceProgram,
  programFromMeeting,
  type SessionCheckpoint,
  type TimerProgram,
} from '../domain/timer/timerProgram';

import type { MeetingService } from './meetingService';

export interface TimerCheckpointRepository {
  read(): SessionCheckpoint | null;
  write(value: SessionCheckpoint): void;
  info(): string;
}

export function createTimerSessionService(
  meetings: MeetingService,
  checkpoints: TimerCheckpointRepository,
) {
  return {
    load: () => checkpoints.read(),
    info: () => checkpoints.info(),
    practice: practiceProgram,

    forMeeting(id: string): MeetingResult<TimerProgram> {
      if (typeof id !== 'string') {
        return {
          ok: false,
          error: {
            field: 'program',
            message: 'Invalid meeting identifier.',
          },
        };
      }

      const result = meetings.get(id);

      if (!result.ok) return result;

      if (!result.value) {
        return {
          ok: false,
          error: {
            field: 'program',
            message: 'This meeting is no longer available.',
          },
        };
      }

      try {
        return {
          ok: true,
          value: programFromMeeting(result.value),
        };
      } catch (error) {
        return {
          ok: false,
          error: {
            field: 'program',
            message: error instanceof Error
              ? error.message
              : 'The meeting could not be loaded.',
          },
        };
      }
    },

    save(
      program: TimerProgram,
      state: TimerState,
      nowMs: number,
      savedAtMs: number,
    ): SessionCheckpoint {
      const saved = makeSessionCheckpoint(
        program,
        state,
        nowMs,
        savedAtMs,
      );

      checkpoints.write(saved);
      return saved;
    },
  };
}

export type TimerSessionService = ReturnType<
  typeof createTimerSessionService
>;