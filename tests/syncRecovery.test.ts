import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSyncService } from '../src/backend/services/syncService';
import { canonicalSync, emptySyncDocument } from '../src/backend/domain/sync/syncCodec';
import { queueSyncJob } from '../src/backend/domain/sync/syncState';
import { type SyncContext, type SyncDocument, type SyncReply, type SyncRequest, type SyncStore } from '../src/backend/domain/sync/syncTypes';
import type { DeviceRequest } from '../src/backend/domain/devices/deviceInvitation';

const scope = 'a'.repeat(32);
const own = `sha256:${'b'.repeat(64)}`;
const leader = `sha256:${'c'.repeat(64)}`;
const key = `${'A'.repeat(122)}==`;
const ack: Extract<SyncRequest, { kind: 'ack' }> = { version: 2, kind: 'ack', requestId: 'e'.repeat(64), sequence: 1, hash: `sha256:${'e'.repeat(64)}` };
const code = JSON.stringify({ version: 1, host: '192.168.1.2', port: 49373, congregationId: scope, fingerprint: leader });

function fixture() {
  let document = emptySyncDocument(scope, own);
  document.binding = { leader, leaderKey: key, remoteScope: scope, peerRevision: 1, term: 1, frozen: false };
  queueSyncJob(document, leader, ack);
  let peers: DeviceRequest[] = [{ label: 'Leader', fingerprint: leader, publicKey: key, state: 'trusted', revision: 1, createdAt: 1 }];
  let resolveResponse!: (value: unknown) => void;
  let markStarted!: () => void;
  const started = new Promise<void>(resolve => { markStarted = resolve; });
  const response = new Promise<unknown>(resolve => { resolveResponse = resolve; });
  const store: SyncStore = {
    read: () => structuredClone(document),
    change<T>(_context: SyncContext, change: (draft: SyncDocument) => T): T {
      const draft = structuredClone(document);
      const result = change(draft);
      document = draft;
      return result;
    },
  };
  const service = createSyncService({
    identities: { read: async () => ({ ok: true, value: { fingerprint: own, publicKey: key, protection: 'hardware' } }) },
    profiles: { load: () => ({ ok: true, value: { recordVersion: 1, interfaceLanguage: 'en', revision: 1,
      name: 'Test', timezone: 'Asia/Manila', programLanguage: 'war', congregationId: scope } }) },
    peers: { list: () => peers }, inspector: { inspect: async publicKey => ({ fingerprint: leader, publicKey }) },
    permissions: { assertReadAllowed: async () => undefined }, store,
    capture: () => ({ version: 2, congregationId: scope, publishers: [], meetings: [] }),
    crypto: { token: async () => 'f'.repeat(64), sign: async () => { throw new Error('Unexpected signing'); }, verify: async () => true },
    request: async () => { markStarted(); return response; }, stop: async () => undefined,
  });
  return { service, started, read: () => structuredClone(document),
    revoke: () => { peers = peers.map(peer => ({ ...peer, revision: 2, state: 'revoked' })); },
    respond: (reply: Partial<SyncReply> = {}, accepted = true) => resolveResponse({ peerFingerprint: leader, accepted,
      reply: canonicalSync({ version: 2, requestId: ack.requestId, status: 'accepted', hash: ack.hash, sequence: 1, ...reply }) }),
  };
}

test('pending native response cannot mark ack delivered after cancellation', async () => {
  const f = fixture();
  const operation = f.service.retry(code);
  const rejection = assert.rejects(operation, /CANCELLED/);
  await f.started;
  const before = f.read();
  f.service.cancel();
  f.respond();
  await rejection;
  assert.deepEqual(f.read(), before);
});

test('peer revocation during a native request blocks delivery state', async () => {
  const f = fixture();
  const operation = f.service.retry(code);
  const rejection = assert.rejects(operation, /DENIED/);
  await f.started;
  f.revoke();
  f.respond();
  await rejection;
  assert.equal(f.read().jobs[0]!.state, 'blocked');
  assert.equal(f.read().events.some(event => event.action === 'ack-delivered'), false);
});

test('ack remains undelivered when transport refuses or reply acknowledges another hash', async () => {
  for (const scenario of ['transport-denied', 'wrong-hash'] as const) {
    const f = fixture();
    const operation = f.service.retry(code);
    const rejection = assert.rejects(operation, /DENIED|CONFLICT/);
    await f.started;
    f.respond(scenario === 'wrong-hash' ? { hash: `sha256:${'1'.repeat(64)}` } : {}, scenario !== 'transport-denied');
    await rejection;
    assert.equal(f.read().jobs[0]!.state, 'blocked');
    assert.equal(f.read().events.some(event => event.action === 'ack-delivered'), false);
  }
});

test('ack delivery is recorded only after a matching accepted response', async () => {
  const f = fixture();
  const operation = f.service.retry(code);
  await f.started;
  assert.equal(f.read().jobs[0]!.state, 'pending');
  assert.equal(f.read().events.some(event => event.action === 'ack-delivered'), false);
  f.respond();
  await operation;
  assert.equal(f.read().jobs[0]!.state, 'done');
  assert.equal(f.read().jobs[0]!.attempts, 1);
  assert.equal(f.read().events.filter(event => event.action === 'ack-delivered').length, 1);
});

test('a conflict response does not record ack-delivered', async () => {
  const f = fixture();
  const operation = f.service.retry(code);
  const rejection = assert.rejects(operation, /CONFLICT/);
  await f.started;
  f.respond({ status: 'conflict' });
  await rejection;
  assert.equal(f.read().jobs[0]!.state, 'blocked');
  assert.equal(f.read().events.some(event => event.action === 'ack-delivered'), false);
});
