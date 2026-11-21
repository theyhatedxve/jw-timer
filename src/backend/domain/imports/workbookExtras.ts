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
        title: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
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
    /\b((?:Song|Karantahon)\s+\d{1,3})(?!\d)(?:\s*\(\s*(\d{1,3})\s*min\.?\s*\))?/gi,
    'song',
  );

  const opening = markers(
    source,
    /\b(Opening\s+Comments|Introduksyon)(?:\s*\(\s*(\d{1,3})\s*min\.?\s*\))?/gi,
    'comments',
  );

  const closing = markers(
    source,
    /\b(Concluding\s+Comments|Konklusyon)(?:\s*\(\s*(\d{1,3})\s*min\.?\s*\))?/gi,
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
    .replace(/[|•·,;:\u2013\u2014]/g, ' ')
    .trim();

  return /^(?:(?:and|prayer|ngan|pag[- ]ampo)\s*)*$/i.test(gap);
}

function adjacent(
  source: string,
  first: Marker,
  second: Marker,
): boolean {
  return first.end <= second.index &&
    second.index - first.end <= 160 &&
    isConnector(source.slice(first.end, second.index));
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

  const openingSongs = opening
    ? extras.songs.filter(song =>
        adjacent(extras.source, song, opening),
      )
    : [];

  const closingSongs = closing
    ? extras.songs.filter(song =>
        adjacent(extras.source, closing, song),
      )
    : [];

  const openingSong = openingSongs.length === 1
    ? openingSongs[0]
    : undefined;

  const closingSong = closingSongs.length === 1
    ? closingSongs[0]
    : undefined;

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