import type {
  MeetingPartDraft,
  MeetingSectionDraft,
} from '../meetings/meeting.types';

import { workbookParsingEn as text } from '../../../constants/strings/workbookParsingEn';

interface Marker {
  readonly index: number;
  readonly end: number;
  readonly part: MeetingPartDraft;
}

export interface WorkbookExtras {
  readonly source: string;
  readonly songs: readonly Marker[];
  readonly opening: readonly Marker[];
  readonly closing: readonly Marker[];
  readonly boundaries: readonly number[];
}

function markers(
  source: string,
  pattern: RegExp,
  kind: MeetingPartDraft['kind'],
): Marker[] {
  return [...source.matchAll(pattern)].map(match => {
    const index = match.index ?? 0;
    const minutes = Number(match[2]);

    const hasDuration =
      Number.isInteger(minutes) &&
      minutes > 0 &&
      minutes <= 120;

    return {
      index,
      end: index + match[0].length,
      part: {
        title: (match[1] ?? '')
          .replace(/\s+/g, ' ')
          .replace(/^(Song|Karantahon)(?=\d)/i, '$1 ')
          .trim(),
        kind,
        durationSeconds: hasDuration ? minutes * 60 : 0,
        isTimed: hasDuration,
      },
    };
  });
}

export function readWorkbookExtras(source: string): WorkbookExtras {
  const songs = markers(
    source,
    /\b((?:Song|Karantahon)\s*\d{1,3})(?!\d)(?:\s*\(\s*(\d{1,3})\s*min\.?\s*\))?/gi,
    'song',
  );

  const opening = markers(
    source,
    /\b(Opening\s+Comments|Introduksyon)(?:\s*\(\s*(\d{1,3})\s*min\.?\s*\)|(?=[ \t]*(?:[|•·]|$)))/gim,
    'comments',
  );

  const closing = markers(
    source,
    /\b(Concluding\s+Comments|Konklusyon)(?:\s*\(\s*(\d{1,3})\s*min\.?\s*\)|(?=[ \t]*(?:[|•·]|(?:Song|Karantahon)\b|$)))/gim,
    'comments',
  );

  return {
    source,
    songs,
    opening,
    closing,
    boundaries: [...songs, ...opening, ...closing]
      .map(marker => marker.index),
  };
}

function isConnector(value: string): boolean {
  const gap = value
    .replace(/[\u0000-\u001F\u007F\uE000-\uF8FF_|•·˙▪◦●■♪♫,;:\u002D\u2010-\u2015\u2212]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return gap.length <= 160 &&
    /^(?:(?:and|prayer|ngan|pag\s*-?\s*ampo)\s*)*$/i.test(gap);
}

function adjacent(
  source: string,
  first: Marker,
  second: Marker,
): boolean {
  return first.end <= second.index &&
    isConnector(source.slice(first.end, second.index));
}

function songBeside(
  extras: WorkbookExtras,
  comment: Marker,
  songFirst: boolean,
): Marker | undefined {
  for (const before of [songFirst, !songFirst]) {
    const matches = extras.songs.filter(song =>
      before
        ? adjacent(extras.source, song, comment)
        : adjacent(extras.source, comment, song),
    );
    if (matches.length > 0) return matches.length === 1 ? matches[0] : undefined;
  }
  return undefined;
}

function songUnderLivingHeading(extras: WorkbookExtras): Marker | undefined {
  const headings = [...extras.source.matchAll(
    /\b(?:LIVING\s*AS\s+CHRISTIANS|PAGKINABUHI\s+SUGAD\s+NGA\s+MGA\s+KRISTIANO)\b/gi,
  )];
  const heading = headings.length === 1 ? headings[0] : undefined;
  if (!heading || heading.index === undefined) return undefined;

  const end = heading.index + heading[0].length;
  const songs = extras.songs.filter(song =>
    song.index >= end &&
    isConnector(extras.source.slice(end, song.index)),
  );
  return songs.length === 1 ? songs[0] : undefined;
}

export function arrangeWorkbookExtras(
  extras: WorkbookExtras,
  sections: readonly MeetingSectionDraft[],
  warnings: Set<string>,
): readonly MeetingSectionDraft[] {
  const opening = extras.opening.length === 1
    ? extras.opening[0]
    : undefined;

  const closing = extras.closing.length === 1
    ? extras.closing[0]
    : undefined;

  let openingSong = opening ? songBeside(extras, opening, true) : undefined;
  let closingSong = closing ? songBeside(extras, closing, false) : undefined;

  if (opening && closing && extras.songs.length === 3 && (!openingSong || !closingSong)) {
    const middle = songUnderLivingHeading(extras);
    const paired = openingSong ?? closingSong;
    if (middle && paired && middle !== paired) {
      const remaining = extras.songs.find(song => song !== middle && song !== paired);
      openingSong ??= remaining;
      closingSong ??= remaining;
    }
  }

  const middleSongs = extras.songs.filter(song =>
    song.index !== openingSong?.index &&
    song.index !== closingSong?.index,
  );

  const livingIndexes = sections.flatMap((section, index) =>
    /LIVING\s+AS\s+CHRISTIANS|PAGKINABUHI\s+SUGAD\s+NGA\s+MGA\s+KRISTIANO/i
      .test(section.title)
      ? [index]
      : [],
  );

  const middleSong = middleSongs.length === 1
    ? middleSongs[0]
    : undefined;

  const canPlaceSongs =
    extras.songs.length === 3 &&
    openingSong !== undefined &&
    closingSong !== undefined &&
    openingSong.index !== closingSong.index &&
    middleSong !== undefined &&
    livingIndexes.length === 1;

  if (!opening || !closing || !canPlaceSongs) {
    warnings.add(text.extraPlacement);
  }

  if (
    [...extras.songs, ...extras.opening, ...extras.closing]
      .some(marker => marker.part.durationSeconds === 0)
  ) {
    warnings.add(text.extraDuration);
  }

  const result: MeetingSectionDraft[] = [];

  const openingParts: MeetingPartDraft[] = [];

  if (canPlaceSongs && openingSong) {
    openingParts.push(openingSong.part);
  }

  if (opening) openingParts.push(opening.part);

  if (openingParts.length > 0) {
    result.push({
      title: text.openingSection,
      parts: openingParts,
    });
  }

  sections.forEach((section, index) => {
    result.push(
      canPlaceSongs &&
      middleSong &&
      index === livingIndexes[0]
        ? {
            ...section,
            parts: [middleSong.part, ...section.parts],
          }
        : section,
    );
  });

  if (!canPlaceSongs && extras.songs.length > 0) {
    result.push({
      title: text.songsToArrange,
      parts: extras.songs.map(song => song.part),
    });
  }

  const closingParts: MeetingPartDraft[] = [];

  if (closing) closingParts.push(closing.part);

  if (canPlaceSongs && closingSong) {
    closingParts.push(closingSong.part);
  }

  if (closingParts.length > 0) {
    result.push({
      title: text.closingSection,
      parts: closingParts,
    });
  }

  return result;
}