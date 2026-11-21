import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { createSyncService } from '../src/backend/services/syncService';
import { canonicalSync, emptySyncDocument } from '../src/backend/domain/sync/syncCodec';
import { EMPTY_SYNC_HASH, SyncFailure, type SyncBody, type SyncContext, type SyncDataset, type SyncDocument, type SyncStore } from '../src/backend/domain/sync/syncTypes';
import type { DeviceRequest } from '../src/backend/domain/devices/deviceInvitation';

const scope = 'a'.repeat(32);
const dataset: SyncDataset = { version: 2, congregationId: scope, publishers: [], meetings: [] };
const signingText = (serialized: string) => `JW-Timer/sync-proof/v2\n${serialized}`;
function identity() {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  return { ...pair, publicKey, fingerprint: `sha256:${createHash('sha256').update(Buffer.from(publicKey, 'base64')).digest('hex')}` };
}
function signed(body: SyncBody, signer: ReturnType<typeof identity>) {
  const serialized = signingText(canonicalSync(body));
  return { body, hash: `sha256:${createHash('sha256').update(serialized).digest('hex')}`,
    signature: sign('sha256', Buffer.from(serialized), signer.privateKey).toString('base64') };
}
function fixture() {
  const own = identity();
  const remote = identity();
  let peers: DeviceRequest[] = [{ label: 'Editor', publicKey: remote.publicKey, fingerprint: remote.fingerprint,
    state: 'trusted', revision: 1, createdAt: 1 }];
  let document = emptySyncDocument(scope, own.fingerprint);
  let readAllowed = true;
  let permissionChecks = 0;
  let afterVerify: (() => void) | undefined;
  let inspectionCount = 0;
  let inspectionHook: ((count: number) => void) | undefined;
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
    identities: { read: async () => ({ ok: true, value: { fingerprint: own.fingerprint, publicKey: own.publicKey, protection: 'hardware' } }) },
    profiles: { load: () => ({ ok: true, value: { recordVersion: 1, interfaceLanguage: 'en', revision: 1,
      name: 'Test', timezone: 'Asia/Manila', programLanguage: 'war', congregationId: scope } }) },
    peers: { list: () => peers }, inspector: { inspect: async key => {
      inspectionHook?.(++inspectionCount);
      return { publicKey: key, fingerprint: remote.fingerprint };
    } },
    permissions: { assertReadAllowed: async () => { permissionChecks++; if (!readAllowed) throw new SyncFailure('DENIED'); } },
    store, capture: () => dataset,
    crypto: {
      token: async () => 'e'.repeat(64),
      sign: async serialized => ({ hash: `sha256:${createHash('sha256').update(signingText(serialized)).digest('hex')}`,
        signature: sign('sha256', Buffer.from(signingText(serialized)), own.privateKey).toString('base64') }),
      verify: async (key, serialized, hash, signature) => {
        const valid = hash === `sha256:${createHash('sha256').update(signingText(serialized)).digest('hex')}` &&
          verify('sha256', Buffer.from(signingText(serialized)), createPublicKey({ key: Buffer.from(key, 'base64'), format: 'der', type: 'spki' }), Buffer.from(signature, 'base64'));
        afterVerify?.();
        return valid;
      },
    },
    request: async () => { throw new Error('No network in server tests'); }, stop: async () => undefined,
  });
  const proposal = signed({ version: 2, kind: 'proposal', congregationId: scope, authorFingerprint: remote.fingerprint,
    sequence: 0, parentHash: EMPTY_SYNC_HASH, requestId: '1'.repeat(64), createdAt: 1, dataset }, remote);
  const request = { version: 2, requestId: proposal.body.requestId, kind: 'proposal', proof: proposal };
  return { service, own, remote, proposal, request,
    read: () => structuredClone(document), checks: () => permissionChecks,
    revokeReadAfterVerify: () => { afterVerify = () => { readAllowed = false; }; },
    revokePeerAfterVerify: () => { afterVerify = () => { peers = peers.map(peer => ({ ...peer, state: 'revoked', revision: 2 })); }; },
    inspectHook: (hook: (count: number) => void) => { inspectionCount = 0; inspectionHook = hook; },
  };
}

test('read permission alone does not authorize proposals; explicit editor grant does', async () => {
  const f = fixture();
  await f.service.bindSelf();
  const pull = { version: 2, kind: 'pull', requestId: '2'.repeat(64), sequence: 0, hash: EMPTY_SYNC_HASH };
  assert.equal(JSON.parse(await f.service.handle(f.remote.fingerprint, scope, canonicalSync(pull))).status, 'up-to-date');
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request)), /DENIED/);
  assert.equal(f.read().proposals.length, 0);
  await f.service.setEditor(f.remote.fingerprint, true);
  assert.equal(JSON.parse(await f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request))).status, 'accepted');
  assert.equal(f.read().proposals.length, 1);
});

