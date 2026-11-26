import { planPdfPrograms } from '../domain/imports/pdfProgram';
import { findSavedProgram, type MeetingService } from './meetingService';
import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

export interface PdfImportReport {
  readonly imported: number;
  readonly skipped: number;
  readonly issues: readonly string[];
  readonly meetingId: string | null;
}

export function importPdfPrograms(
  meetings: MeetingService,
  pages: readonly string[],
  filename: string,
  timezone: string,
): PdfImportReport {
  const plan = planPdfPrograms(pages, filename, timezone);
  let imported = 0;
  let skipped = 0;
  let meetingId: string | null = null;
  const issues: string[] = [];
  if (plan.length === 0) issues.push(text.pdfNone);

  for (const item of plan) {
    if (!item.draft) {
      issues.push(text.incompleteWeek(item.date, item.reason));
      continue;
    }
    try {
      const existing = findSavedProgram(meetings, item.draft);
      if (!existing.ok) {
        issues.push(text.incompleteWeek(item.date, existing.error.message));
        continue;
      }
      if (existing.value) {
        skipped += 1;
        meetingId ??= existing.value.id;
        continue;
      }
      const saved = meetings.save(item.draft, null);
      if (!saved.ok) {
        issues.push(text.incompleteWeek(item.date, saved.error.message));
        continue;
      }
      imported += 1;
      meetingId ??= saved.value.id;
    } catch {
      issues.push(text.incompleteWeek(item.date, text.pdfSaveFailed));
    }
  }
  return { imported, skipped, issues, meetingId };
}
