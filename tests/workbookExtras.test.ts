import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  arrangeWorkbookExtras,
  readWorkbookExtras,
} from '../src/backend/domain/imports/workbookExtras';

import type {
  MeetingSectionDraft,
} from '../src/backend/domain/meetings/meeting.types';

import { workbookParsingEn as text } from '../src/constants/strings/workbookParsingEn';

const sections: readonly MeetingSectionDraft[] = [{
  title: 'LIVING AS CHRISTIANS',
  parts: [{
    title: 'Study',
    kind: 'study',
    durationSeconds: 1800,
    isTimed: true,
  }],
}];

test('places songs using comment anchors despite extraction order', () => {
  const warnings = new Set<string>();

  const result = arrangeWorkbookExtras(
    readWorkbookExtras(`
Karantahon 44
Karantahon 1 Ngan Pag-ampo Introduksyon (1 min.)
Konklusyon (3 min.) Karantahon 33 Ngan Pag-ampo
`),
    sections,
    warnings,
  );

  assert.deepEqual(
    result.flatMap(section => section.parts.map(part => part.title)),
    [
      'Karantahon 1',
      'Introduksyon',
      'Karantahon 44',
      'Study',
      'Konklusyon',
      'Karantahon 33',
    ],
  );

  assert.equal(result[0]?.parts[1]?.durationSeconds, 60);
  assert.equal(result[2]?.parts[0]?.durationSeconds, 180);
  assert.equal(warnings.has(text.extraDuration), true);

  const songs = result.flatMap(section =>
    section.parts.filter(part => part.kind === 'song'),
  );

  assert.equal(songs.every(song => song.durationSeconds === 0), true);
});

test('retains printed English song durations', () => {
  const warnings = new Set<string>();

  const result = arrangeWorkbookExtras(
    readWorkbookExtras(`
Song 1 (5 min.) and Prayer | Opening Comments (1 min.)
Song 2 (5 min.)
Concluding Comments (3 min.) | Song 3 (5 min.) and Prayer
`),
    sections,
    warnings,
  );

  const songs = result.flatMap(section =>
    section.parts.filter(part => part.kind === 'song'),
  );

  assert.equal(songs.length, 3);
  assert.equal(songs.every(song => song.durationSeconds === 300), true);
  assert.equal(warnings.has(text.extraPlacement), false);
  assert.equal(warnings.has(text.extraDuration), false);
});

test('keeps ambiguous songs in a review section', () => {
  const warnings = new Set<string>();

  const result = arrangeWorkbookExtras(
    readWorkbookExtras('Song 1\nSong 2'),
    sections,
    warnings,
  );

  const pending = result.find(
    section => section.title === text.songsToArrange,
  );

  assert.equal(pending?.parts.length, 2);
  assert.equal(warnings.has(text.extraPlacement), true);
});