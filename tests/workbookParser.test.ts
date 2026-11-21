import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildWorkbookCandidates } from '../src/backend/domain/imports/workbookParser';
import { validateMeetingDraft } from '../src/backend/domain/meetings/meetingValidation';

const english = `
NOVEMBER 2-8
TREASURES FROM GOD'S WORD
1. A wrapped
title (10 min.)
2. Spiritual Gems (10 min.)
3. Bible Reading (4 min.)
APPLY YOURSELF TO THE FIELD MINISTRY
4. Starting a Conversation (3 min.)
LIVING AS CHRISTIANS
5. Congregation Bible Study (30 min.)
`;

function parse(page: string) {
  return buildWorkbookCandidates(
    [page], '2026', 'Asia/Manila', 'sample.pdf',
  );
}

test('extracts date, wrapped title, sections, and durations', () => {
  const candidate = parse(english)[0];

  assert.ok(candidate);
  assert.equal(candidate.draft.meetingDate, '2026-11-02');
  assert.equal(candidate.draft.programLanguage, 'en');
  assert.equal(candidate.draft.sections.length, 3);
  assert.equal(
    candidate.draft.sections[0]?.parts[0]?.title,
    'A wrapped title',
  );
  assert.equal(
    candidate.draft.sections[0]?.parts[0]?.durationSeconds,
    600,
  );
  assert.equal(candidate.draft.importSource?.page, 1);
});

test('recognizes Waray headings and language', () => {
  const candidate = parse(`
NOBYEMBRE 2-8
MGA BAHANDI TIKANG HA
PULONG HAN DIOS
1. Usa nga ulohan (10 min.)
`)[0];

  assert.ok(candidate);
  assert.equal(candidate.draft.programLanguage, 'war');
  assert.equal(candidate.draft.meetingDate, '2026-11-02');
});

test('flags missing durations without guessing a value', () => {
  const candidate = parse(`
NOVEMBER 2-8
TREASURES FROM GOD'S WORD
1. Duration missing
`)[0];

  assert.ok(candidate);
  assert.equal(
    candidate.draft.sections[0]?.parts[0]?.durationSeconds,
    0,
  );
  assert.ok(
    candidate.warnings.some(warning => warning.includes('durations')),
  );
});

test('rejects unsupported pages, invalid years, and bad source metadata', () => {
  assert.deepEqual(parse('An unrelated article'), []);

  assert.deepEqual(
    buildWorkbookCandidates(
      [english], 'invalid', 'Asia/Manila', 'sample.pdf',
    ),
    [],
  );

  const candidate = parse(english)[0];
  assert.ok(candidate);

  assert.equal(validateMeetingDraft({
    ...candidate.draft,
    importSource: {
      filename: 'sample.pdf',
      page: 0,
      parser: 'numbered-workbook-v1',
    },
  }).ok, false);
});
