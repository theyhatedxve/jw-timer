import type { PublisherRole } from '../publishers/publisher';

import { validPublisherId } from '../publishers/publisher';
import type { ScheduleResult } from './assignment';

export const MEETING_DUTY_SLOTS = [
  { key: 'sound', role: 'sound' },
  { key: 'timer', role: 'timer' },
  { key: 'attendant', role: 'attendant' },
  { key: 'microphone-left', role: 'microphones' },
  { key: 'microphone-right', role: 'microphones' },
] as const satisfies readonly {
  key: string;
  role: PublisherRole;
}[];

export type MeetingDutyKey =
  typeof MEETING_DUTY_SLOTS[number]['key'];

export interface MeetingDuty {
  readonly meetingId: string;
  readonly key: MeetingDutyKey;
  readonly publisherId: string | null;
  readonly revision: number;
}

export function isMeetingDutyKey(
  value: unknown,
): value is MeetingDutyKey {
  return MEETING_DUTY_SLOTS.some(slot => slot.key === value);
}

export interface MeetingDutyCommand {
  readonly meetingId: string;
  readonly key: MeetingDutyKey;
  readonly publisherId: string | null;
  readonly meetingRevision: number;
  readonly expectedRevision: number;
}

export function validateMeetingDuty(
  input: unknown,
): ScheduleResult<MeetingDutyCommand> {
  if (typeof input !== 'object' || input === null) {
    return {
      ok: false,
      error: { field: 'duty', message: 'Invalid meeting duty.' },
    };
  }

  const value = input as Record<string, unknown>;

  if (
    !validPublisherId(value.meetingId) ||
    !isMeetingDutyKey(value.key) ||
    (
      value.publisherId !== null &&
      !validPublisherId(value.publisherId)
    ) ||
    typeof value.meetingRevision !== 'number' ||
    !Number.isSafeInteger(value.meetingRevision) ||
    value.meetingRevision < 1 ||
    typeof value.expectedRevision !== 'number' ||
    !Number.isSafeInteger(value.expectedRevision) ||
    value.expectedRevision < 0 ||
    value.expectedRevision >= Number.MAX_SAFE_INTEGER
  ) {
    return {
      ok: false,
      error: { field: 'duty', message: 'Invalid duty information.' },
    };
  }

  return {
    ok: true,
    value: {
      meetingId: value.meetingId,
      key: value.key,
      publisherId: value.publisherId,
      meetingRevision: value.meetingRevision,
      expectedRevision: value.expectedRevision,
    },
  };
}