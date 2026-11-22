import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildWeekendProgram } from '../src/backend/domain/imports/weekendProgram';
import { readWorkbookSource } from '../src/backend/domain/imports/workbookSource';
import { validateMeetingDraft } from '../src/backend/domain/meetings/meetingValidation';

const confirmed = {
  articleTitle: 'Example study title',
  openingSong: 56,
  middleSong: 84,
  closingSong: 57,
  meetingDate: '2026-11-22',
  startLocalTime: '09:00',
  timezone: 'Asia/Manila',
  programLanguage: 'en',
};

test('builds five ordered parts totaling 105 minutes', () => {
  const result = buildWeekendProgram(confirmed);

  assert.ok(result.ok);
  const parts = result.value.sections.flatMap(section => section.parts);

  assert.deepEqual(
    parts.map(part => part.kind),
    ['song', 'talk', 'song', 'study', 'song'],
  );

  assert.deepEqual(
    parts.map(part => part.durationSeconds),
    [300, 1800, 300, 3600, 300],
  );

  assert.equal(
    parts.reduce((total, part) => total + part.durationSeconds, 0),
    6300,
  );

  assert.equal(parts[3]?.title, confirmed.articleTitle);
  assert.ok(parts.every(part => part.isTimed));
  assert.equal(result.value.meetingType, 'weekend');
});

test('preserves confirmed local schedule and timezone', () => {
  for (const timezone of ['Asia/Manila', 'America/New_York']) {
    const result = buildWeekendProgram({ ...confirmed, timezone });

    assert.ok(result.ok);
    assert.equal(result.value.timezone, timezone);
    assert.equal(result.value.meetingDate, '2026-11-22');
    assert.equal(result.value.startLocalTime, '09:00');
  }
});

test('rejects missing and invalid song numbers', () => {
  for (const field of ['openingSong', 'middleSong', 'closingSong']) {
    for (const invalid of [undefined, null, '', '56', 0, -1, 1.5, 1000]) {
      const result = buildWeekendProgram({
        ...confirmed,
        [field]: invalid,
      });

      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.error.field, field);
    }
  }
});

test('rejects invalid article and scheduling fields', () => {
  for (const change of [
    { articleTitle: '' },
    { meetingDate: '2026-02-30' },
    { startLocalTime: null },
    { startLocalTime: '' },
    { startLocalTime: '25:00' },
    { timezone: 'Invalid/Zone' },
    { programLanguage: 'unsupported' },
  ]) {
    assert.equal(
      buildWeekendProgram({ ...confirmed, ...change }).ok,
      false,
    );
  }

  assert.equal(buildWeekendProgram(null).ok, false);
});

test('keeps imported Waray title and song labels', () => {
  const result = buildWeekendProgram({
    ...confirmed,
    programLanguage: 'war',
    articleTitle: 'Titulo han pag-aram',
  });

  assert.ok(result.ok);
  const parts = result.value.sections.flatMap(section => section.parts);

  assert.equal(parts[0]?.title, 'Karantahon 56');
  assert.equal(parts[3]?.title, 'Titulo han pag-aram');
});

test('preserves valid PDF provenance through JSON round-trip', () => {
  for (const parser of [
    'numbered-workbook-v1',
    'workbook-v2',
    'watchtower-v1',
  ] as const) {
    const importSource = {
      filename: 'publication.pdf',
      page: 14,
      parser,
    };

    const result = buildWeekendProgram({
      ...confirmed,
      importSource,
    });

    assert.ok(result.ok);
    assert.deepEqual(result.value.importSource, importSource);
    assert.deepEqual(
      validateMeetingDraft(JSON.parse(JSON.stringify(result.value))),
      result,
    );
  }
});

test('rejects invalid PDF provenance', () => {
  for (const importSource of [
    { filename: 'publication.pdf', page: 14, parser: 'unknown' },
    { filename: 'publication.pdf', page: 33, parser: 'watchtower-v1' },
    { filename: '', page: 14, parser: 'watchtower-v1' },
  ]) {
    assert.equal(readWorkbookSource(importSource), null);

    const result = buildWeekendProgram({
      ...confirmed,
      importSource,
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.field, 'importSource');
  }
});
