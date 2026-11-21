import type { PublisherDraft } from '../publishers/publisher';
import { canAssign } from './assignment';

import {
  hasDutyConflict,
  MEETING_DUTY_SLOTS,
  type MeetingDuty,
  type MeetingDutyKey,
} from './meetingDuty';

import {
  checkMeetingOverlap,
  type MeetingSchedule,
} from './meetingOverlap';

export interface ReviewMeeting {
  readonly schedule: MeetingSchedule;
  readonly duties: readonly MeetingDuty[];
}

export type DutyReviewIssue =
  | { readonly kind: 'publisher' | 'duplicate' }
  | {
      readonly kind: 'conflict' | 'unverified';
      readonly meetingId: string;
    };

export function reviewMeetingDuty(
  target: ReviewMeeting,
  key: MeetingDutyKey,
  publisher: PublisherDraft | null,
  meetings: readonly ReviewMeeting[],
): readonly DutyReviewIssue[] {
  const assignment = target.duties.find(duty => duty.key === key);
  const publisherId = assignment?.publisherId;

  if (!publisherId) return [];

  const issues: DutyReviewIssue[] = [];
  const definition = MEETING_DUTY_SLOTS.find(slot => slot.key === key);

  if (
    !publisher ||
    !definition ||
    !canAssign(publisher, definition.role)
  ) {
    issues.push({ kind: 'publisher' });
  }

  if (
    hasDutyConflict(
      target.duties,
      target.schedule.id,
      key,
      publisherId,
    )
  ) {
    issues.push({ kind: 'duplicate' });
  }

  const others = meetings
    .filter(meeting =>
      meeting.schedule.id !== target.schedule.id &&
      meeting.duties.some(duty => duty.publisherId === publisherId),
    )
    .map(meeting => meeting.schedule);

  const overlap = checkMeetingOverlap(target.schedule, others);

  if (overlap.kind !== 'clear') issues.push(overlap);

  return issues;
}