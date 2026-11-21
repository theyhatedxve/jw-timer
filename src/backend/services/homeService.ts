import { Temporal } from '@js-temporal/polyfill';

import { MEETING_DUTY_SLOTS } from '../domain/assignments/meetingDuty';

import type {
  MeetingService,
  SavedMeeting,
} from './meetingService';
import type { MeetingDutyService } from './meetingDutyService';
import type { ProfileService } from './profileService';

export interface HomeMeeting {
  readonly meeting: SavedMeeting;
  readonly partCount: number;
  readonly durationSeconds: number;
  readonly assignedSlots: number;
}

export interface HomeSnapshot {
  readonly next: HomeMeeting | null;
  readonly refreshAt: number;
}

export type HomeResult =
  | { readonly ok: true; readonly value: HomeSnapshot }
  | { readonly ok: false };

export function createHomeService({
  meetings,
  duties,
  profiles,
}: {
  readonly meetings: Pick<MeetingService, 'list' | 'get'>;
  readonly duties: Pick<MeetingDutyService, 'list'>;
  readonly profiles: Pick<ProfileService, 'load'>;
}) {
  return {
    load(now = Date.now()): HomeResult {
      try {
        const profile = profiles.load();
        if (!profile.ok || !profile.value) return { ok: false };

        const localNow = Temporal.Instant
          .fromEpochMilliseconds(now)
          .toZonedDateTimeISO(profile.value.timezone);

        const today = localNow.toPlainDate().toString();
        const refreshAt = localNow
          .add({ days: 1 })
          .startOfDay()
          .epochMilliseconds;

        const listed = meetings.list();
        if (!listed.ok) return { ok: false };

        const candidate = [...listed.value]
          .filter(meeting => meeting.meetingDate >= today)
          .sort((left, right) =>
            left.meetingDate.localeCompare(right.meetingDate) ||
            left.id.localeCompare(right.id),
          )[0];

        if (!candidate) {
          return { ok: true, value: { next: null, refreshAt } };
        }

        const saved = meetings.get(candidate.id);
        if (!saved.ok || !saved.value) return { ok: false };

        const assigned = duties.list(candidate.id);
        if (!assigned.ok) return { ok: false };

        const parts = saved.value.draft.sections.flatMap(
          section => section.parts,
        );

        const assignedSlots = MEETING_DUTY_SLOTS.filter(slot =>
          assigned.value.some(duty =>
            duty.meetingId === candidate.id &&
            duty.key === slot.key &&
            duty.publisherId !== null,
          ),
        ).length;

        return {
          ok: true,
          value: {
            refreshAt,
            next: {
              meeting: saved.value,
              partCount: parts.length,
              durationSeconds: parts.reduce(
                (total, part) =>
                  total + (part.isTimed ? part.durationSeconds : 0),
                0,
              ),
              assignedSlots,
            },
          },
        };
      } catch {
        return { ok: false };
      }
    },
  };
}

export type HomeService = ReturnType<typeof createHomeService>;