import type { MeetingSectionDraft } from '../meetings/meeting.types';

import { workbookParsingEn as text } from '../../../constants/strings/workbookParsingEn';

export function reviewWorkbookCoverage(
  source: string,
  sections: readonly MeetingSectionDraft[],
): readonly string[] {
  const printed = [...source.matchAll(
    /\(\s*(\d{1,3})\s*min\.?\s*\)/gi,
  )].map(match => Number(match[1]) * 60);

  const parts = sections.flatMap(section => section.parts);
  const imported = parts
    .filter(part => part.isTimed)
    .map(part => part.durationSeconds);

  const ordered = (values: readonly number[]): string =>
    [...values].sort((left, right) => left - right).join(',');

  const warnings: string[] = [];

  if (ordered(printed) !== ordered(imported)) {
    warnings.push(text.minuteCoverage);
  }

  if (parts.filter(part => part.kind === 'song').length !== 3) {
    warnings.push(text.songCoverage);
  }

  return warnings;
}
