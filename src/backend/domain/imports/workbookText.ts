import type { WorkbookFile } from './workbookFile';

export type WorkbookTextResult =
  | { readonly ok: true; readonly pages: readonly string[] }
  | { readonly ok: false; readonly message: string };

export interface WorkbookTextService {
  extract(file: WorkbookFile): Promise<WorkbookTextResult>;
}