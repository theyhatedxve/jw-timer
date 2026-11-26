import type { ProgramLanguage } from '../profile/profile';

export interface WorkbookIssueRequest {
  readonly language: ProgramLanguage;
  readonly timezone: string;
}

export const MAX_WORKBOOK_BYTES = 20 * 1024 * 1024;

export interface WorkbookFile {
  readonly uri: string;
  readonly name: string;
  readonly size: number;
  readonly downloadedAt?: string;
}

export type WorkbookFileResult =
  | { readonly ok: true; readonly file: WorkbookFile | null }
  | { readonly ok: false; readonly message: string };

export interface WorkbookFileService {
  select(): Promise<WorkbookFileResult>;
  release(file: WorkbookFile): void;
}