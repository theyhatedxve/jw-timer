export const workbookParsingEn = {
  year: 'Workbook year',
  yearHint: 'Use four digits. Verify each meeting date before saving.',
  candidates: 'Meeting previews',
  open: 'Review and edit meeting',
  none: 'No supported meeting pages found. Check the year and extracted text.',
  scope: 'Only pages with a recognized date and meeting section are listed.',
  review: 'Compare the date, section placement, order, and titles with the PDF.',
  manual:
    'Add songs, prayers, opening and concluding comments, counsel, and other unnumbered items manually.',
  missingDuration:
    'Some durations were missing. Enter them in the editor before saving.',
  missingTitle: 'Some titles could not be read. Correct them in the editor.',
  numbering: 'Part numbering needs review.',
  sections: 'Some section headings could not be identified.',
  fallbackSection: 'Review section placement',
  part: (number: number): string => `Part ${number}`,
  meeting: (date: string): string => `Midweek Meeting — ${date}`,
  page: (number: number): string => `Source page ${number}`,
  confirmTitle: 'Review imported meeting',
  cancel: 'Cancel',
  continue: 'Open editor',
  duplicate:
    'A meeting with this date, type, and language, or this PDF source page, already exists. Edit the existing meeting.',
  invalidDraft: 'The imported meeting draft is invalid. Return to PDF import.',
} as const;