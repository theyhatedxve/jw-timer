import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildWorkbookCandidates } from '../src/backend/domain/imports/workbookParser';
import { planOnlineWorkbook } from '../src/backend/domain/imports/onlineWorkbook';
import { planPdfPrograms } from '../src/backend/domain/imports/pdfProgram';
import { importPdfPrograms } from '../src/backend/services/pdfWorkbookImport';
import { createMeetingService, type SavedMeeting } from '../src/backend/services/meetingService';
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

test('auto-import preserves printed durations and adds timed songs and counsel in order', () => {
  const extracted = workbook
    .replace(' | Introduksyon (1 min.)', '\u0002 Introduksyon')
    .replace('Konklusyon (3 min.) | ', 'Konklusyon \u0002\u0005 ')
    .replace('Pag-aram ha Biblia han Kongregasyon (30 min.)', 'Pag-aram ha Biblia han Kongregasyon (30 min.)\nIntroduksyon ha usa nga libro');
  const weeks = planOnlineWorkbook([extracted], 'mwb_SA_202611.pdf', 'Asia/Manila');
  const first = weeks[0];

  assert.equal(first?.date, '2026-11-02');
  assert.ok(first?.draft);
  const parts = first.draft.sections.flatMap(section => section.parts);
  assert.deepEqual(
    parts.map(part => part.durationSeconds),
    [300, 60, 600, 600, 240, 60, 180, 60, 240, 60, 300, 60, 300, 900, 1800, 180, 300],
  );
  assert.deepEqual(
    parts.filter(part => part.title.endsWith('. Sagdon')).map(part => part.title),
    ['3. Sagdon', '4. Sagdon', '5. Sagdon', '6. Sagdon'],
  );
});

test('auto-import pairs songs with comments even when PDF text reverses them', () => {
  const extracted = workbook
    .replace('Karantahon 1 Ngan Pag-ampo | Introduksyon (1 min.)',
      'Introduksyon (1 min.)\n\u2022 Karantahon 1 Ngan Pag-\nampo')
    .replace('Konklusyon (3 min.) | Karantahon 33 Ngan Pag-ampo',
      'Karantahon 33 Ngan Pag-\nampo \uE001 Konklusyon (3 min.)');
  const first = planOnlineWorkbook([extracted], 'mwb_SA_202611.pdf', 'Asia/Manila')[0];
  assert.ok(first?.draft);
  const songs = first.draft.sections.flatMap(section => section.parts)
    .filter(part => part.kind === 'song');
  assert.deepEqual(songs.map(part => part.title), ['Karantahon 1', 'Karantahon 44', 'Karantahon 33']);
});

test('auto-import joins a dated Waray page to its numbered continuation', () => {
  const living = 'PAGKINABUHI SUGAD NGA MGA KRISTIANO';
  const split = workbook.indexOf(living);
  const first = workbook.slice(0, split).replace('NOBYEMBRE 2-8', 'NOBYEMBRE 23-29');
  const continuation = workbook.slice(split)
    .replace('Konklusyon (3 min.) | ', 'Konklusyon (3 min.) ' + '_'.repeat(240) + ' ');
  const following = workbook.replace('NOBYEMBRE 2-8', 'NOBYEMBRE 30–DISYEMBRE 6');
  const weeks = planOnlineWorkbook(
    [first, continuation, following], 'mwb_SA_202611.pdf', 'Asia/Manila',
  );
  const draft = weeks.find(week => week.date === '2026-11-23')?.draft;
  assert.ok(draft);
  assert.equal(draft.importSource?.page, 1);
  const parts = draft.sections.flatMap(section => section.parts);
  assert.deepEqual(parts.filter(part => part.kind === 'song').map(part => part.title),
    ['Karantahon 1', 'Karantahon 44', 'Karantahon 33']);
  assert.ok(parts.some(part => part.title.startsWith('7.') && part.durationSeconds === 900));
  assert.ok(parts.some(part => part.title.startsWith('8.') && part.durationSeconds === 1800));
  assert.equal(weeks.find(week => week.date === '2026-11-30')?.draft?.importSource?.page, 3);
});

