import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalSync, emptySyncDocument, parseSyncDataset, parseSyncProof, parseSyncRequest, syncHead } from '../src/backend/domain/sync/syncCodec';
import { appendVerifiedRevision, priorSyncReply, queueSyncJob, rememberSyncReply } from '../src/backend/domain/sync/syncState';
import { EMPTY_SYNC_HASH, SYNC_LIMITS, type SyncDataset, type SyncProof, type SyncRequest } from '../src/backend/domain/sync/syncTypes';

const scope = 'a'.repeat(32);
const leader = `sha256:${'b'.repeat(64)}`;
const peer = `sha256:${'c'.repeat(64)}`;

function dataset(): SyncDataset {
  return {
    version: 2, congregationId: scope,
    publishers: [
      { id: '1'.repeat(32), displayName: 'Alex', isActive: true, roles: ['microphones'] },
      { id: '2'.repeat(32), displayName: 'Alex', isActive: true, roles: ['sound'] },
    ],
    meetings: [{ id: '3'.repeat(32), revision: 1, draft: {
      title: 'Midweek Meeting', meetingType: 'midweek', meetingDate: '2026-11-25',
      startLocalTime: '18:00', endLocalTime: '20:00', timezone: 'Asia/Manila', programLanguage: 'war', sections: [],
    }, duties: [
      { key: 'mic-server', publisherId: '1'.repeat(32) },
      { key: 'sound-operator', publisherId: '2'.repeat(32) },
      { key: 'laptop-operator', publisherId: null },
      { key: 'microphone-adjuster', publisherId: null },
    ] }],
  };
}

// Structural fixtures: appendVerifiedRevision requires verification by its caller.
function proof(sequence = 1, parentHash = EMPTY_SYNC_HASH, digit = 'd'): SyncProof {
  return { body: { version: 2, kind: 'revision', congregationId: scope, authorFingerprint: leader,
    sequence, parentHash, requestId: digit.repeat(64), createdAt: 1, dataset: dataset() },
  hash: `sha256:${digit.repeat(64)}`, signature: 'A'.repeat(96) };
}
function document() {
  const value = emptySyncDocument(scope, peer);
  value.binding = { leader, leaderKey: `${'A'.repeat(122)}==`, remoteScope: scope, peerRevision: 1, term: 1, frozen: false };
  return value;
}

test('duplicate display names retain distinct publisher IDs and assignments through the wire format', () => {
  const parsed = parseSyncDataset(JSON.parse(canonicalSync(dataset())));
  assert.deepEqual(parsed.publishers.map(person => [person.id, person.displayName]), [
    ['1'.repeat(32), 'Alex'], ['2'.repeat(32), 'Alex'],
  ]);
  assert.deepEqual(parsed.meetings[0]!.duties.slice(0, 2).map(duty => duty.publisherId), ['1'.repeat(32), '2'.repeat(32)]);
});

test('rejects inactive, wrong-role, missing and duplicate-ID publishers', () => {
  const base = dataset();
  for (const publishers of [
    [{ ...base.publishers[0]!, isActive: false }, base.publishers[1]!],
    [{ ...base.publishers[0]!, roles: ['laptop'] }, base.publishers[1]!],
    [base.publishers[1]!],
    [base.publishers[0]!, { ...base.publishers[1]!, id: base.publishers[0]!.id }],
  ]) assert.throws(() => parseSyncDataset({ ...base, publishers }), /INVALID_DATA/);
});

test('requires exactly the four distinct technical duty slots', () => {
  const base = dataset();
  const meeting = base.meetings[0]!;
  for (const duties of [meeting.duties.slice(1), [...meeting.duties, { key: 'reader', publisherId: null }],
    meeting.duties.map((duty, index) => index === 1 ? { ...duty, key: 'mic-server' } : duty)]) {
    assert.throws(() => parseSyncDataset({ ...base, meetings: [{ ...meeting, duties }] }), /INVALID_DATA/);
  }
});

