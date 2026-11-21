import {
  validateMeetingDuty,
  type MeetingDuty,
  type MeetingDutyCommand,
} from '../domain/assignments/meetingDuty';

import type { ScheduleResult } from '../domain/assignments/assignment';
import { validPublisherId } from '../domain/publishers/publisher';

export interface MeetingDutyRepository {
  list(meetingId: string):
    ScheduleResult<readonly MeetingDuty[]>;

  save(command: MeetingDutyCommand):
    ScheduleResult<MeetingDuty>;
}

export function createMeetingDutyService(
  repository: MeetingDutyRepository,
) {
  return {
    list(meetingId: string):
      ScheduleResult<readonly MeetingDuty[]> {
      if (!validPublisherId(meetingId)) {
        return {
          ok: false,
          error: {
            field: 'meeting',
            message: 'Invalid meeting identifier.',
          },
        };
      }

      return repository.list(meetingId);
    },

    save(input: unknown): ScheduleResult<MeetingDuty> {
      const result = validateMeetingDuty(input);

      if (!result.ok) return result;

      return repository.save(result.value);
    },
  };
}

export type MeetingDutyService =
  ReturnType<typeof createMeetingDutyService>;