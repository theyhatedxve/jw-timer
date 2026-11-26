import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { meetingWeek } from '../../backend/domain/meetings/meetingWeek';
import { isCalendarDate, MEETING_LIMITS } from '../../backend/domain/meetings/meetingValidation';

import type { OnlineWorkbookImporter } from '../../backend/services/onlineWorkbookImport';
import type { MeetingPartDraft, MeetingSectionDraft, MeetingType } from '../../backend/domain/meetings/meeting.types';
import type {
  MeetingService,
  MeetingSummary,
  SavedMeeting,
} from '../../backend/services/meetingService';

import { meetingProgramsEn as text } from '../../constants/strings/meetingProgramsEn';
import { useLocalProfile } from './useLocalProfile';
import { useOnlineWorkbookImport } from './useOnlineWorkbookImport';
import type { MainTabParamList } from '../navigation/types';

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

export function useMeetings(service: MeetingService, importer: OnlineWorkbookImporter) {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainTabParamList, 'Meetings'>>();
  const requested = route.params;
  const handledSelection = useRef<string | null>(null);
  const { state: profileState } = useLocalProfile();

  const profile = profileState.status === 'ready' ? profileState.profile : null;
  const timezone = profile?.timezone;

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
      const requestKey = requested?.meetingId + ':' + requested?.requestId;
      if (requested?.meetingId && handledSelection.current !== requestKey) {
        const requestedMeeting = service.get(requested.meetingId);
        if (!requestedMeeting.ok || !requestedMeeting.value) {
          setState({ status: 'error', message: text.missing });
          return;
        }
        selection.week = meetingWeek(requestedMeeting.value.draft.meetingDate);
        selection.type = requestedMeeting.value.draft.meetingType;
        selection.meetingId = requested.meetingId;
        handledSelection.current = requestKey;
      }
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
  }, [service, timezone, requested]);

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

  const importType = selected.current.type;
  const online = useOnlineWorkbookImport(
    importer,
    profile ? { language: profile.programLanguage, timezone: profile.timezone, meetingType: importType } : null,
    date => {
      selected.current.week = date;
      selected.current.type = importType;
      selected.current.meetingId = null;
      reload();
    },
  );

  function saveSections(meeting: SavedMeeting, sections: readonly MeetingSectionDraft[]): string | null {
    const saved = service.save(
      { ...meeting.draft, sections },
      { id: meeting.id, revision: meeting.revision },
    );
    if (!saved.ok) return saved.error.message;
    reload();
    return null;
  }

  function changePart(
    meeting: SavedMeeting,
    sectionIndex: number,
    partIndex: number,
    part: MeetingPartDraft | null,
  ): string | null {
    const section = meeting.draft.sections[sectionIndex];
    if (!section?.parts[partIndex]) return text.missing;
    const parts = part
      ? section.parts.map((current, index) => index === partIndex ? part : current)
      : section.parts.filter((_, index) => index !== partIndex);
    return saveSections(meeting, meeting.draft.sections.map((current, index) =>
      index === sectionIndex ? { ...current, parts } : current,
    ));
  }

  function addTimer(meeting: SavedMeeting, title: string, minutes: string): string | null {
    const duration = minutes.trim();
    const seconds = Number(duration) * 60;
    if (!/^\d+$/.test(duration) || seconds < 60 || seconds > MEETING_LIMITS.durationSeconds) {
      return text.invalidTimerMinutes(MEETING_LIMITS.durationSeconds / 60);
    }
    if (!title.trim()) return text.timerNameRequired;

    const timer: MeetingPartDraft = {
      title: title.trim(), kind: 'custom', durationSeconds: seconds, isTimed: true,
    };
    const sections = [...meeting.draft.sections];
    const last = sections[sections.length - 1];
    if (
      last?.title === text.customTimers &&
      last.parts.every(part => part.kind === 'custom') &&
      last.parts.length < MEETING_LIMITS.partsPerSection
    ) {
      sections[sections.length - 1] = { ...last, parts: [...last.parts, timer] };
    } else {
      sections.push({ title: text.customTimers, parts: [timer] });
    }

    return saveSections(meeting, sections);
  }

  const week = selected.current.week;

  return {
    online,
    addTimer,
    changePart,
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

    importPdf: () => navigation.navigate('WorkbookImport'),

    openTimer: (meetingId: string) => {
      timerRequest.current += 1;

      navigation.navigate('Main', { screen: 'Timer', params: {
        meetingId,
        requestId: `${Date.now()}-${timerRequest.current}`,
      } });
    },
  };
}
