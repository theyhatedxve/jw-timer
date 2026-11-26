import { Temporal } from '@js-temporal/polyfill';
import { meetingWeek } from '../domain/meetings/meetingWeek';


import type {
  MeetingService,
  SavedMeeting,
} from './meetingService';
import type { ProfileService } from './profileService';

export interface HomeMeeting {
  readonly meeting: SavedMeeting;
  readonly partCount: number;
  readonly durationSeconds: number;
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
  profiles,
}: {
  readonly meetings: Pick<MeetingService, 'list' | 'get'>;
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

        const currentWeek = meetingWeek(today);
        const candidates = [...listed.value]
          .filter(meeting => meeting.meetingDate >= currentWeek)
          .sort((left, right) =>
            left.meetingDate.localeCompare(right.meetingDate) ||
            left.id.localeCompare(right.id),
          );
        let candidate: SavedMeeting | null = null;

        for (const summary of candidates) {
          const saved = meetings.get(summary.id);
          if (!saved.ok || !saved.value) return { ok: false };
          // Undated weekly programs use Monday as their week key, not a past event date.
          if (saved.value.draft.meetingDate < today && saved.value.draft.startLocalTime !== null) {
            continue;
          }
          candidate = saved.value;
          break;
        }

        if (!candidate) {
          return { ok: true, value: { next: null, refreshAt } };
        }

        const parts = candidate.draft.sections.flatMap(
          section => section.parts,
        );


        return {
          ok: true,
          value: {
            refreshAt,
            next: {
              meeting: candidate,
              partCount: parts.length,
              durationSeconds: parts.reduce(
                (total, part) =>
                  total + (part.isTimed ? part.durationSeconds : 0),
                0,
              ),
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
