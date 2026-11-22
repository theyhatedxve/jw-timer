import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildWatchtowerCandidates } from '../src/backend/domain/imports/watchtowerParser';

const studies = [
  {
    page: 2, week: 'Nobyembre 2-8',
    title: 'Sarig nga Puproteksyonan Ka ni Jehova',
    middle: 3, closing: 8,
  },
  {
    page: 8, week: 'Nobyembre 9-15',
    title: 'Magkaada “Masinugtanon nga Kasingkasing”',
    middle: 36, closing: 88,
  },
  {
    page: 14, week: 'Nobyembre 16-22',
    title: 'Pagsangyaw han Maopay nga Sumat ha\n“Ngatanan nga Yinaknan han mga Nasud”',
    middle: 84, closing: 57,
  },
  {
    page: 20, week: 'Nobyembre 23-29',
    title: 'An Kahikayan han Pagkasaserdote\nNagpapakita han Gugma ni Jehova',
    middle: 107, closing: 16,
  },
  {
    page: 26, week: 'Nobyembre 30–Disyembre 6',
    title: 'Atohi an “Espiritu han Kalibotan”',
    middle: 22, closing: 124,
  },
] as const;

function fixture(): string[] {
  const pages: string[] = Array(32).fill('');

  for (const study of studies) {
    pages[study.page - 1] = [
      'Article body appears first in extraction.',
      study.title,
      `${study.week.toUpperCase()}, 2026`,
      `KARANTAHON ${study.middle}`,
      'POKUS',
    ].join('\n');

    pages[study.page + 4] =
      `Review questions\nKARANTAHON ${study.closing}`;
  }

  pages[31] = 'AANHI HINI NGA ISYU\n' + studies.map(study =>
    `Aradman nga artikulo ha ${study.week}\n` +
    `${study.page}\n${study.title}\n/CR/CR\n`,
  ).join('') + 'Unrelated back-cover paragraph.';

  return pages;
}

test('reads five studies without mixing their songs', () => {
  const candidates = buildWatchtowerCandidates(fixture());

  assert.deepEqual(candidates.map(item => item.page), [2, 8, 14, 20, 26]);
  assert.deepEqual(candidates.map(item => item.middleSong), [3, 36, 84, 107, 22]);
  assert.deepEqual(candidates.map(item => item.closingSong), [8, 88, 57, 16, 124]);
  assert.ok(candidates.every(item => item.openingSong === null));

  const study = candidates.find(item => item.page === 14);
  assert.ok(study);
  assert.equal(study.endPage, 19);
  assert.equal(
    study.articleTitle,
    'Pagsangyaw han Maopay nga Sumat ha “Ngatanan nga Yinaknan han mga Nasud”',
  );
  assert.equal(study.printedWeek, 'NOBYEMBRE 16-22, 2026');

  assert.equal(
    candidates.at(-1)?.articleTitle,
    'Atohi an “Espiritu han Kalibotan”',
  );
});

test('keeps cross-month week as a label without inventing a meeting date', () => {
  const candidate = buildWatchtowerCandidates(fixture()).at(-1);

  assert.ok(candidate);
  assert.equal(candidate.printedWeek, 'NOBYEMBRE 30-DISYEMBRE 6, 2026');
  assert.equal('meetingDate' in candidate, false);
});

test('missing closing song stays unassigned', () => {
  const pages = fixture();
  pages[18] = 'Review questions without a readable song.';

  assert.equal(
    buildWatchtowerCandidates(pages).find(item => item.page === 14)?.closingSong,
    null,
  );
});

test('ambiguous closing songs stay unassigned', () => {
  const pages = fixture();
  pages[18] = 'KARANTAHON 57\nKARANTAHON 99';

  assert.equal(
    buildWatchtowerCandidates(pages).find(item => item.page === 14)?.closingSong,
    null,
  );
});

