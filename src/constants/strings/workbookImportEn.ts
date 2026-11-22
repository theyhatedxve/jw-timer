export const workbookImportEn = {
  title: 'Import meeting PDF',
  select: 'Select PDF',
  selecting: 'Opening document picker...',
  extract: 'Extract PDF text',
  extracting: 'Extracting text...',
  empty:
    'Select a local meeting workbook or supported English or Waray Watchtower study-edition PDF.',
  selected: 'PDF selected. Extract its text to preview the pages.',
  preview: 'Extracted text preview',
  review:
    'Check the extracted text. Column order may differ from the PDF. Nothing has been saved as a meeting.',
  page: (number: number): string => `Page ${number}`,
  blankPage: 'No extractable text on this page.',
  size: (bytes: number): string =>
    `${(bytes / 1024 / 1024).toFixed(2)} MB`,
  tooLarge: 'Choose a PDF between 5 bytes and 20 MB.',
  invalid: 'This file does not have a valid PDF header.',
  unreadable: 'The PDF could not be opened. Try another local file.',
  rebuild: 'PDF extraction is unavailable. Rebuild and install the app.',
  unsupported: 'PDF text extraction requires Android 15 or later.',
  locked: 'This PDF is protected or inaccessible. Select an unlocked copy.',
  extractionLimit:
    'Choose a PDF up to 20 MB, 32 pages, and 200,000 extracted characters.',
  noText:
    'No readable text was found. Scanned PDFs need OCR, which is not supported yet.',
} as const;
