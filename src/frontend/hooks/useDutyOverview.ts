import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { meetingWeek } from '../../backend/domain/assignments/assignment';
import { isCalendarDate } from '../../backend/domain/meetings/meetingValidation';

import type { ReviewMeeting } from '../../backend/domain/assignments/dutyReview';
import type { MeetingService } from '../../backend/services/meetingService';
import type { PublisherService } from '../../backend/services/publisherService';
import type { MeetingDutyService } from '../../backend/services/meetingDutyService';

import { meetingDutyEn as text } from '../../constants/strings/meetingDutyEn';
import { dutyOverviewEn } from '../../constants/strings/dutyOverviewEn';

import { useLocalProfile } from './useLocalProfile';
import {
  currentMeetingWeek,
  shiftMeetingWeek,
} from '../utils/meetingCalendar';

import {
  buildDutyOverview,
  dutyEntriesForWeek,
  type DutyOverviewEntry,
} from '../utils/dutyOverview';

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'ready';
      readonly entries: readonly DutyOverviewEntry[];
      readonly selectedId: string | null;
    };

export function useDutyOverview(
  meetings: MeetingService,
  publishers: PublisherService,
  duties: MeetingDutyService,
) {
  const { state: profileState } = useLocalProfile();

  const timezone = profileState.status === 'ready'
    ? profileState.profile?.timezone
    : undefined;

  const selection = useRef<{
    week: string | null;
    meetingId: string | null;
  }>({ week: null, meetingId: null });

  const [state, setState] = useState<State>({ status: 'loading' });

  const reload = useCallback(() => {
    function failed(message: string): void {
      setState({ status: 'error', message });
    }

    try {
      if (!timezone) {
        failed(dutyOverviewEn.profileError);
        return;
      }

      const week = selection.current.week ?? currentMeetingWeek(timezone);
      selection.current.week = week;

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
          failed(meeting.ok ? text.unavailable : meeting.error.message);
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

      const reviewed = buildDutyOverview(loaded, people.value);
      const entries = dutyEntriesForWeek(reviewed, week);

      const chosen =
        entries.find(entry => entry.id === selection.current.meetingId) ??
        entries[0];

      selection.current.meetingId = chosen?.id ?? null;

      setState({
        status: 'ready',
        entries,
        selectedId: selection.current.meetingId,
      });
    } catch {
      failed(dutyOverviewEn.error);
    }
  }, [meetings, publishers, duties, timezone]);

  useFocusEffect(
    useCallback(() => {
      reload();

      const subscription = AppState.addEventListener('change', next => {
        if (next === 'active') reload();
      });

      return () => subscription.remove();
    }, [reload]),
  );

  function moveWeek(direction: -1 | 1): void {
    const week = selection.current.week;
    if (!week) return;

    const next = shiftMeetingWeek(week, direction);
    if (!next) return;

    selection.current.week = next;
    selection.current.meetingId = null;
    reload();
  }

  function selectDate(input: string): boolean {
    const date = input.trim();
    if (!isCalendarDate(date)) return false;

    selection.current.week = meetingWeek(date);
    selection.current.meetingId = null;
    reload();
    return true;
  }

  function selectMeeting(id: string): void {
    if (
      state.status !== 'ready' ||
      !state.entries.some(entry => entry.id === id)
    ) {
      return;
    }

    selection.current.meetingId = id;
    setState({ ...state, selectedId: id });
  }

  const week = selection.current.week;
  const entries = state.status === 'ready' ? state.entries : [];

  const selectedMeeting = state.status === 'ready'
    ? entries.find(entry => entry.id === state.selectedId) ?? null
    : null;

  return {
    entries,
    selectedMeeting,
    ready: state.status !== 'loading',
    error: state.status === 'error' ? state.message : '',
    week,
    reload,
    selectDate,
    selectMeeting,
    canPrevious: week !== null && shiftMeetingWeek(week, -1) !== null,
    canNext: week !== null && shiftMeetingWeek(week, 1) !== null,
    previousWeek: () => moveWeek(-1),
    nextWeek: () => moveWeek(1),
  };
}
