import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { meetingWeek } from '../../backend/domain/assignments/assignment';
import { isCalendarDate } from '../../backend/domain/meetings/meetingValidation';

import type { MeetingType } from '../../backend/domain/meetings/meeting.types';
import type {
  MeetingService,
  MeetingSummary,
  SavedMeeting,
} from '../../backend/services/meetingService';

import { meetingProgramsEn as text } from '../../constants/strings/meetingProgramsEn';
import { useLocalProfile } from './useLocalProfile';

import {
  currentMeetingWeek,
  meetingsInWeek,
  shiftMeetingWeek,
} from '../utils/meetingCalendar';

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'ready';
      readonly matches: readonly MeetingSummary[];
      readonly meeting: SavedMeeting | null;
    };

interface Selection {
  week: string | null;
  type: MeetingType;
  meetingId: string | null;
}

export function useMeetings(service: MeetingService) {
  const navigation = useNavigation();
  const { state: profileState } = useLocalProfile();

  const timezone = profileState.status === 'ready'
    ? profileState.profile?.timezone
    : undefined;

  const selected = useRef<Selection>({
    week: null,
    type: 'midweek',
    meetingId: null,
  });

  const timerRequest = useRef(0);
  const [state, setState] = useState<State>({ status: 'loading' });

  const reload = useCallback(() => {
    try {
      if (!timezone) {
        setState({ status: 'error', message: text.profileError });
        return;
      }

      const selection = selected.current;
      const week = selection.week ?? currentMeetingWeek(timezone);
      selection.week = week;

      const listed = service.list();

      if (!listed.ok) {
        setState({ status: 'error', message: listed.error.message });
        return;
      }

      const matches = meetingsInWeek(listed.value, week, selection.type);

      const candidate =
        matches.find(meeting => meeting.id === selection.meetingId) ??
        matches[0];

      selection.meetingId = candidate?.id ?? null;

      if (!candidate) {
        setState({ status: 'ready', matches, meeting: null });
        return;
      }

      const loaded = service.get(candidate.id);

      if (!loaded.ok) {
        setState({ status: 'error', message: loaded.error.message });
        return;
      }

      if (
        !loaded.value ||
        loaded.value.draft.meetingType !== selection.type ||
        meetingWeek(loaded.value.draft.meetingDate) !== week
      ) {
        setState({ status: 'error', message: text.missing });
        return;
      }

      setState({
        status: 'ready',
        matches,
        meeting: loaded.value,
      });
    } catch {
      setState({ status: 'error', message: text.error });
    }
  }, [service, timezone]);

  useFocusEffect(
    useCallback(() => {
      reload();
      AccessibilityInfo.announceForAccessibility(text.title);

      const subscription = AppState.addEventListener('change', next => {
        if (next === 'active') reload();
      });

      return () => subscription.remove();
    }, [reload]),
  );

  function selectType(type: MeetingType): void {
    selected.current.type = type;
    selected.current.meetingId = null;
    reload();
  }

  function moveWeek(direction: -1 | 1): void {
    const current = selected.current.week;
    if (!current) return;

    const next = shiftMeetingWeek(current, direction);
    if (!next) return;

    selected.current.week = next;
    selected.current.meetingId = null;
    reload();
  }

  function selectDate(input: string): boolean {
    const date = input.trim();
    if (!isCalendarDate(date)) return false;

    selected.current.week = meetingWeek(date);
    selected.current.meetingId = null;
    reload();
    return true;
  }

  function selectMeeting(id: string): void {
    if (
      state.status !== 'ready' ||
      !state.matches.some(meeting => meeting.id === id)
    ) {
      return;
    }

    selected.current.meetingId = id;
    reload();
  }

  const week = selected.current.week;

  return {
    state,
    week,
    meetingType: selected.current.type,
    reload,
    selectType,
    selectDate,
    selectMeeting,
    canPrevious: week !== null && shiftMeetingWeek(week, -1) !== null,
    canNext: week !== null && shiftMeetingWeek(week, 1) !== null,
    previousWeek: () => moveWeek(-1),
    nextWeek: () => moveWeek(1),

    createMeeting: () => navigation.navigate('MeetingEditor', {}),

    openMeeting: (meetingId: string) =>
      navigation.navigate('MeetingEditor', { meetingId }),

    openTimer: (meetingId: string) => {
      timerRequest.current += 1;

      navigation.navigate('PracticeTimer', {
        meetingId,
        requestId: `${Date.now()}-${timerRequest.current}`,
      });
    },
  };
}