test('server repeats read authorization after asynchronous signature verification', async () => {
  const f = fixture();
  await f.service.bindSelf();
  await f.service.setEditor(f.remote.fingerprint, true);
  f.revokeReadAfterVerify();
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request)), /DENIED/);
  assert.equal(f.checks(), 2);
  assert.equal(f.read().proposals.length, 0);
  assert.equal(f.read().inbox.length, 0);
});

test('peer revocation during signature verification prevents committing a proposal', async () => {
  const f = fixture();
  await f.service.bindSelf();
  await f.service.setEditor(f.remote.fingerprint, true);
  f.revokePeerAfterVerify();
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request)), /DENIED/);
  assert.equal(f.read().proposals.length, 0);
});

test('server verifies signed body content and refuses a replay after editor grant removal', async () => {
  const f = fixture();
  await f.service.bindSelf();
  await f.service.setEditor(f.remote.fingerprint, true);
  const altered = { ...f.request, proof: { ...f.proposal, body: { ...f.proposal.body, createdAt: 2 } } };
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync(altered)), /INVALID_SIGNATURE/);
  const accepted = await f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request));
  assert.equal(await f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request)), accepted);
  assert.equal(f.read().proposals.length, 1);
  const reusedId = { ...f.request, proof: signed({ ...f.proposal.body, createdAt: 3 }, f.remote) };
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync(reusedId)), /CONFLICT/);
  assert.equal(f.read().proposals[0]!.proof.hash, f.proposal.hash);
  await f.service.setEditor(f.remote.fingerprint, false);
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request)), /DENIED/);
});

test('publish and proposal submission require a current matching preview stage', async () => {
  const f = fixture();
  await f.service.bindSelf();
  await assert.rejects(f.service.publish(), /NOT_FOUND/);
  await assert.rejects(f.service.queueProposal(), /NOT_FOUND/);
  await f.service.previewLocal();
  f.service.cancel();
  await assert.rejects(f.service.publish(), /NOT_FOUND/);
  assert.equal(f.read().history.length, 0);
  await f.service.previewLocal();
  await f.service.publish();
  assert.equal(f.read().history.length, 1);
  await assert.rejects(f.service.publish(), /NOT_FOUND/);
});

test('server acknowledges immutable revisions idempotently without growing inbox rows', async () => {
  const f = fixture();
  await f.service.bindSelf();
  await f.service.previewLocal();
  await f.service.publish();
  const head = f.read().history[0]!;
  const request = { version: 2, kind: 'ack', requestId: head.hash.slice(7), sequence: 1, hash: head.hash };
  const reply = await f.service.handle(f.remote.fingerprint, scope, canonicalSync(request));
  assert.equal(JSON.parse(reply).status, 'accepted');
  assert.equal(await f.service.handle(f.remote.fingerprint, scope, canonicalSync(request)), reply);
  assert.deepEqual(f.read().acknowledgments, [{ peer: f.remote.fingerprint, hash: head.hash }]);
  assert.equal(f.read().events.filter(event => event.action === 'peer-acknowledged').length, 1);
  assert.equal(f.read().inbox.length, 0);
  await assert.rejects(f.service.handle(f.remote.fingerprint, scope, canonicalSync({ ...request, sequence: 2 })), /CONFLICT/);
});

test('cancellation during the second awaited author inspection prevents proposal publication', async () => {
  const f = fixture();
  await f.service.bindSelf();
  await f.service.setEditor(f.remote.fingerprint, true);
  await f.service.handle(f.remote.fingerprint, scope, canonicalSync(f.request));
  await f.service.previewProposal(f.proposal.body.requestId);
  const inspections: number[] = [];
  f.inspectHook(count => {
    inspections.push(count);
    if (count === 2) f.service.cancel();
  });
  await assert.rejects(f.service.publish(), /CANCELLED/);
  assert.deepEqual(inspections, [1, 2]);
  assert.equal(f.read().history.length, 0);
  assert.equal(f.read().proposals[0]!.state, 'pending');
  assert.equal(f.read().proposals[0]!.revisionHash, undefined);
  assert.equal(f.read().events.some(event => event.action === 'proposal-approved'), false);
});

test('mutating returned preview data cannot alter the staged dataset that publication persists', async () => {
  const f = fixture();
  await f.service.bindSelf();
  const preview = await f.service.previewLocal();
  // Simulate a mutable view consumer without weakening the public readonly type.
  Reflect.set(preview.candidateDataset, 'congregationId', 'f'.repeat(32));
  (preview.candidateDataset.publishers as unknown[]).push({
    id: '4'.repeat(32), displayName: 'Injected', isActive: true, roles: ['sound'],
  });
  await f.service.publish();
  assert.deepEqual(f.read().history[0]!.body.dataset, dataset);
});
