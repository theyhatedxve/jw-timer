import { Temporal } from '@js-temporal/polyfill';

import type { MeetingDraft, MeetingLanguage, MeetingType } from '../meetings/meeting.types';
import { validateMeetingDraft } from '../meetings/meetingValidation';
import { buildWorkbookCandidates, readWorkbookDate } from './workbookParser';
import { prepareWorkbookCandidate } from './onlineWorkbook';

export interface WolProgramRequest {
  readonly language: MeetingLanguage;
  readonly timezone: string;
  readonly meetingType: MeetingType;
}

export interface WolWeek {
  readonly monday: string;
  readonly url: string;
}

const libraries = {
  en: 'en/wol/meetings/r1/lp-e',
  war: 'war/wol/meetings/r110/lp-sa',
} as const;

export function currentWolWeek(request: WolProgramRequest, now = Date.now()): WolWeek {
  const date = Temporal.Instant.fromEpochMilliseconds(now)
    .toZonedDateTimeISO(request.timezone).toPlainDate();
  const monday = date.subtract({ days: date.dayOfWeek - 1 }).toString();
  return {
    monday,
    url: 'https://wol.jw.org/' + libraries[request.language] + '/' + date.yearOfWeek + '/' + date.weekOfYear,
  };
}

// Read only text from WOL's article blocks. HTML is never rendered or executed.
export function wolText(html: string): string {
  const named: Readonly<Record<string, string>> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–',
    hellip: '…', shy: '', thinsp: ' ', ensp: ' ', emsp: ' ',
  };
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity: string, code: string) => {
      if (!code.startsWith('#')) return named[code] ?? entity;
      const value = code[1]?.toLowerCase() === 'x'
        ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return value > 0 && value <= 0x10ffff && (value < 0xd800 || value > 0xdfff)
        ? String.fromCodePoint(value) : '';
    })
    .replace(/[\u00ad\u200b]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wolArticleUrl(
  html: string,
  request: WolProgramRequest,
  week: WolWeek,
): string {
  const weekValue = /<input\b[^>]*\bid="todayWeek"[^>]*\bvalue="([^"]+)"/i.exec(html)?.[1];
  if (!weekValue || !week.url.endsWith('/' + weekValue)) {
    throw new Error('WOL returned a different meeting week. Try again later.');
  }
  const publication = request.meetingType === 'midweek' ? 'mwb' : 'w';
  const prefix = request.language === 'war' ? '/war/wol/d/r110/lp-sa/' : '/en/wol/d/r1/lp-e/';
  const matches = [...html.matchAll(/<a\b[^>]*>/gi)].flatMap(match => {
    const tag = match[0];
    const classes = /\bclass="([^"]*)"/i.exec(tag)?.[1]?.split(/\s+/) ?? [];
    const href = /\bhref="([^"]*)"/i.exec(tag)?.[1];
    return classes.includes('pub-' + publication) && href?.startsWith(prefix) &&
      /^\d+$/.test(href.slice(prefix.length)) ? [href] : [];
  });
  const unique = [...new Set(matches)];
  if (unique.length !== 1) throw new Error('The current program is unavailable in this WOL language.');
  return 'https://wol.jw.org' + unique[0];
}

interface ArticleBlock {
  readonly tag: string;
  readonly attributes: string;
  readonly text: string;
}

function articleBlocks(html: string): readonly ArticleBlock[] {
  const article = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  return [...article.matchAll(/<(h[1-3]|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi)]
    .filter(match => /\bdata-pid="/.test(match[2] ?? ''))
    .map(match => ({
      tag: (match[1] ?? '').toLowerCase(),
      attributes: match[2] ?? '',
      text: wolText(match[3] ?? ''),
    }));
}

function source(url: string, monday: string, type: MeetingType) {
  return {
    filename: 'WOL ' + monday + ' ' + type,
    page: 1,
    parser: 'wol-v1' as const,
    url,
    retrievedAt: new Date().toISOString(),
  };
}

export function readWolProgram(
  html: string,
  request: WolProgramRequest,
  week: WolWeek,
  url: string,
): MeetingDraft {
  const blocks = articleBlocks(html);
  if (blocks.length === 0) throw new Error('The WOL article has no readable program.');
  const importSource = source(url, week.monday, request.meetingType);

  if (request.meetingType === 'midweek') {
    const agenda = blocks.filter(block =>
      block.tag.startsWith('h') || /^\(\d{1,3}\s*min\.?\)/i.test(block.text),
    ).map(block => block.text).join('\n');
    const candidates = buildWorkbookCandidates([agenda], week.monday.slice(0, 4), request.timezone, importSource.filename);
    const candidate = candidates.length === 1 ? candidates[0] : undefined;
    if (!candidate || candidate.draft.meetingDate !== week.monday) {
      throw new Error('The WOL workbook date does not match the current week.');
    }
    const result = prepareWorkbookCandidate(candidate);
    if (!result.draft) throw new Error(result.reason);
    if (result.draft.programLanguage !== request.language) {
      throw new Error('WOL returned a different program language.');
    }
    const validated = validateMeetingDraft({ ...result.draft, importSource });
    if (!validated.ok) throw new Error(validated.error.message);
    return validated.value;
  }

  const title = blocks.filter(block => block.tag === 'h1');
  const songs = blocks.filter(block => /\bpubRefs\b/.test(block.attributes)).flatMap(block => {
    const song = /^(?:SONG|KARANTAHON)\s+(\d{1,3})\b/i.exec(block.text)?.[1];
    return song && Number(song) > 0 ? [song] : [];
  });
  const date = blocks.find(block => /\bcontextTtl\b/.test(block.attributes))?.text;
  const studyDate = date ? readWorkbookDate(date, week.monday.slice(0, 4)) : null;
  if (
    title.length !== 1 || !title[0]?.text || songs.length !== 2 || songs.some(song => !song) ||
    studyDate !== week.monday
  ) {
    throw new Error('The Watchtower title, week, or study songs could not be verified.');
  }
  const songLabel = request.language === 'war' ? 'Karantahon ' : 'Song ';
  const result = validateMeetingDraft({
    title: request.language === 'war' ? 'Katirok ha kataposan han semana' : 'Weekend meeting',
    meetingType: 'weekend',
    meetingDate: week.monday,
    startLocalTime: null,
    timezone: request.timezone,
    programLanguage: request.language,
    importSource,
    sections: [{
      title: request.language === 'war' ? 'Katirok ha kataposan han semana' : 'Weekend meeting',
      parts: [
        { title: request.language === 'war' ? 'Pagtikang nga karantahon ngan pag-ampo' : 'Opening song and prayer', kind: 'song', durationSeconds: 300, isTimed: true },
        { title: request.language === 'war' ? 'Pahayag publiko' : 'Public talk', kind: 'talk', durationSeconds: 1800, isTimed: true },
        { title: songLabel + songs[0], kind: 'song', durationSeconds: 300, isTimed: true },
        { title: title[0].text, kind: 'study', durationSeconds: 3600, isTimed: true },
        { title: songLabel + songs[1], kind: 'song', durationSeconds: 300, isTimed: true },
      ],
    }],
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
