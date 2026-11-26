import { fetch } from 'expo/fetch';

import {
  currentWolWeek,
  readWolProgram,
  wolArticleUrl,
  type WolProgramRequest,
} from '../domain/imports/wolProgram';
import type { MeetingDraft } from '../domain/meetings/meeting.types';

const MAX_HTML_BYTES = 2 * 1024 * 1024;

function requireWolUrl(value: string): void {
  const url = new URL(value);
  if (
    url.origin !== 'https://wol.jw.org' || url.username || url.password ||
    !/^\/(?:en|war)\/wol\/(?:meetings|d)\//.test(url.pathname)
  ) {
    throw new Error('The program link is outside the supported WOL pages.');
  }
}

async function readHtml(url: string, signal: AbortSignal): Promise<string> {
  requireWolUrl(url);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Awaited<ReturnType<typeof fetch>> | undefined;
    try {
      response = await fetch(url, { signal, credentials: 'omit', redirect: 'error' });
    } catch (error) {
      if (attempt !== 0 || signal.aborted) throw error;
    }

    if (!response || response.status === 429 || response.status >= 500) {
      await response?.body?.cancel().catch(() => undefined);
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
        continue;
      }
      throw new Error('WOL is temporarily unavailable. Try importing again later.');
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html') || !response.body) {
      throw new Error('WOL did not return the current meeting page.');
    }

    const chunks: Uint8Array[] = [];
    const reader = response.body.getReader();
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_HTML_BYTES) throw new Error('The WOL page exceeds the import limit.');
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder().decode(bytes);
  }
  throw new Error('WOL could not be reached.');
}

export async function loadCurrentWolProgram(
  request: WolProgramRequest,
  signal: AbortSignal,
): Promise<MeetingDraft | null> {
  if (signal.aborted) return null;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel);
  const timeout = setTimeout(cancel, 30_000);

  try {
    const week = currentWolWeek(request);
    const index = await readHtml(week.url, controller.signal);
    const url = wolArticleUrl(index, request, week);
    const article = await readHtml(url, controller.signal);
    if (controller.signal.aborted) throw new Error('The request was cancelled or timed out.');
    return readWolProgram(article, request, week, url);
  } catch (error) {
    if (signal.aborted) return null;
    if (controller.signal.aborted) throw new Error('WOL import timed out. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
    controller.abort();
  }
}
