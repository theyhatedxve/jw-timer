import { requireOptionalNativeModule } from 'expo';

import type {
  WorkbookTextService,
} from '../domain/imports/workbookText';

import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

interface NativeExtractor {
  extract(uri: string): Promise<unknown>;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value);
}

export const workbookTextService: WorkbookTextService = {
  async extract(file) {
    try {
      const native =
        requireOptionalNativeModule<NativeExtractor>('WorkbookPdf');

      if (!native) {
        return { ok: false, message: text.rebuild };
      }

      const result = await native.extract(file.uri);

      if (!isRecord(result)) {
        return { ok: false, message: text.unreadable };
      }

      if (result.ok !== true) {
        const messages: Record<string, string> = {
          unsupported: text.unsupported,
          locked: text.locked,
          limit: text.extractionLimit,
          empty: text.noText,
        };

        return {
          ok: false,
          message: typeof result.code === 'string'
            ? messages[result.code] ?? text.unreadable
            : text.unreadable,
        };
      }

      if (
        !Array.isArray(result.pages) ||
        result.pages.length < 1 ||
        result.pages.length > 32
      ) {
        return { ok: false, message: text.unreadable };
      }

      const pages: string[] = [];
      let total = 0;

      for (const page of result.pages) {
        if (typeof page !== 'string') {
          return { ok: false, message: text.unreadable };
        }

        total += page.length;

        if (total > 200_000) {
          return { ok: false, message: text.extractionLimit };
        }

        pages.push(page);
      }

      if (!pages.some(page => page.trim().length > 0)) {
        return { ok: false, message: text.noText };
      }

      return { ok: true, pages };
    } catch {
      return { ok: false, message: text.unreadable };
    }
  },
};