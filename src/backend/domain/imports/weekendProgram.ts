import type {
  MeetingDraft,
  MeetingResult,
} from '../meetings/meeting.types';
import { validateMeetingDraft } from '../meetings/meetingValidation';

const SONG_SECONDS = 5 * 60;
const PUBLIC_TALK_SECONDS = 30 * 60;
const WATCHTOWER_SECONDS = 60 * 60;

export function buildWeekendProgram(
  input: unknown,
): MeetingResult<MeetingDraft> {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    return {
      ok: false,
      error: {
        field: 'meeting',
        message: 'Invalid Weekend import.',
      },
    };
  }

  const value = input as Record<string, unknown>;

  const songFields = [
    'openingSong',
    'middleSong',
    'closingSong',
  ] as const;

  for (const field of songFields) {
    const number = value[field];

    if (
      typeof number !== 'number' ||
      !Number.isSafeInteger(number) ||
      number < 1 ||
      number > 999
    ) {
      return {
        ok: false,
        error: {
          field,
          message: 'Confirm a whole song number from 1 to 999.',
        },
      };
    }
  }

  if (
    typeof value.startLocalTime !== 'string' ||
    value.startLocalTime.trim() === ''
  ) {
    return {
      ok: false,
      error: {
        field: 'startLocalTime',
        message: 'Confirm the local meeting start time.',
      },
    };
  }

  const songLabel = value.programLanguage === 'war'
    ? 'Karantahon'
    : 'Song';

  return validateMeetingDraft({
    title: 'Weekend meeting',
    meetingType: 'weekend',
    meetingDate: value.meetingDate,
    startLocalTime: value.startLocalTime,
    timezone: value.timezone,
    programLanguage: value.programLanguage,
    importSource: value.importSource,
    sections: [{
      title: 'Weekend meeting',
      parts: [
        {
          title: `${songLabel} ${value.openingSong}`,
          kind: 'song',
          durationSeconds: SONG_SECONDS,
          isTimed: true,
        },
        {
          title: 'Public Talk',
          kind: 'talk',
          durationSeconds: PUBLIC_TALK_SECONDS,
          isTimed: true,
        },
        {
          title: `${songLabel} ${value.middleSong}`,
          kind: 'song',
          durationSeconds: SONG_SECONDS,
          isTimed: true,
        },
        {
          title: value.articleTitle,
          kind: 'study',
          durationSeconds: WATCHTOWER_SECONDS,
          isTimed: true,
        },
        {
          title: `${songLabel} ${value.closingSong}`,
          kind: 'song',
          durationSeconds: SONG_SECONDS,
          isTimed: true,
        },
      ],
    }],
  });
}
