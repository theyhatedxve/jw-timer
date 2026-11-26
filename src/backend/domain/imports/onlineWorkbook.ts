import { Temporal } from '@js-temporal/polyfill';

import type { MeetingDraft, MeetingPartDraft } from '../meetings/meeting.types';
import { workbookParsingEn as text } from '../../../constants/strings/workbookParsingEn';
import { buildWorkbookCandidates, type WorkbookCandidate } from './workbookParser';

type WorkbookWeek = { readonly date: string } & WorkbookWeekResult;

type WorkbookWeekResult =
  | { readonly draft: MeetingDraft }
  | { readonly draft: null; readonly reason: string };

const blockingWarnings: ReadonlyMap<string, string> = new Map([
  [text.missingDuration, text.autoMissingDuration],
  [text.missingTitle, text.autoMissingTitle],
  [text.numbering, text.autoNumbering],
  [text.sections, text.autoSections],
  [text.extraPlacement, text.autoExtraPlacement],
  [text.minuteCoverage, text.autoMinuteCoverage],
  [text.songCoverage, text.autoSongCoverage],
]);

function withDuration(part: MeetingPartDraft, seconds: number): MeetingPartDraft {
  return part.isTimed ? part : { ...part, durationSeconds: seconds, isTimed: true };
}

export function prepareWorkbookCandidate(candidate: WorkbookCandidate): WorkbookWeekResult {
  const reasons = [...blockingWarnings].flatMap(([warning, message]) =>
    candidate.warnings.includes(warning) ? [message] : [],
  );
  if (reasons.length > 0) return { draft: null, reason: reasons.join(' ') };

  const { draft } = candidate;
  const [opening, treasures, ministry, living, closing] = draft.sections;
  if (
    draft.sections.length !== 5 || !opening || !treasures || !ministry || !living || !closing ||
    opening.title !== text.openingSection || closing.title !== text.closingSection ||
    treasures.parts.length !== 3 || ministry.parts.length === 0 ||
    living.parts[0]?.kind !== 'song'
  ) {
    return { draft: null, reason: text.autoSections };
  }

  const counsel = draft.programLanguage === 'war' ? 'Sagdon' : 'Counsel';
  let number = 0;
  const sections = draft.sections.map(section => ({
    ...section,
    parts: section.parts.flatMap((part, index) => {
      if (part.kind === 'song') return [withDuration(part, 300)];
      if (part.kind === 'comments') {
        return [withDuration(part, section === opening ? 60 : 180)];
      }
      number += 1;
      const titled = { ...part, title: number + '. ' + part.title };
      if (section !== ministry && !(section === treasures && index === 2)) {
        return [titled];
      }
      return [titled, {
        title: number + '. ' + counsel,
        kind: 'comments',
        durationSeconds: 60,
        isTimed: true,
      } satisfies MeetingPartDraft];
    }),
  }));

  return { draft: { ...draft, sections } };
}

export function planOnlineWorkbook(
  pages: readonly string[],
  filename: string,
  timezone: string,
): readonly WorkbookWeek[] {
  const issue = /^mwb_(?:E|SA)_(\d{4})(01|03|05|07|09|11)\.pdf$/i.exec(filename);
  if (!issue?.[1] || !issue[2] || issue[1] === '0000') return [];

  const start = Temporal.PlainDate.from(issue[1] + '-' + issue[2] + '-01');
  const end = start.add({ months: 2 });
  const candidates = buildWorkbookCandidates(pages, issue[1], timezone, filename);
  const weeks: WorkbookWeek[] = [];

  for (
    let week = start.add({ days: (8 - start.dayOfWeek) % 7 });
    Temporal.PlainDate.compare(week, end) < 0;
    week = week.add({ weeks: 1 })
  ) {
    const date = week.toString();
    const matches = candidates.filter(candidate => candidate.draft.meetingDate === date);
    const candidate = matches.length === 1 ? matches[0] : undefined;
    weeks.push(candidate
      ? { date, ...prepareWorkbookCandidate(candidate) }
      : { date, draft: null, reason: matches.length ? text.autoMultiplePages : text.autoMissingPage });
  }

  return weeks;
}
