import type {
  MeetingDraft,
  MeetingPartDraft,
  MeetingResult,
  MeetingSectionDraft,
} from './meeting.types';

export const MEETING_LIMITS = {
  titleLength: 200,
  sectionCount: 30,
  partsPerSection: 100,
  durationSeconds: 86_400,
} as const;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function failure(
  field: string,
  message: string,
): MeetingResult<never> {
  return { ok: false, error: { field, message } };
}

function validateTitle(
  input: unknown,
  field: string,
): MeetingResult<string> {
  if (typeof input !== 'string') {
    return failure(field, 'Enter a title.');
  }

  const title = input.trim();

  if (
    title.length === 0 ||
    title.length > MEETING_LIMITS.titleLength
  ) {
    return failure(
      field,
      `Use between 1 and ${MEETING_LIMITS.titleLength} characters.`,
    );
  }

  return { ok: true, value: title };
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const leapYear =
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0);

  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maximum = daysInMonth[month - 1];

  return maximum !== undefined && day <= maximum;
}

export function isTimezone(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 100 ||
    value !== value.trim()
  ) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en', {
      timeZone: value,
    }).format(0);

    return true;
  } catch {
    return false;
  }
}

function validateDraftId(
  input: unknown,
  field: string,
): MeetingResult<string | undefined> {
  if (input === undefined) {
    return { ok: true, value: undefined };
  }

  if (
    typeof input !== 'string' ||
    !/^[a-f0-9]{32}$/.test(input)
  ) {
    return failure(field, 'Invalid saved item identifier.');
  }

  return { ok: true, value: input };
}

function validatePart(
  input: unknown,
  field: string,
): MeetingResult<MeetingPartDraft> {
  if (!isRecord(input)) {
    return failure(field, 'Invalid meeting part.');
  }
  
  const id = validateDraftId(input.id, `${field}.id`);

  if (!id.ok) return id;

  const title = validateTitle(input.title, `${field}.title`);

  if (!title.ok) return title;

  const kind = input.kind;

  if (
    kind !== 'song' &&
    kind !== 'prayer' &&
    kind !== 'talk' &&
    kind !== 'study' &&
    kind !== 'comments' &&
    kind !== 'custom' &&
    kind !== 'other'
  ) {
    return failure(`${field}.kind`, 'Choose a valid part type.');
  }

  const durationSeconds = input.durationSeconds;

  if (
    typeof durationSeconds !== 'number' ||
    !Number.isSafeInteger(durationSeconds) ||
    durationSeconds < 0 ||
    durationSeconds > MEETING_LIMITS.durationSeconds
  ) {
    return failure(
      `${field}.durationSeconds`,
      'Enter a whole number of seconds from 0 to 86400.',
    );
  }

  const isTimed = input.isTimed;

  if (typeof isTimed !== 'boolean') {
    return failure(
      `${field}.isTimed`,
      'Choose whether this part uses the timer.',
    );
  }

  if (isTimed && durationSeconds === 0) {
    return failure(
      `${field}.durationSeconds`,
      'A timed part needs a duration greater than zero.',
    );
  }

  return {
    ok: true,
    value: {
      ...(id.value === undefined ? {} : { id: id.value }),
      title: title.value,
      kind,
      durationSeconds,
      isTimed,
    },
  };
}

function validateSection(
  input: unknown,
  field: string,
): MeetingResult<MeetingSectionDraft> {
  if (!isRecord(input)) {
    return failure(field, 'Invalid meeting section.');
  }

  const id = validateDraftId(input.id, `${field}.id`);

  if (!id.ok) return id;

  const title = validateTitle(input.title, `${field}.title`);

  if (!title.ok) return title;

  if (
    !Array.isArray(input.parts) ||
    input.parts.length > MEETING_LIMITS.partsPerSection
  ) {
    return failure(
      `${field}.parts`,
      `Use at most ${MEETING_LIMITS.partsPerSection} parts per section.`,
    );
  }

  const parts: MeetingPartDraft[] = [];

  for (let index = 0; index < input.parts.length; index += 1) {
    const result = validatePart(
      input.parts[index],
      `${field}.parts.${index}`,
    );

    if (!result.ok) return result;

    parts.push(result.value);
  }

  return {
    ok: true,
    value: {
      ...(id.value === undefined ? {} : { id: id.value }),
      title: title.value,
      parts,
    },
  };
}

export function validateMeetingDraft(
  input: unknown,
): MeetingResult<MeetingDraft> {
  if (!isRecord(input)) {
    return failure('meeting', 'Invalid meeting draft.');
  }

  const title = validateTitle(input.title, 'title');

  if (!title.ok) return title;

  const meetingType = input.meetingType;

  if (meetingType !== 'midweek' && meetingType !== 'weekend') {
    return failure('meetingType', 'Choose Midweek or Weekend.');
  }

  const meetingDate = input.meetingDate;

  if (!isCalendarDate(meetingDate)) {
    return failure('meetingDate', 'Enter a valid YYYY-MM-DD date.');
  }

  const startLocalTime = input.startLocalTime;

  if (
    startLocalTime !== null &&
    (
      typeof startLocalTime !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(startLocalTime)
    )
  ) {
    return failure(
      'startLocalTime',
      'Enter a valid HH:mm time or leave it unset.',
    );
  }

  const timezone = input.timezone;

  if (!isTimezone(timezone)) {
    return failure('timezone', 'Choose a valid time zone.');
  }

  const programLanguage = input.programLanguage;

  if (programLanguage !== 'en' && programLanguage !== 'war') {
    return failure(
      'programLanguage',
      'Choose English or Waray-Waray.',
    );
  }

  if (
    !Array.isArray(input.sections) ||
    input.sections.length > MEETING_LIMITS.sectionCount
  ) {
    return failure(
      'sections',
      `Use at most ${MEETING_LIMITS.sectionCount} sections.`,
    );
  }

  const sections: MeetingSectionDraft[] = [];

  for (let index = 0; index < input.sections.length; index += 1) {
    const result = validateSection(
      input.sections[index],
      `sections.${index}`,
    );

    if (!result.ok) return result;

    sections.push(result.value);
  }

  return {
    ok: true,
    value: {
      title: title.value,
      meetingType,
      meetingDate,
      startLocalTime,
      timezone,
      programLanguage,
      sections,
    },
  };
}
