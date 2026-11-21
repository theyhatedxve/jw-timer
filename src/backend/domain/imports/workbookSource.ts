export interface WorkbookSource {
  readonly filename: string;
  readonly page: number;
  readonly parser: 'numbered-workbook-v1';
}

export function readWorkbookSource(
  input: unknown,
): WorkbookSource | null {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    return null;
  }

  const value = input as Record<string, unknown>;

  if (
    typeof value.filename !== 'string' ||
    value.filename.trim().length === 0 ||
    value.filename.length > 255 ||
    /[\u0000-\u001f\u007f]/.test(value.filename) ||
    typeof value.page !== 'number' ||
    !Number.isInteger(value.page) ||
    value.page < 1 ||
    value.page > 32 ||
    value.parser !== 'numbered-workbook-v1'
  ) {
    return null;
  }

  return {
    filename: value.filename.trim(),
    page: value.page,
    parser: 'numbered-workbook-v1',
  };
}