import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { MEETING_DUTY_SLOTS } from '../../backend/domain/assignments/meetingDuty';

import {
  reviewMeetingDuty,
  type DutyReviewIssue,
  type ReviewMeeting,
} from '../../backend/domain/assignments/dutyReview';

import type { MeetingService } from '../../backend/services/meetingService';
import type { PublisherService } from '../../backend/services/publisherService';
import type { MeetingDutyService } from '../../backend/services/meetingDutyService';

import { meetingDutyEn as text } from '../../constants/strings/meetingDutyEn';
import { dutyReviewEn as reviewText } from '../../constants/strings/dutyReviewEn';

interface Entry {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly rows: readonly {
    readonly key: string;
    readonly label: string;
    readonly name: string;
    readonly notices: readonly string[];
  }[];
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

export function useDutyOverview(
  meetings: MeetingService,
  publishers: PublisherService,
  duties: MeetingDutyService,
) {
  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setReady(false);
    setError('');

    function failed(message: string) {
      setEntries([]);
      setError(message);
      setReady(true);
    }

    const programs = meetings.list();

    if (!programs.ok) {
      failed(programs.error.message);
      return;
    }

    const people = publishers.list();

    if (!people.ok) {
      failed(people.error.message);
      return;
    }

    const loaded: ReviewMeeting[] = [];

    for (const summary of programs.value) {
      const meeting = meetings.get(summary.id);

      if (!meeting.ok || !meeting.value) {
        failed(
          meeting.ok ? text.unavailable : meeting.error.message,
        );
        return;
      }

      const saved = duties.list(summary.id);

      if (!saved.ok) {
        failed(saved.error.message);
        return;
      }

      loaded.push({
        schedule: {
          ...meeting.value.draft,
          id: meeting.value.id,
        },
        duties: saved.value,
      });
    }

    const peopleById = new Map(
      people.value.map(person => [person.id, person]),
    );

    const result: Entry[] = loaded.map(meeting => ({
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
          loaded,
        );

        return {
          key: slot.key,
          label: text.labels[slot.key],
          name: assignment?.publisherId
            ? person?.displayName ?? text.review
            : text.notAssigned,
          notices: issues.map(issue =>
            reviewMessage(issue, loaded),
          ),
        };
      }),
    }));

    setEntries(result);
    setReady(true);
  }, [meetings, publishers, duties]);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  return { entries, ready, error, reload };
}