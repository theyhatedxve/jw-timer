import { Temporal } from '@js-temporal/polyfill';
import { meetingWeek } from '../domain/meetings/meetingWeek';
import { formatTime } from '../domain/timer/timer';
import { restoreSession, type SessionCheckpoint } from '../domain/timer/timerProgram';
import type { TimerSessionService } from './timerSessionService';


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

export interface HomeRecentSession {
  readonly partTitle: string;
  readonly digits: string;
  readonly status: SessionCheckpoint['status'];
}

export interface HomeSnapshot {
  readonly next: HomeMeeting | null;
  readonly recent: HomeRecentSession | null;
  readonly refreshAt: number;
}

export type HomeResult =
  | { readonly ok: true; readonly value: HomeSnapshot }
  | { readonly ok: false };

export function createHomeService({
  meetings,
  profiles,
  sessions,
}: {
  readonly meetings: Pick<MeetingService, 'list' | 'get'>;
  readonly profiles: Pick<ProfileService, 'load'>;
  readonly sessions: Pick<TimerSessionService, 'load'>;
}) {
  function recentSession(): HomeRecentSession | null {
    try {
      const saved = sessions.load();
      if (!saved || saved.program.meetingId === null) return null;
      const part = saved.program.parts[saved.partIndex];
      if (!part) return null;
      return {
        partTitle: part.title,
        digits: formatTime(restoreSession(saved), 0),
        status: saved.status,
      };
    } catch {
      // An unreadable checkpoint must not hide the saved meeting overview.
      return null;
    }
  }

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

        const recent = recentSession();
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
          return { ok: true, value: { next: null, recent, refreshAt } };
        }

        const parts = candidate.draft.sections.flatMap(
          section => section.parts,
        );


        return {
          ok: true,
          value: {
            refreshAt,
            recent,
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
