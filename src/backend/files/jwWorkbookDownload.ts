import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';

import {
  MAX_WORKBOOK_BYTES,
  type WorkbookFileResult,
  type WorkbookIssueRequest,
} from '../domain/imports/workbookFile';
import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

const DOWNLOAD_OPTIONS = 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS';
const TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 800;
let cacheSequence = 0;

async function fetchPublicFile(url: URL, signal: AbortSignal) {
  const request = () => fetch(url.href, {
    signal,
    redirect: 'error',
    credentials: 'omit',
  });
  const response = await request().catch(error => {
    if (signal.aborted) throw error;
    return null;
  });

  if (!response || response.status === 429 || response.status >= 500) {
    await response?.body?.cancel().catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return request();
  }
  return response;
}

function currentIssue(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());
  const year = parts.find(part => part.type === 'year')?.value;
  const month = Number(parts.find(part => part.type === 'month')?.value);
  if (!year || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Invalid workbook issue date');
  }
  const firstMonth = month % 2 === 0 ? month - 1 : month;
  return year + String(firstMonth).padStart(2, '0');
}

interface PublicationResponse {
  readonly pub?: unknown;
  readonly issue?: unknown;
  readonly files?: Partial<Record<'E' | 'SA', {
    readonly PDF?: readonly {
      readonly file?: { readonly url?: unknown };
      readonly filesize?: unknown;
    }[];
  }>>;
}

export async function downloadCurrentWorkbook(
  { language, timezone }: WorkbookIssueRequest,
  signal: AbortSignal,
): Promise<WorkbookFileResult> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal.aborted) return { ok: true, file: null };
  signal.addEventListener('abort', cancel);
  const timeout = setTimeout(cancel, TIMEOUT_MS);
  let cached: File | undefined;
  let retained = false;

  try {
    const issue = currentIssue(timezone);
    const code = language === 'war' ? 'SA' : 'E';
    const name = 'mwb_' + code + '_' + issue + '.pdf';
    // Match the publication download link exposed by JW.org for this issue.
    const options = new URL(DOWNLOAD_OPTIONS);
    options.search = new URLSearchParams({
      alllangs: '0',
      fileformat: 'PDF,EPUB,JWPUB,RTF,TXT,BRL,BES,DAISY,UPDATEPKG',
      issue,
      langwritten: code,
      output: 'html',
      pub: 'mwb',
      txtCMSLang: code,
    }).toString();

    const metadata = await fetchPublicFile(options, controller.signal);
    if (!metadata.ok) return { ok: false, message: text.downloadFailed };
    const publication = await metadata.json() as PublicationResponse | null;
    const item = publication?.files?.[code]?.PDF?.[0];
    const size = item?.filesize;
    const link = item?.file?.url;
    if (
      publication?.pub !== 'mwb' || publication.issue !== issue ||
      typeof size !== 'number' || !Number.isSafeInteger(size) ||
      size < 5 || size > MAX_WORKBOOK_BYTES || typeof link !== 'string'
    ) {
      return { ok: false, message: text.downloadFailed };
    }

    const url = new URL(link);
    if (
      url.protocol !== 'https:' || !url.hostname.endsWith('.jw-cdn.org') ||
      url.port || url.username || url.password ||
      !url.pathname.endsWith('/' + name)
    ) {
      return { ok: false, message: text.downloadFailed };
    }

    const response = await fetchPublicFile(url, controller.signal);
    if (!response.ok || !response.body) {
      return { ok: false, message: text.downloadFailed };
    }
    const bytes = new Uint8Array(size);
    const reader = response.body.getReader();
    let offset = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (offset + value.length > bytes.length) {
          return { ok: false, message: text.tooLarge };
        }
        bytes.set(value, offset);
        offset += value.length;
      }
    } finally {
      reader.releaseLock();
    }

    if (
      offset !== bytes.length ||
      ![37, 80, 68, 70, 45].every((byte, index) => bytes[index] === byte)
    ) {
      return { ok: false, message: text.invalid };
    }

    if (controller.signal.aborted) {
      return signal.aborted
        ? { ok: true, file: null }
        : { ok: false, message: text.downloadFailed };
    }

    cached = new File(Paths.cache, 'jw-workbook-' + Date.now() + '-' + cacheSequence++ + '.pdf');
    cached.create();
    await cached.write(bytes);
    retained = true;
    return {
      ok: true,
      file: { uri: cached.uri, name, size, downloadedAt: new Date().toISOString() },
    };
  } catch {
    return signal.aborted
      ? { ok: true, file: null }
      : { ok: false, message: text.downloadFailed };
  } finally {
    clearTimeout(timeout);
    controller.abort();
    signal.removeEventListener('abort', cancel);
    if (cached && !retained) {
      try {
        if (cached.exists) cached.delete();
      } catch {
        // The cache can be cleared by the OS.
      }
    }
  }
}
