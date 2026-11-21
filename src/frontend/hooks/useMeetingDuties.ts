import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  MEETING_DUTY_SLOTS,
  hasDutyConflict,
  type MeetingDuty,
  type MeetingDutyKey,
} from '../../backend/domain/assignments/meetingDuty';

import { canAssign } from '../../backend/domain/assignments/assignment';

import type {
  MeetingService,
  SavedMeeting,
} from '../../backend/services/meetingService';

import type {
  PublisherService,
  SavedPublisher,
} from '../../backend/services/publisherService';

import type {
  MeetingDutyService,
} from '../../backend/services/meetingDutyService';

import { meetingDutyEn as text } from '../../constants/strings/meetingDutyEn';

interface Data {
  readonly meeting: SavedMeeting;
  readonly publishers: readonly SavedPublisher[];
  readonly duties: readonly MeetingDuty[];
}

export function useMeetingDuties(
  meetings: MeetingService,
  publishers: PublisherService,
  duties: MeetingDutyService,
  meetingId: string,
) {
  const saving = useRef(false);
  const [data, setData] = useState<Data | null>(null);
  const [selected, setSelected] = useState<MeetingDutyKey | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    const meeting = meetings.get(meetingId);

    if (!meeting.ok || !meeting.value) {
      setData(null);
      setError(meeting.ok ? text.unavailable : meeting.error.message);
      return;
    }

    const people = publishers.list();

    if (!people.ok) {
      setData(null);
      setError(people.error.message);
      return;
    }

    const saved = duties.list(meetingId);

    if (!saved.ok) {
      setData(null);
      setError(saved.error.message);
      return;
    }

    setData({
      meeting: meeting.value,
      publishers: people.value,
      duties: saved.value,
    });
    setError('');
    setSelected(null);
  }, [meetings, publishers, duties, meetingId]);

  useFocusEffect(useCallback(() => {
    reload();
  }, [reload]));

  const rows = MEETING_DUTY_SLOTS.map(definition => {
    const saved = data?.duties.find(
      duty => duty.key === definition.key,
    );

    const person = data?.publishers.find(
      publisher => publisher.id === saved?.publisherId,
    );

    return {
      key: definition.key,
      label: text.labels[definition.key],
      name: saved?.publisherId
        ? person?.displayName ?? text.review
        : text.notAssigned,
      needsReview:
        saved?.publisherId != null &&
        (!person || !canAssign(person, definition.role)),
    };
  });

  const definition = MEETING_DUTY_SLOTS.find(
    duty => duty.key === selected,
  );

  const savedDuties = data?.duties ?? [];

    const eligible = definition
    ? data?.publishers.filter(person =>
        canAssign(person, definition.role) &&
        !hasDutyConflict(
            savedDuties,
            meetingId,
            definition.key,
            person.id,
        ),
        ) ?? []
    : [];

  function assign(publisherId: string | null) {
    if (!data || !selected || saving.current) return;

    const previous = data.duties.find(
      duty => duty.key === selected,
    );

    saving.current = true;
    setBusy(true);
    setError('');

    try {
      const result = duties.save({
        meetingId: data.meeting.id,
        key: selected,
        publisherId,
        meetingRevision: data.meeting.revision,
        expectedRevision: previous?.revision ?? 0,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      reload();
    } catch {
      setError(text.saveError);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return {
    ready: data !== null,
    title: data?.meeting.draft.title ?? text.title,
    rows,
    selected,
    current: rows.find(row => row.key === selected),
    eligible,
    error,
    busy,
    reload,
    assign,
    selectDuty: (key: MeetingDutyKey | null) => {
      if (saving.current) return;
      setSelected(key);
      setError('');
    },
  };
}