import { Temporal } from '@js-temporal/polyfill';

import { meetingWeek } from '../../backend/domain/meetings/meetingWeek';
import { isCalendarDate } from '../../backend/domain/meetings/meetingValidation';

import type { MeetingType } from '../../backend/domain/meetings/meeting.types';
import type { MeetingSummary } from '../../backend/services/meetingService';

export function currentMeetingWeek(
  timezone: string,
  now = Date.now(),
): string {
  const date = Temporal.Instant
    .fromEpochMilliseconds(now)
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toString();

  return meetingWeek(date);
}

export function shiftMeetingWeek(
  start: string,
  direction: -1 | 1,
): string | null {
  try {
    const next = Temporal.PlainDate
      .from(meetingWeek(start))
      .add({ weeks: direction })
      .toString();

    return isCalendarDate(next) ? next : null;
  } catch {
    return null;
  }
}

export function meetingsInWeek(
  meetings: readonly MeetingSummary[],
  start: string,
  type: MeetingType,
): readonly MeetingSummary[] {
  return meetings
    .filter(meeting =>
      meeting.meetingType === type &&
      meetingWeek(meeting.meetingDate) === start,
    )
    .sort((left, right) =>
      left.meetingDate.localeCompare(right.meetingDate) ||
      left.id.localeCompare(right.id),
    );
}

/** Monday-first calendar cells, padded to whole weeks without time-zone conversion. */
export function calendarMonthDays(value: string): readonly (string | null)[] {
  const first = Temporal.PlainDate.from(value).with({ day: 1 });
  const cells: (string | null)[] = Array.from(
    { length: first.dayOfWeek - 1 },
    () => null,
  );
  for (let day = 1; day <= first.daysInMonth; day += 1) {
    cells.push(first.with({ day }).toString());
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function shiftCalendarMonth(value: string, direction: -1 | 1): string | null {
  try {
    const next = Temporal.PlainDate.from(value).with({ day: 1 })
      .add({ months: direction }).toString();
    return isCalendarDate(next) ? next : null;
  } catch {
    return null;
  }
}
