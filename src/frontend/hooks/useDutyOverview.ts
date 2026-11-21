import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { MEETING_DUTY_SLOTS } from '../../backend/domain/assignments/meetingDuty';
import type { MeetingService } from '../../backend/services/meetingService';
import type { PublisherService } from '../../backend/services/publisherService';
import type { MeetingDutyService } from '../../backend/services/meetingDutyService';
import { meetingDutyEn as text } from '../../constants/strings/meetingDutyEn';

interface Entry {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly rows: readonly {
    readonly key: string;
    readonly label: string;
    readonly name: string;
  }[];
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

    const names = new Map(people.value.map(person => [person.id, person.displayName]));
    const result: Entry[] = [];

    for (const meeting of programs.value) {
      const saved = duties.list(meeting.id);
      if (!saved.ok) {
        failed(saved.error.message);
        return;
      }

      result.push({
        id: meeting.id,
        title: meeting.title,
        date: meeting.meetingDate,
        rows: MEETING_DUTY_SLOTS.map(slot => {
          const assignment = saved.value.find(duty => duty.key === slot.key);
          return {
            key: slot.key,
            label: text.labels[slot.key],
            name: assignment?.publisherId
              ? names.get(assignment.publisherId) ?? text.review
              : text.notAssigned,
          };
        }),
      });
    }

    setEntries(result);
    setReady(true);
  }, [meetings, publishers, duties]);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  return { entries, ready, error, reload };
}
