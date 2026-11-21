import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { canAssign, meetingWeek, type Assignment } from '../../backend/domain/assignments/assignment';
import type { PublisherRole } from '../../backend/domain/publishers/publisher';
import type { ScheduleService, WeekSchedule } from '../../backend/services/scheduleService';
import { publisherEn } from '../../constants/strings/publisherEn';
import { scheduleEn } from '../../constants/strings/scheduleEn';

interface Row {
  readonly id: string;
  readonly meetingId: string;
  readonly meetingTitle: string;
  readonly date: string;
  readonly timezone: string;
  readonly startsMeeting: boolean;
  readonly startsSection: boolean;
  readonly sectionTitle: string;
  readonly sectionIndex: number;
  readonly title: string;
  readonly duration: string;
  readonly slots: readonly {
    readonly assignment: Assignment;
    readonly label: string;
    readonly needsReview: boolean;
  }[];
}

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly rows: readonly Row[] };

function rowsFrom(data: WeekSchedule): Row[] {
  const people = new Map(data.publishers.map(person => [person.id, person]));
  const rows: Row[] = [];
  for (const entry of data.entries) {
    let startsMeeting = true;
    entry.meeting.draft.sections.forEach((section, sectionIndex) => {
      let startsSection = true;
      for (const part of section.parts) {
        // The service rejects programs with missing saved IDs.
        if (!part.id) continue;
        const seconds = part.durationSeconds;
        rows.push({
          id: part.id, meetingId: entry.meeting.id,
          meetingTitle: entry.meeting.draft.title, date: entry.meeting.draft.meetingDate,
          timezone: entry.meeting.draft.timezone, startsMeeting, startsSection,
          sectionTitle: section.title, sectionIndex, title: part.title,
          duration: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
          slots: entry.assignments.filter(slot => slot.partId === part.id).map(assignment => {
            const person = assignment.publisherId ? people.get(assignment.publisherId) : undefined;
            return {
              assignment,
              label: assignment.publisherId === null ? scheduleEn.notAssigned : person?.displayName ?? scheduleEn.unavailablePublisher,
              needsReview: assignment.publisherId !== null && (!person || !canAssign(person, assignment.role)),
            };
          }),
        });
        startsMeeting = false;
        startsSection = false;
      }
    });
  }
  return rows;
}

function weekLabel(start: string | null): string {
  if (!start) return '';
  const first = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(first);
  last.setUTCDate(last.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat('en', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatter.format(first)} – ${formatter.format(last)}`;
}

export function useSchedules(service: ScheduleService) {
  const navigation = useNavigation();
  const selected = useRef<string | null>(null);
  const [weeks, setWeeks] = useState<readonly string[]>([]);
  const [week, setWeek] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: 'loading' });

  const reload = useCallback(() => {
    const result = service.listMeetings();
    if (!result.ok) { setState({ status: 'error', message: result.error.message }); return; }
    const available = [...new Set(result.value.map(meeting => meetingWeek(meeting.meetingDate)))].sort();
    setWeeks(available);
    const today = new Date();
    const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    const currentWeek = meetingWeek(localDate);
    const chosen = selected.current && available.includes(selected.current)
      ? selected.current : available.find(value => value >= currentWeek) ?? available[available.length - 1] ?? null;
    selected.current = chosen;
    setWeek(chosen);
    if (!chosen) { setState({ status: 'ready', rows: [] }); return; }
    const loaded = service.loadWeek(chosen);
    setState(loaded.ok ? { status: 'ready', rows: rowsFrom(loaded.value) } : { status: 'error', message: loaded.error.message });
  }, [service]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const position = week ? weeks.indexOf(week) : -1;
  function moveWeek(direction: -1 | 1) {
    const next = weeks[position + direction];
    if (!next) return;
    selected.current = next;
    reload();
  }
  return {
    state, weekLabel: weekLabel(week),
    canPrevious: position > 0, canNext: position >= 0 && position < weeks.length - 1,
    previousWeek: () => moveWeek(-1), nextWeek: () => moveWeek(1), reload,
    roleLabel: publisherEn.roles,
    openPrograms: () => navigation.navigate('MeetingPrograms'),
    openAssignment: (meetingId: string, partId: string, role?: PublisherRole) =>
      navigation.navigate('AssignmentEditor', { meetingId, partId, role }),
  };
}
