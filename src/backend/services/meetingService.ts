import type {
  MeetingDraft,
  MeetingResult,
} from '../domain/meetings/meeting.types';

import { validateMeetingDraft } from '../domain/meetings/meetingValidation';

export interface SavedMeeting {
  readonly id: string;
  readonly revision: number;
  readonly updatedAt: number;
  readonly draft: MeetingDraft;
}

export interface MeetingSummary {
  readonly id: string;
  readonly revision: number;
  readonly title: string;
  readonly meetingDate: string;
  readonly meetingType: MeetingDraft['meetingType'];
}

export interface MeetingTarget {
  readonly id: string;
  readonly revision: number;
}

export interface MeetingRepository {
  list(): MeetingResult<readonly MeetingSummary[]>;
  get(id: string): MeetingResult<SavedMeeting | null>;
  save(
    draft: MeetingDraft,
    target: MeetingTarget | null,
  ): MeetingResult<SavedMeeting>;
}

function validId(id: string): boolean {
  return /^[a-f0-9]{32}$/.test(id);
}

export function createMeetingService(
  repository: MeetingRepository,
) {
  return {
    list: () => repository.list(),

    get(id: string): MeetingResult<SavedMeeting | null> {
      if (!validId(id)) {
        return {
          ok: false,
          error: { field: 'id', message: 'Invalid meeting identifier.' },
        };
      }

      return repository.get(id);
    },

    save(
      input: unknown,
      target: MeetingTarget | null,
    ): MeetingResult<SavedMeeting> {
      const result = validateMeetingDraft(input);

      if (!result.ok) return result;

      if (
        target !== null &&
        (
          !validId(target.id) ||
          !Number.isSafeInteger(target.revision) ||
          target.revision < 1 ||
          target.revision >= Number.MAX_SAFE_INTEGER
        )
      ) {
        return {
          ok: false,
          error: {
            field: 'revision',
            message: 'Invalid saved meeting version.',
          },
        };
      }

      return repository.save(result.value, target);
    },
  };
}

export type MeetingService = ReturnType<
  typeof createMeetingService
>;
