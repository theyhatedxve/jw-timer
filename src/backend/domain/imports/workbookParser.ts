import type {
  MeetingDraft,
  MeetingPartDraft,
} from '../meetings/meeting.types';

import {
  isCalendarDate,
  isTimezone,
  validateMeetingDraft,
} from '../meetings/meetingValidation';

import {
  arrangeWorkbookExtras,
  readWorkbookExtras,
} from './workbookExtras';

import { workbookParsingEn as text } from '../../../constants/strings/workbookParsingEn';

export interface WorkbookCandidate {
  readonly key: string;
  readonly page: number;
  readonly draft: MeetingDraft;
  readonly warnings: readonly string[];
}

const MONTHS: Readonly<Record<string, number>> = {
  JANUARY: 1, ENERO: 1,
  FEBRUARY: 2, PEBRERO: 2,
  MARCH: 3, MARSO: 3,
  APRIL: 4, ABRIL: 4,
  MAY: 5, MAYO: 5,
  JUNE: 6, HUNYO: 6,
  JULY: 7, HULYO: 7,
  AUGUST: 8, AGOSTO: 8,
  SEPTEMBER: 9, SEPTYEMBRE: 9, SETYEMBRE: 9,
  OCTOBER: 10, OKTUBRE: 10,
  NOVEMBER: 11, NOBYEMBRE: 11,
  DECEMBER: 12, DISYEMBRE: 12,
};

const HEADINGS = [
  /TREASURES\s+FROM\s+GOD['’]S\s+WORD|MGA\s+BAHANDI\s+TIKANG\s+HA\s+PULONG\s+HAN\s+DIOS/gi,
  /APPLY\s+YOURSELF\s+TO\s+THE\s+FIELD\s+MINISTRY|MAGIN\s+MAS\s+EPEKTIBO\s+HA\s+MINISTERYO/gi,
  /LIVING\s+AS\s+CHRISTIANS|PAGKINABUHI\s+SUGAD\s+NGA\s+MGA\s+KRISTIANO/gi,
];

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function buildWorkbookCandidates(
  pages: readonly string[],
  year: string,
  timezone: string,
  filename: string,
): readonly WorkbookCandidate[] {
  if (
    !/^\d{4}$/.test(year) ||
    Number(year) < 1 ||
    !isTimezone(timezone) ||
    pages.length > 32 ||
    pages.reduce((sum, page) => sum + page.length, 0) > 200_000
  ) {
    return [];
  }

  const datePattern = new RegExp(
    `\\b(${Object.keys(MONTHS).join('|')})\\s+` +
    '(\\d{1,2})\\s*[-–—]\\s*(?:[A-Z]+\\s+)?\\d{1,2}\\b',
    'i',
  );

  const candidates: WorkbookCandidate[] = [];

  pages.forEach((raw, pageIndex) => {
    const page = raw
      .normalize('NFKC')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00ad/g, '')
      .replace(/\u00a0/g, ' ');

    const header = datePattern.exec(page);
    const monthName = header?.[1];
    const day = header?.[2];
    const month = monthName
      ? MONTHS[monthName.toUpperCase()]
      : undefined;

    if (!month || !day) return;

    const date =
      `${year}-${String(month).padStart(2, '0')}-` +
      day.padStart(2, '0');

    if (!isCalendarDate(date)) return;

    const headings = HEADINGS.flatMap((pattern, group) =>
      [...page.matchAll(new RegExp(pattern.source, 'gi'))].map(match => ({
        group,
        index: match.index ?? 0,
        title: clean(match[0]),
      })),
    ).sort((left, right) => left.index - right.index);

    if (headings.length === 0) return;

    const starts = [...page.matchAll(/^[ \t]*(\d{1,2})\.[ \t]*/gm)];

    if (starts.length === 0 || starts.length > 30) return;

    const warnings = new Set<string>([text.review, text.manual]);

    const extras = readWorkbookExtras(page);

    const parts: {
      number: number;
      group: number;
      part: MeetingPartDraft;
    }[] = [];

    starts.forEach((start, index) => {
      const number = Number(start[1]);
      const offset = start.index ?? 0;
      const next = starts[index + 1]?.index ?? page.length;

    const nextBoundary = [
        ...extras.boundaries,
        ...headings.map(heading => heading.index),
      ].reduce(
        (end, position) =>
          position > offset ? Math.min(end, position) : end,
        next,
      );

        const chunk = page.slice(
        offset + start[0].length,
        Math.min(
          nextBoundary,
          offset + start[0].length + 600,
        ),
      );

      const duration = /\(\s*(\d{1,3})\s*min\.?\s*\)/i.exec(chunk);
      const minutes = Number(duration?.[1]);

      const hasDuration =
        duration !== null &&
        Number.isInteger(minutes) &&
        minutes > 0 &&
        minutes <= 120;

      let title = clean(
        hasDuration
          ? chunk.slice(0, duration.index)
          : chunk.split('\n')[0] ?? '',
      );

      if (
        title.length === 0 ||
        title.length > 200 ||
        /[\u0000-\u001f\u007f]/.test(title)
      ) {
        title = text.part(number);
        warnings.add(text.missingTitle);
      }

      if (!hasDuration) warnings.add(text.missingDuration);

      let group = 3;

      for (const heading of headings) {
        if (heading.index > offset) break;
        group = heading.group;
      }

      if (group === 3) warnings.add(text.sections);

      parts.push({
        number,
        group,
        part: {
          title,
          kind: 'other',
          durationSeconds: hasDuration ? minutes * 60 : 0,
          isTimed: hasDuration,
        },
      });
    });

    parts.sort((left, right) => left.number - right.number);

    if (parts.some((part, index) => part.number !== index + 1)) {
      warnings.add(text.numbering);
    }

    const sections = [0, 1, 2, 3].flatMap(group => {
      const grouped = parts.filter(part => part.group === group);

    const arrangedSections = arrangeWorkbookExtras(
      extras,
      sections,
      warnings,
    );

      if (grouped.length === 0) return [];

      return [{
        title: headings.find(heading => heading.group === group)?.title
          ?? text.fallbackSection,
        parts: grouped.map(part => part.part),
      }];
    });

    const result = validateMeetingDraft({
      title: text.meeting(date),
      meetingType: 'midweek',
      meetingDate: date,
      startLocalTime: null,
      endLocalTime: null,
      timezone,
      programLanguage: /MGA\s+BAHANDI|KARANTAHON/i.test(page)
        ? 'war'
        : 'en',
      sections: arrangedSections,
      importSource: {
        filename,
        page: pageIndex + 1,
        parser: 'workbook-v2',
      },
    });

    if (!result.ok) return;

    candidates.push({
      key: `${pageIndex + 1}:${date}`,
      page: pageIndex + 1,
      draft: result.value,
      warnings: [...warnings],
    });
  });

  return candidates;
}