test('rejects malformed, oversized and unknown dataset or request fields', () => {
  for (const input of [null, [], { ...dataset(), timerCheckpoint: {} },
    { ...dataset(), publishers: [{ ...dataset().publishers[0], unexpected: true }] }]) {
    assert.throws(() => parseSyncDataset(input), /INVALID_DATA/);
  }
  const oversized: SyncDataset = { version: 2, congregationId: scope, meetings: [],
    publishers: Array.from({ length: SYNC_LIMITS.publishers }, (_, index) => ({
      id: index.toString(16).padStart(32, '0'), displayName: 'x'.repeat(100), isActive: true,
      roles: ['microphones', 'sound', 'laptop', 'microphone-adjuster'],
    })) };
  assert.ok(canonicalSync(oversized).length > SYNC_LIMITS.datasetCharacters);
  assert.throws(() => parseSyncDataset(oversized), /INVALID_DATA/);
  assert.throws(() => parseSyncRequest({ version: 2, kind: 'pull', requestId: '1'.repeat(64), sequence: 0, hash: EMPTY_SYNC_HASH, extra: true }), /INVALID_DATA/);
});

test('proof parsing binds dataset scope, kind, sequence and proposal request identity', () => {
  const valid = proof();
  assert.deepEqual(parseSyncProof(valid), valid);
  for (const body of [{ ...valid.body, congregationId: 'f'.repeat(32) },
    { ...valid.body, kind: 'revision', sequence: 0 }, { ...valid.body, authorFingerprint: 'invalid' },
    { ...valid.body, extra: true }]) {
    assert.throws(() => parseSyncProof({ ...valid, body }), /INVALID_DATA/);
  }
  assert.throws(() => parseSyncRequest({ version: 2, kind: 'proposal', requestId: 'f'.repeat(64),
    proof: { ...valid, body: { ...valid.body, kind: 'proposal' } } }), /INVALID_DATA/);
});

test('accepts genesis and sequential parents while quarantining forks and skipped sequences', () => {
  const value = document();
  const genesis = proof();
  assert.equal(appendVerifiedRevision(value, genesis), true);
  assert.equal(appendVerifiedRevision(value, proof(2, genesis.hash, 'e')), true);
  const fork = proof(2, genesis.hash, 'f');
  assert.equal(appendVerifiedRevision(value, fork), false);
  assert.equal(appendVerifiedRevision(value, fork), false);
  assert.equal(appendVerifiedRevision(value, proof(4, value.history[1]!.hash, '1')), false);
  assert.equal(value.quarantine.length, 2);
  assert.deepEqual(syncHead(value), { sequence: 2, hash: `sha256:${'e'.repeat(64)}` });
});

test('append plus ack is idempotent and conflicting request IDs cannot replace queued work or cached replies', () => {
  const value = document();
  const revision = proof();
  const ack: SyncRequest = { version: 2, kind: 'ack', requestId: revision.hash.slice(7), sequence: 1, hash: revision.hash };
  assert.equal(appendVerifiedRevision(value, revision, { peer: leader, request: ack }), true);
  assert.equal(appendVerifiedRevision(value, revision, { peer: leader, request: ack }), true);
  assert.equal(value.history.length, 1);
  assert.equal(value.jobs.length, 1);
  assert.equal(value.events.filter(event => event.action === 'revision-accepted').length, 1);
  const changed = { ...ack, sequence: 2 };
  assert.throws(() => queueSyncJob(value, leader, changed), /CONFLICT/);
  const reply = { version: 2 as const, requestId: ack.requestId, status: 'accepted' as const, hash: ack.hash };
  rememberSyncReply(value, peer, ack, reply);
  assert.deepEqual(priorSyncReply(value, peer, ack), reply);
  assert.throws(() => priorSyncReply(value, peer, changed), /CONFLICT/);
});

test('append and ack failures roll back together in the fake transaction (unit proof, not SQLite verification)', () => {
  let committed = document();
  const revision = proof();
  const ack: SyncRequest = { version: 2, kind: 'ack', requestId: revision.hash.slice(7), sequence: 1, hash: revision.hash };
  queueSyncJob(committed, leader, { ...ack, sequence: 2 });
  const before = structuredClone(committed);
  const transaction = (change: (draft: typeof committed) => void) => {
    const draft = structuredClone(committed);
    change(draft);
    committed = draft;
  };
  assert.throws(() => transaction(draft => { appendVerifiedRevision(draft, revision, { peer: leader, request: ack }); }), /CONFLICT/);
  assert.deepEqual(committed, before);
});
