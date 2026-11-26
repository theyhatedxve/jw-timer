import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  currentWolWeek,
  readWolProgram,
  wolArticleUrl,
  type WolProgramRequest,
} from '../src/backend/domain/imports/wolProgram';
import { readWorkbookSource } from '../src/backend/domain/imports/workbookSource';
import { createOnlineWorkbookImporter } from '../src/backend/services/onlineWorkbookImport';
import { createMeetingService, type SavedMeeting } from '../src/backend/services/meetingService';

const at = Date.parse('2026-11-26T14:00:00Z');
const request: WolProgramRequest = { language: 'en', timezone: 'Asia/Manila', meetingType: 'midweek' };
const article = (language: 'en' | 'war', type: 'midweek' | 'weekend') =>
  readFileSync(new URL('./fixtures/wol-' + language + '-' + type + '.html', import.meta.url), 'utf8');

test('WOL week uses local Monday and the ISO week-year across New Year', () => {
  const instant = Date.parse('2027-01-03T16:30:00Z');
  assert.equal(currentWolWeek(request, instant).monday, '2027-01-04');
  assert.equal(currentWolWeek({ ...request, timezone: 'America/Los_Angeles' }, instant).monday, '2026-12-28');
  assert.ok(currentWolWeek(request, Date.parse('2027-01-01T12:00:00Z')).url.endsWith('/2026/53'));
});

test('WOL links are selected from the requested week, publication and language', () => {
  const week = currentWolWeek(request, at);
  const index = '<input id="todayWeek" value="2026/48">' +
    '<a class="pub-mwb today" href="/en/wol/d/r1/lp-e/202026404">Workbook</a>' +
    '<a class="pub-w publicationCitation" href="/en/wol/d/r1/lp-e/2026565">Study</a>';
  assert.equal(wolArticleUrl(index, request, week), 'https://wol.jw.org/en/wol/d/r1/lp-e/202026404');
  assert.equal(wolArticleUrl(index, { ...request, meetingType: 'weekend' }, week), 'https://wol.jw.org/en/wol/d/r1/lp-e/2026565');
  assert.throws(() => wolArticleUrl(index.replace('2026/48', '2026/47'), request, week));
  assert.throws(() => wolArticleUrl(index.replace('/en/wol/d/r1/lp-e/202026404', 'https://example.org/program'), request, week));
});

for (const language of ['en', 'war'] as const) {
  test('reads the live WOL workbook layout in ' + language + ' with all songs and durations', () => {
    const selection = { ...request, language };
    const week = currentWolWeek(selection, at);
    const url = language === 'en'
      ? 'https://wol.jw.org/en/wol/d/r1/lp-e/202026404'
      : 'https://wol.jw.org/war/wol/d/r110/lp-sa/202026404';
    const draft = readWolProgram(article(language, 'midweek'), selection, week, url);
    assert.equal(draft.meetingDate, '2026-11-23');
    assert.equal(draft.programLanguage, language);
    const parts = draft.sections.flatMap(section => section.parts);
    assert.deepEqual(parts.filter(part => part.kind === 'song').map(part => part.title.match(/\d+/)?.[0]), ['158', '109', '74']);
    assert.equal(parts.filter(part => part.kind === 'other').length, 8);
    assert.equal(parts.filter(part => /Counsel|Sagdon/.test(part.title)).length, 4);
    assert.deepEqual(parts.filter(part => part.kind === 'other').map(part => part.durationSeconds), [600, 600, 240, 180, 240, 300, 900, 1800]);
    assert.deepEqual(readWorkbookSource(draft.importSource), draft.importSource);
    assert.throws(() => readWolProgram(article(language, 'midweek').replace('158', 'not-a-song'), selection, week, url));
  });

  test('reads the current Watchtower title and two study songs in ' + language, () => {
    const selection: WolProgramRequest = { ...request, language, meetingType: 'weekend' };
    const week = currentWolWeek(selection, at);
    const url = language === 'en'
      ? 'https://wol.jw.org/en/wol/d/r1/lp-e/2026565'
      : 'https://wol.jw.org/war/wol/d/r110/lp-sa/2026565';
    const draft = readWolProgram(article(language, 'weekend'), selection, week, url);
    const parts = draft.sections.flatMap(section => section.parts);
    assert.deepEqual(parts.map(part => part.durationSeconds), [300, 1800, 300, 3600, 300]);
    assert.ok(parts[2]?.title.endsWith('107'));
    assert.ok(parts[4]?.title.endsWith('16'));
    assert.equal(parts[3]?.kind, 'study');
    assert.ok((parts[3]?.title.length ?? 0) > 10);
    assert.throws(() => readWolProgram(article(language, 'weekend').replace('107', 'missing'), selection, week, url));
  });
}

test('saved weeks are reused and cancellation prevents saving', async () => {
  const monday = currentWolWeek(request).monday;
  const fixtureWeek = currentWolWeek(request, at);
  const draft = readWolProgram(article('en', 'midweek'), request, fixtureWeek, 'https://wol.jw.org/en/wol/d/r1/lp-e/202026404');
  const saved: SavedMeeting = {
    id: 'a'.repeat(32), revision: 1, updatedAt: at, draft: { ...draft, meetingDate: monday },
  };
  let saves = 0;
  let loads = 0;
  const meetings = createMeetingService({
    list: () => ({ ok: true, value: [{
      id: saved.id, revision: 1, title: saved.draft.title, meetingDate: monday, meetingType: 'midweek',
    }] }),
    get: () => ({ ok: true, value: saved }),
    save: () => { saves += 1; return { ok: true, value: saved }; },
  });
  const importer = createOnlineWorkbookImporter(meetings, async () => { loads += 1; return saved.draft; });
  const result = await importer(request, new AbortController().signal);
  assert.deepEqual(result, { ok: true, value: { monday, imported: false } });
  assert.equal(loads, 0);
  assert.equal(saves, 0);

  const controller = new AbortController();
  controller.abort();
  assert.deepEqual(await importer(request, controller.signal), { ok: true, value: null });
  assert.equal(saves, 0);

  const empty = createMeetingService({
    list: () => ({ ok: true, value: [] }),
    get: () => ({ ok: true, value: null }),
    save: () => { saves += 1; return { ok: true, value: saved }; },
  });
  const pending = new AbortController();
  const cancelled = createOnlineWorkbookImporter(empty, async () => {
    pending.abort();
    return saved.draft;
  });
  assert.deepEqual(await cancelled(request, pending.signal), { ok: true, value: null });
  assert.equal(saves, 0);
});

test('website provenance rejects external hosts and missing retrieval dates', () => {
  const source = {
    filename: 'WOL', page: 1, parser: 'wol-v1',
    url: 'https://wol.jw.org/en/wol/d/r1/lp-e/202026404', retrievedAt: '2026-11-26T14:00:00.000Z',
  };
  assert.ok(readWorkbookSource(source));
  assert.equal(readWorkbookSource({ ...source, url: 'https://example.org/program' }), null);
  assert.equal(readWorkbookSource({ ...source, retrievedAt: undefined }), null);
});
