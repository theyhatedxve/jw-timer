import type { MeetingLanguage } from '../meetings/meeting.types';

export interface WatchtowerCandidate {
  readonly key: string;
  readonly page: number;
  readonly endPage: number;
  readonly articleTitle: string;
  readonly printedWeek: string;
  readonly programLanguage: MeetingLanguage;
  readonly openingSong: null;
  readonly middleSong: number | null;
  readonly closingSong: number | null;
}

const WEEK =
  '[A-Z]+\\s+\\d{1,2}\\s*-\\s*' +
  '(?:[A-Z]+\\s+)?\\d{1,2}';

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function compact(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function dateHeaders(value: string): readonly RegExpMatchArray[] {
  return [...value.matchAll(new RegExp(
    `^\\s*(${WEEK})\\s*,\\s*(\\d{4})\\s*$`,
    'gim',
  ))];
}

function songNumbers(
  value: string,
  language: MeetingLanguage,
): readonly number[] {
  const label = language === 'war' ? 'KARANTAHON' : 'SONG';

  return [...value.matchAll(new RegExp(
    `^\\s*${label}\\s+(\\d{1,3})[ \\t]*$`,
    'gim',
  ))].flatMap(match => {
    const number = Number(match[1]);
    return number >= 1 && number <= 999 ? [number] : [];
  });
}

function singleSong(numbers: readonly number[]): number | null {
  return numbers.length === 1 ? numbers[0] ?? null : null;
}

function readTitle(contents: string, article: string): string {
  const articleText = compact(article);
  let title = '';

  for (const rawLine of contents.split('\n')) {
    const line = clean(rawLine);
    if (!line) continue;

    const proposed = clean(`${title} ${line}`);

    if (
      proposed.length > 200 ||
      !articleText.includes(compact(proposed))
    ) {
      break;
    }

    title = proposed;
  }

  return title;
}

export function buildWatchtowerCandidates(
  input: unknown,
): readonly WatchtowerCandidate[] {
  if (
    !Array.isArray(input) ||
    input.length < 1 ||
    input.length > 32
  ) {
    return [];
  }

  const pages: string[] = [];
  let characters = 0;

  for (const page of input) {
    if (typeof page !== 'string') return [];

    characters += page.length;
    if (characters > 200_000) return [];

    pages.push(page
      .normalize('NFKC')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00ad/g, '')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/(?:\/CR)+/g, '\n')
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '\n'));
  }

  const candidates = new Map<number, WatchtowerCandidate>();

  for (const contents of pages) {
    const warayContents =
      /AANHI\s*HINI\s*NGA\s*ISYU/i.test(contents);
    const englishContents =
      /\bIN\s+THIS\s+ISSUE\b/i.test(contents);

    if (warayContents === englishContents) continue;

    const programLanguage: MeetingLanguage =
      englishContents ? 'en' : 'war';

    const entryPrefix = programLanguage === 'en'
      ? 'Study\\s+article\\s+for\\s+'
      : 'Aradman\\s+nga\\s+artikulo\\s+ha\\s+';

    const entries = [...contents.matchAll(new RegExp(
      entryPrefix + `(${WEEK})\\s+(\\d{1,2})\\b`,
      'gi',
    ))];

    if (entries.length > 32) continue;

    entries.forEach((entry, index) => {
      const page = Number(entry[2]);
      const firstPage = pages[page - 1];

      if (!firstPage || candidates.has(page)) return;

      if (
        entries.filter(item => Number(item[2]) === page).length !== 1
      ) {
        return;
      }

      const dates = dateHeaders(firstPage);
      const date = dates[0];

      if (
        dates.length !== 1 ||
        !date ||
        compact(date[1] ?? '') !== compact(entry[1] ?? '')
      ) {
        return;
      }

      const titleStart = (entry.index ?? 0) + entry[0].length;
      const titleEnd = entries[index + 1]?.index ?? contents.length;
      const articleTitle = readTitle(
        contents.slice(titleStart, titleEnd),
        firstPage,
      );

      if (!articleTitle) return;

      let endPage = page;

      while (
        endPage < pages.length &&
        dateHeaders(pages[endPage] ?? '').length === 0
      ) {
        endPage += 1;
      }

      const middleSong = singleSong(songNumbers(
        firstPage,
        programLanguage,
      ));
      const closingSong = singleSong(songNumbers(
        pages.slice(page, endPage).join('\n'),
        programLanguage,
      ));

      candidates.set(page, {
        key: `watchtower:${page}`,
        page,
        endPage,
        articleTitle,
        printedWeek: clean(date[0]),
        programLanguage,
        openingSong: null,
        middleSong,
        closingSong,
      });
    });
  }

  return [...candidates.values()].sort((a, b) => a.page - b.page);
}
