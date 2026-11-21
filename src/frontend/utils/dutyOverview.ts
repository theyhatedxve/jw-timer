import { meetingWeek } from '../../backend/domain/assignments/assignment';

import {
  MEETING_DUTY_SLOTS,
  type MeetingDutyKey,
} from '../../backend/domain/assignments/meetingDuty';

import {
  reviewMeetingDuty,
  type DutyReviewIssue,
  type ReviewMeeting,
} from '../../backend/domain/assignments/dutyReview';

import type { SavedPublisher } from '../../backend/services/publisherService';

import { meetingDutyEn as text } from '../../constants/strings/meetingDutyEn';
import { dutyReviewEn as reviewText } from '../../constants/strings/dutyReviewEn';

export interface DutyOverviewRow {
  readonly key: MeetingDutyKey;
  readonly label: string;
  readonly name: string;
  readonly notices: readonly string[];
}

export interface DutyOverviewEntry {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly rows: readonly DutyOverviewRow[];
}

function reviewMessage(
  issue: DutyReviewIssue,
  meetings: readonly ReviewMeeting[],
): string {
  switch (issue.kind) {
    case 'publisher':
      return reviewText.publisher;
    case 'duplicate':
      return reviewText.duplicate;
    case 'conflict':
    case 'unverified': {
      const title = meetings.find(
        meeting => meeting.schedule.id === issue.meetingId,
      )?.schedule.title ?? text.unavailable;

      return issue.kind === 'conflict'
        ? reviewText.conflict(title)
        : reviewText.unverified(title);
    }
  }
}

export function buildDutyOverview(
  meetings: readonly ReviewMeeting[],
  publishers: readonly SavedPublisher[],
): readonly DutyOverviewEntry[] {
  const peopleById = new Map(
    publishers.map(person => [person.id, person]),
  );

  return meetings.map(meeting => ({
    id: meeting.schedule.id,
    title: meeting.schedule.title,
    date: meeting.schedule.meetingDate,
    rows: MEETING_DUTY_SLOTS.map(slot => {
      const assignment = meeting.duties.find(
        duty => duty.key === slot.key,
      );

      const person = assignment?.publisherId
        ? peopleById.get(assignment.publisherId)
        : undefined;

      const issues = reviewMeetingDuty(
        meeting,
        slot.key,
        person ?? null,
        meetings,
      );

      return {
        key: slot.key,
        label: text.labels[slot.key],
        name: assignment?.publisherId
          ? person?.displayName ?? text.review
          : text.notAssigned,
        notices: issues.map(issue => reviewMessage(issue, meetings)),
      };
    }),
  }));
}

export function dutyEntriesForWeek(
  entries: readonly DutyOverviewEntry[],
  week: string,
): readonly DutyOverviewEntry[] {
  return entries
    .filter(entry => meetingWeek(entry.date) === week)
    .sort((left, right) =>
      left.date.localeCompare(right.date) ||
      left.id.localeCompare(right.id),
    );
}
