import type { MeetingDraft } from '../meetings/meeting.types';
import { meetingWeek } from '../meetings/meetingWeek';
import { buildWorkbookCandidates, readWorkbookDate } from './workbookParser';
import { planOnlineWorkbook, prepareWorkbookCandidate } from './onlineWorkbook';
import { buildWatchtowerCandidates } from './watchtowerParser';
import { buildAutomaticWeekendProgram } from './weekendProgram';
import { workbookImportEn as text } from '../../../constants/strings/workbookImportEn';

export type PdfProgramPlan =
  | { readonly date: string; readonly draft: MeetingDraft }
  | { readonly date: string; readonly draft: null; readonly reason: string };

export function planPdfPrograms(
  pages: readonly string[],
  filename: string,
  timezone: string,
): readonly PdfProgramPlan[] {
  const studies = buildWatchtowerCandidates(pages);
  if (studies.length > 0) {
    return studies.map(study => {
      const year = /\b(\d{4})\s*$/.exec(study.printedWeek)?.[1];
      const date = year ? readWorkbookDate(study.printedWeek, year) : null;
      if (!date || study.middleSong === null || study.closingSong === null) {
        return { date: study.printedWeek, draft: null, reason: text.pdfIncompleteStudy };
      }
      const monday = meetingWeek(date);
      const result = buildAutomaticWeekendProgram({
        meetingDate: monday,
        timezone,
        programLanguage: study.programLanguage,
        articleTitle: study.articleTitle,
        middleSong: study.middleSong,
        closingSong: study.closingSong,
        importSource: { filename, page: study.page, parser: 'watchtower-v1' },
      });
      return result.ok
        ? { date: monday, draft: result.value }
        : { date: monday, draft: null, reason: result.error.message };
    });
  }

  const issue = planOnlineWorkbook(pages, filename, timezone);
  if (issue.length > 0) return issue;
  // Do not silently assign an older workbook to the device's current year.
  const year = /_(\d{4})\d{2}\.pdf$/i.exec(filename)?.[1];
  if (!year) return [];
  return buildWorkbookCandidates(pages, year, timezone, filename).map(candidate => ({
    date: candidate.draft.meetingDate,
    ...prepareWorkbookCandidate(candidate),
  }));
}
