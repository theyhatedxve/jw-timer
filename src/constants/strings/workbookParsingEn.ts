export const workbookParsingEn = {
  minuteCoverage:
    'Printed minute values do not match the imported timed parts. Compare every duration with the PDF before saving.',
  songCoverage:
    'Expected three song entries. Check opening, middle, and closing song numbers against the PDF.',
  autoMissingDuration: 'Missing part duration.',
  autoMissingTitle: 'Missing part title.',
  autoNumbering: 'Part numbers are missing or repeated.',
  autoSections: 'Meeting sections could not be identified.',
  autoExtraPlacement: 'Song or comment order could not be determined.',
  autoMinuteCoverage: 'Printed minutes do not match the parsed durations.',
  autoSongCoverage: 'Could not identify three songs.',
  autoMissingPage: 'No readable program page found.',
  autoMultiplePages: 'Multiple program pages matched this week.',
  year: 'Workbook year',
  yearHint: 'Use four digits. Verify each meeting date before saving.',
  candidates: 'Meeting previews',
  open: 'Review and edit meeting',
  none: 'No supported meeting pages found. Check the year and extracted text.',
  scope: 'Only pages with a recognized date and meeting section are listed.',
  review: 'Compare the date, section placement, order, and titles with the PDF.',
  manual:
   'Review prayers, counsel, and any other missing items against the PDF.',
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
    openingSection: 'Opening',
  closingSection: 'Conclusion',
  songsToArrange: 'Songs — review placement',
  extraPlacement:
    'Some songs or comments could not be placed reliably. Arrange or add them in the editor.',
  extraDuration:
    'Some songs or comments have no printed duration. Enter a duration or deliberately mark them untimed.',
} as const;
