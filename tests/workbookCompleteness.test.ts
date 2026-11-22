import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildWorkbookCandidates } from '../src/backend/domain/imports/workbookParser';
import { reviewWorkbookCoverage } from '../src/backend/domain/imports/workbookCoverage';
import { workbookParsingEn as text } from '../src/constants/strings/workbookParsingEn';

const workbook = `
NOBYEMBRE 2-8
Karantahon 1 Ngan Pag-ampo | Introduksyon (1 min.)
MGA BAHANDI TIKANG HA PULONG HAN DIOS
1. Buligi an iba (10 min.)
2. Espirituwal nga mga Hiyas (10 min.)
3. Pagbasa ha Biblia (4 min.)
MAGIN MAS EPEKTIBO HA MINISTERYO
4. Pagtikang ha Pakiistorya (3 min.)
5. Pakiistorya Utro (4 min.)
6. Panhimo hin Disipulo (5 min.)
PAGKINABUHI SUGAD NGA MGA KRISTIANO
Karantahon 44
7. Ayaw Gud Kalimti (15 min.)
8. Pag-aram ha Biblia han Kongregasyon (30 min.)
Konklusyon (3 min.) | Karantahon 33 Ngan Pag-ampo
`;

test('retains all example minutes and three song numbers', () => {
  const candidate = buildWorkbookCandidates(
    [workbook], '2026', 'Asia/Manila', 'workbook.pdf',
  )[0];

  assert.ok(candidate);
  const parts = candidate.draft.sections.flatMap(section => section.parts);

  assert.deepEqual(
    parts.filter(part => part.isTimed).map(part => part.durationSeconds),
    [60, 600, 600, 240, 180, 240, 300, 900, 1800, 180],
  );

  assert.equal(
    parts.reduce(
      (total, part) => total + (part.isTimed ? part.durationSeconds : 0),
      0,
    ),
    85 * 60,
  );

  assert.deepEqual(
    parts.filter(part => part.kind === 'song').map(part => part.title),
    ['Karantahon 1', 'Karantahon 44', 'Karantahon 33'],
  );

  assert.equal(candidate.warnings.includes(text.minuteCoverage), false);
  assert.equal(candidate.warnings.includes(text.songCoverage), false);
});

test('detects omitted printed minutes without guessing their placement', () => {
  assert.ok(reviewWorkbookCoverage(workbook, []).includes(text.minuteCoverage));
});

test('equal totals with different durations still require review', () => {
  const warnings = reviewWorkbookCoverage(
    'First (10 min.) Second (5 min.)',
    [{
      title: 'Imported section',
      parts: [{
        title: 'Combined incorrectly',
        kind: 'talk',
        durationSeconds: 900,
        isTimed: true,
      }],
    }],
  );

  assert.ok(warnings.includes(text.minuteCoverage));
});