test('pairs a closing song across the divider dashes extracted by Android', () => {
  for (const divider of ['-', '\u2010', '\u2212']) {
    const extracted = workbook.replace(
      'Konklusyon (3 min.) | ',
      'Konklusyon (3 min.) ' + divider + '\n',
    );
    const candidate = buildWorkbookCandidates(
      [extracted], '2026', 'Asia/Manila', 'mwb_SA_202611.pdf',
    )[0];
    assert.ok(candidate);
    assert.equal(candidate.warnings.includes(text.extraPlacement), false);
    assert.equal(candidate.draft.sections.at(-1)?.parts.at(-1)?.title, 'Karantahon 33');
  }
});

test('auto-import rejects a continuation with unrelated part numbers', () => {
  const split = workbook.indexOf('PAGKINABUHI SUGAD NGA MGA KRISTIANO');
  const first = workbook.slice(0, split);
  const unrelated = workbook.slice(split).replace('7.', '9.').replace('8.', '10.');
  const week = planOnlineWorkbook([first, unrelated], 'mwb_SA_202611.pdf', 'Asia/Manila')[0];
  assert.equal(week?.draft, null);
});

test('auto-import identifies weeks with incomplete or missing programs', () => {
  const extracted = workbook.replace('(30 min.)', '');
  const weeks = planOnlineWorkbook([extracted], 'mwb_SA_202611.pdf', 'Asia/Manila');
  const first = weeks[0];
  assert.ok(first && first.draft === null);
  assert.equal(first.date, '2026-11-02');
  assert.match(first.reason, /Missing part duration/);
  assert.deepEqual(weeks[1], { date: '2026-11-09', draft: null, reason: text.autoMissingPage });
});

test('local PDF uses online timer preparation and refuses incomplete weeks', () => {
  const local = planPdfPrograms([workbook], 'mwb_SA_202611.pdf', 'Asia/Manila');
  const online = planOnlineWorkbook([workbook], 'mwb_SA_202611.pdf', 'Asia/Manila');
  assert.deepEqual(local, online);
  const first = local.find(item => item.date === '2026-11-02');
  assert.ok(first?.draft);
  assert.ok(first.draft.sections.flatMap(section => section.parts).every(part => part.isTimed));
  const incomplete = planPdfPrograms(
    [workbook.replace('Karantahon 44', '')], 'mwb_SA_202611.pdf', 'Asia/Manila',
  );
  assert.equal(incomplete.find(item => item.date === '2026-11-02')?.draft, null);
  assert.deepEqual(planPdfPrograms([workbook], 'renamed.pdf', 'Asia/Manila'), []);
});

test('automatic PDF saving keeps existing local edits and does not duplicate a week', () => {
  const stored = new Map<string, SavedMeeting>();
  const meetings = createMeetingService({
    list: () => ({
      ok: true,
      value: [...stored.values()].map(item => ({
        id: item.id, revision: item.revision, title: item.draft.title,
        meetingDate: item.draft.meetingDate, meetingType: item.draft.meetingType,
      })),
    }),
    get: id => ({ ok: true, value: stored.get(id) ?? null }),
    save: draft => {
      const saved = {
        id: String(stored.size + 1).padStart(32, '0'),
        revision: 1, updatedAt: 0, draft,
      };
      stored.set(saved.id, saved);
      return { ok: true, value: saved };
    },
  });
  const first = importPdfPrograms(meetings, [workbook], 'mwb_SA_202611.pdf', 'Asia/Manila');
  assert.equal(first.imported, 1);
  assert.ok(first.meetingId);
  const saved = stored.get(first.meetingId);
  assert.ok(saved);
  stored.set(saved.id, { ...saved, draft: { ...saved.draft, title: 'Local meeting edits' } });
  const repeated = importPdfPrograms(meetings, [workbook], 'mwb_SA_202611.pdf', 'Asia/Manila');
  assert.equal(repeated.imported, 0);
  assert.equal(repeated.skipped, 1);
  assert.equal(stored.size, 1);
  assert.equal(stored.get(saved.id)?.draft.title, 'Local meeting edits');
});
