import type { MeetingDraft } from '../meetings/meeting.types';
import { validateMeetingDraft } from '../meetings/meetingValidation';
import {
  isMeetingDutyKey,
  MEETING_DUTY_SLOTS,
  type MeetingDutyKey,
} from '../assignments/meetingDuty';
import { isCongregationId } from '../profile/profile';

export const SHARED_SCHEDULE_LIMITS = {
  meetings: 25,
  characters: 65_536,
} as const;

export interface SharedDuty {
  readonly key: MeetingDutyKey;
  readonly publisherName: string | null;
}

export interface SharedMeeting {
  readonly id: string;
  readonly revision: number;
  readonly draft: MeetingDraft;
  readonly duties: readonly SharedDuty[];
}

export interface SharedSchedule {
  readonly version: 1;
  readonly congregationId: string;
  readonly createdAt: number;
  readonly meetings: readonly SharedMeeting[];
}

function record(input: unknown): Record<string, unknown> {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new Error('Invalid shared schedule');
  }

  return input as Record<string, unknown>;
}

function exact(
  value: Record<string, unknown>,
  fields: readonly string[],
): void {
  if (
    Object.keys(value).sort().join(',') !==
    [...fields].sort().join(',')
  ) {
    throw new Error('Unexpected schedule fields');
  }
}

export function parseSharedSchedule(
  input: unknown,
): SharedSchedule {
  const serialized = JSON.stringify(input);

  if (
    typeof serialized !== 'string' ||
    serialized.length > SHARED_SCHEDULE_LIMITS.characters
  ) {
    throw new Error('Shared schedule is too large');
  }

  const value = record(input);

  exact(value, [
    'version', 'congregationId', 'createdAt', 'meetings',
  ]);

  if (
    value.version !== 1 ||
    !isCongregationId(value.congregationId) ||
    typeof value.createdAt !== 'number' ||
    !Number.isSafeInteger(value.createdAt) ||
    value.createdAt < 0 ||
    !Array.isArray(value.meetings) ||
    value.meetings.length > SHARED_SCHEDULE_LIMITS.meetings
  ) {
    throw new Error('Invalid shared schedule header');
  }

  const ids = new Set<string>();

  const meetings = value.meetings.map(
    (inputMeeting): SharedMeeting => {
      const meeting = record(inputMeeting);

      exact(meeting, ['id', 'revision', 'draft', 'duties']);

      if (
        typeof meeting.id !== 'string' ||
        !/^[a-f0-9]{32}$/.test(meeting.id) ||
        ids.has(meeting.id) ||
        typeof meeting.revision !== 'number' ||
        !Number.isSafeInteger(meeting.revision) ||
        meeting.revision < 1 ||
        !Array.isArray(meeting.duties) ||
        meeting.duties.length !== MEETING_DUTY_SLOTS.length
      ) {
        throw new Error('Invalid shared meeting');
      }

      ids.add(meeting.id);

      const draft = validateMeetingDraft(meeting.draft);

      if (!draft.ok || draft.value.importSource !== undefined) {
        throw new Error('Invalid shared program');
      }

      const keys = new Set<MeetingDutyKey>();

      const duties = meeting.duties.map((inputDuty): SharedDuty => {
        const duty = record(inputDuty);

        exact(duty, ['key', 'publisherName']);

        if (
          !isMeetingDutyKey(duty.key) ||
          keys.has(duty.key) ||
          (
            duty.publisherName !== null &&
            (
              typeof duty.publisherName !== 'string' ||
              duty.publisherName !== duty.publisherName.trim() ||
              duty.publisherName.length < 1 ||
              duty.publisherName.length > 100
            )
          )
        ) {
          throw new Error('Invalid shared duty');
        }

        keys.add(duty.key);

        return {
          key: duty.key,
          publisherName: duty.publisherName,
        };
      });

      return {
        id: meeting.id,
        revision: meeting.revision,
        draft: draft.value,
        duties,
      };
    },
  );

  return {
    version: 1,
    congregationId: value.congregationId,
    createdAt: value.createdAt,
    meetings,
  };
}