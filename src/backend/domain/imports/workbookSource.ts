export interface WorkbookSource {
  readonly filename: string;
  readonly page: number;
  readonly parser:
    | 'numbered-workbook-v1'
    | 'workbook-v2'
    | 'watchtower-v1'
    | 'wol-v1';
  readonly url?: string;
  readonly retrievedAt?: string;
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
    (
      value.parser !== 'numbered-workbook-v1' &&
      value.parser !== 'workbook-v2' &&
      value.parser !== 'watchtower-v1' &&
      value.parser !== 'wol-v1'
    )
  ) {
    return null;
  }

  if (value.parser === 'wol-v1') {
    if (
      typeof value.url !== 'string' ||
      !/^https:\/\/wol\.jw\.org\/(?:en\/wol\/d\/r1\/lp-e|war\/wol\/d\/r110\/lp-sa)\/\d+$/.test(value.url) ||
      typeof value.retrievedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.retrievedAt)) ||
      new Date(value.retrievedAt).toISOString() !== value.retrievedAt
    ) {
      return null;
    }
    return {
      filename: value.filename.trim(),
      page: value.page,
      parser: value.parser,
      url: value.url,
      retrievedAt: value.retrievedAt,
    };
  }

  return {
    filename: value.filename.trim(),
    page: value.page,
    parser: value.parser,
  };
}
