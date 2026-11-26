import { Temporal } from '@js-temporal/polyfill';

import {
  isCalendarDate,
  isTimezone,
} from '../meetings/meetingValidation';

export interface MeetingSchedule {
  readonly id: string;
  readonly title: string;
  readonly meetingDate: string;
  readonly startLocalTime: string | null;
  readonly endLocalTime?: string | null;
  readonly timezone: string;
}

export type OverlapResult =
  | { readonly kind: 'clear' }
  | {
      readonly kind: 'conflict' | 'unverified';
      readonly meetingId: string;
    };

function interval(
  meeting: MeetingSchedule,
): { start: number; end: number } | null {
  const start = meeting.startLocalTime;
  const end = meeting.endLocalTime;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !isCalendarDate(meeting.meetingDate) ||
    !isTimezone(meeting.timezone) ||
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    !timePattern.test(start) ||
    !timePattern.test(end) ||
    end <= start
  ) {
    return null;
  }

  try {
    const toInstant = (time: string): number =>
      Temporal.ZonedDateTime.from(
        `${meeting.meetingDate}T${time}[${meeting.timezone}]`,
        { disambiguation: 'reject' },
      ).epochMilliseconds;

    const startInstant = toInstant(start);
    const endInstant = toInstant(end);

    return endInstant > startInstant
      ? { start: startInstant, end: endInstant }
      : null;
  } catch {
    return null;
  }
}

export function checkMeetingOverlap(
  target: MeetingSchedule,
  others: readonly MeetingSchedule[],
): OverlapResult {
  const current = interval(target);

  if (!current) {
    return { kind: 'unverified', meetingId: target.id };
  }

  let unverifiedId: string | null = null;

  for (const other of others) {
    if (other.id === target.id) continue;

    const candidate = interval(other);

    if (!candidate) {
      unverifiedId ??= other.id;
      continue;
    }

    if (
      current.start < candidate.end &&
      candidate.start < current.end
    ) {
      return { kind: 'conflict', meetingId: other.id };
    }
  }

  return unverifiedId === null
    ? { kind: 'clear' }
    : { kind: 'unverified', meetingId: unverifiedId };
}
