import {
  validateAssignment,
  meetingWeek,
  type Assignment,
  type AssignmentCommand,
  type ScheduleResult,
} from '../domain/assignments/assignment';
import { validPublisherId } from '../domain/publishers/publisher';
import type { MeetingService, SavedMeeting } from './meetingService';
import type { PublisherService, SavedPublisher } from './publisherService';

export interface AssignmentRepository {
  list(meetingId: string): ScheduleResult<readonly Assignment[]>;
  save(command: AssignmentCommand): ScheduleResult<Assignment>;
}

export interface ScheduleEntry {
  readonly meeting: SavedMeeting;
  readonly assignments: readonly Assignment[];
}

export interface ScheduleContext extends ScheduleEntry {
  readonly publishers: readonly SavedPublisher[];
}

export interface WeekSchedule {
  readonly entries: readonly ScheduleEntry[];
  readonly publishers: readonly SavedPublisher[];
}

export function createScheduleService(
  meetings: MeetingService,
  publishers: PublisherService,
  repository: AssignmentRepository,
) {
  function readMeeting(id: string): ScheduleResult<ScheduleEntry> {
    const meeting = meetings.get(id);
    if (!meeting.ok) return meeting;
    if (!meeting.value) {
      return { ok: false, error: { field: 'meeting', message: 'This meeting is no longer available.' } };
    }
    const validParts = meeting.value.draft.sections.every(section =>
      validPublisherId(section.id) && section.parts.every(part => validPublisherId(part.id)),
    );
    if (!validParts) {
      return { ok: false, error: { field: 'meeting', message: 'The saved program has invalid part identifiers.' } };
    }
    const assignments = repository.list(id);
    if (!assignments.ok) return assignments;
    return { ok: true, value: { meeting: meeting.value, assignments: assignments.value } };
  }

  return {
    listMeetings: () => meetings.list(),

    loadMeeting(id: string): ScheduleResult<ScheduleContext> {
      const entry = readMeeting(id);
      if (!entry.ok) return entry;
      const people = publishers.list();
      if (!people.ok) return people;
      return { ok: true, value: { ...entry.value, publishers: people.value } };
    },

    loadWeek(start: string): ScheduleResult<WeekSchedule> {
      const summaries = meetings.list();
      if (!summaries.ok) return summaries;
      const people = publishers.list();
      if (!people.ok) return people;
      const entries: ScheduleEntry[] = [];
      for (const summary of summaries.value) {
        if (meetingWeek(summary.meetingDate) !== start) continue;
        const entry = readMeeting(summary.id);
        if (!entry.ok) return entry;
        entries.push(entry.value);
      }
      return { ok: true, value: { entries, publishers: people.value } };
    },

    save(input: unknown): ScheduleResult<Assignment> {
      const parsed = validateAssignment(input);
      if (!parsed.ok) return parsed;
      return repository.save(parsed.value);
    },
  };
}

export type ScheduleService = ReturnType<typeof createScheduleService>;