test('rejects incorrect contents references and unsupported input', () => {
  const pages = fixture();
  pages[13] = 'Unrelated page with no matching study.';

  assert.equal(
    buildWatchtowerCandidates(pages).some(item => item.page === 14),
    false,
  );

  for (const input of [
    null,
    [],
    [42],
    Array(33).fill(''),
    ['x'.repeat(200_001)],
    ['Ordinary PDF without supported study headings.'],
  ]) {
    assert.deepEqual(buildWatchtowerCandidates(input), []);
  }
});

const englishStudies = [
  [2, 'November 2-8',
    'Trust In Jehovah for Protection', 3, 8],
  [8, 'November 9-15',
    'How to Develop “an Obedient Heart”', 36, 88],
  [14, 'November 16-22',
    'Sharing the Good News in “All the Languages\nof the Nations”', 84, 57],
  [20, 'November 23-29',
    'How the Priesthood Reveals Jehovah’s Love', 107, 16],
  [26, 'November 30–December 6',
    'Guard Against “the Spirit of the World”', 22, 124],
] as const;

function englishFixture(): string[] {
  const pages: string[] = Array(32).fill('');

  for (const [page, week, title, middle, closing] of englishStudies) {
    pages[page - 1] = [
      'Article body appears first in extraction.',
      title,
      `${week.toUpperCase()}, 2026`,
      `SONG ${middle}`,
      'FOCUS',
    ].join('\n');

    pages[page + 4] = `Review questions\nSONG ${closing}`;
  }

  pages[31] = 'IN THIS ISSUE\n' + englishStudies.map(
    ([page, week, title]) =>
      `Study article for ${week}\n${page}\n${title}\n________\n`,
  ).join('') + 'Unrelated back-cover paragraph.';

  return pages;
}

test('reads five English studies with their own song pairs', () => {
  const candidates = buildWatchtowerCandidates(englishFixture());

  assert.deepEqual(candidates.map(item => item.page), [2, 8, 14, 20, 26]);
  assert.deepEqual(candidates.map(item => item.middleSong), [3, 36, 84, 107, 22]);
  assert.deepEqual(candidates.map(item => item.closingSong), [8, 88, 57, 16, 124]);
  assert.ok(candidates.every(item => item.programLanguage === 'en'));
  assert.ok(candidates.every(item => item.openingSong === null));

  const study = candidates.find(item => item.page === 14);
  assert.ok(study);
  assert.equal(study.endPage, 19);
  assert.equal(
    study.articleTitle,
    'Sharing the Good News in “All the Languages of the Nations”',
  );
  assert.equal(study.printedWeek, 'NOVEMBER 16-22, 2026');

  const last = candidates.at(-1);
  assert.ok(last);
  assert.equal(last.printedWeek, 'NOVEMBER 30-DECEMBER 6, 2026');
  assert.equal(last.articleTitle, 'Guard Against “the Spirit of the World”');
});

test('retains Waray language detection', () => {
  const candidates = buildWatchtowerCandidates(fixture());

  assert.equal(candidates.length, 5);
  assert.ok(candidates.every(item => item.programLanguage === 'war'));
});

test('missing or ambiguous English songs remain unassigned', () => {
  const missing = englishFixture();
  missing[18] = 'Review questions without a readable song.';

  assert.equal(
    buildWatchtowerCandidates(missing)
      .find(item => item.page === 14)?.closingSong,
    null,
  );

  const ambiguous = englishFixture();
  ambiguous[18] = 'SONG 57\nSONG 99';

  assert.equal(
    buildWatchtowerCandidates(ambiguous)
      .find(item => item.page === 14)?.closingSong,
    null,
  );
});

test('does not substitute a Waray song header in an English article', () => {
  const pages = englishFixture();
  pages[13] = (pages[13] ?? '').replace('SONG 84', 'KARANTAHON 84');

  const study = buildWatchtowerCandidates(pages)
    .find(item => item.page === 14);

  assert.ok(study);
  assert.equal(study.programLanguage, 'en');
  assert.equal(study.middleSong, null);
  assert.equal(study.closingSong, 57);
});

test('rejects ambiguous contents language', () => {
  const pages = englishFixture();
  pages[31] += '\nAANHI HINI NGA ISYU';

  assert.deepEqual(buildWatchtowerCandidates(pages), []);
});
