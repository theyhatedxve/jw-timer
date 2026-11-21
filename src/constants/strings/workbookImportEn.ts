export const workbookImportEn = {
  title: 'Import workbook PDF',
  select: 'Select PDF',
  selecting: 'Opening document picker...',
  empty: 'Select a workbook PDF stored on this device.',
  selected:
    'PDF selected. Text extraction and meeting preview are not available in this step.',
  size: (bytes: number): string =>
    `${(bytes / 1024 / 1024).toFixed(2)} MB`,
  tooLarge: 'Choose a PDF between 5 bytes and 20 MB.',
  invalid: 'This file does not have a valid PDF header.',
  unreadable: 'The PDF could not be opened. Try another local file.',
} as const;