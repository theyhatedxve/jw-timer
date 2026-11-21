import type { DeviceIdentityService } from './deviceIdentityService';
import type { ProfileService } from './profileService';
import type { DevicePermissionService } from './devicePermissionService';
import type { DeviceRequest } from '../domain/devices/deviceInvitation';
import { isDeviceFingerprint } from '../domain/devices/devicePermissions';
import { isCongregationId } from '../domain/profile/profile';
import { parseLanConnection } from '../domain/devices/lanConnection';
import {
  canonicalSync, isSyncId, parseSyncDataset, parseSyncProof, parseSyncReply,
  parseSyncRequest, syncHead, syncRecord, toSharedSchedule,
} from '../domain/sync/syncCodec';
import {
  appendVerifiedRevision, maySubmitDraft, priorSyncReply, queueSyncJob, quarantineSyncProof,
  rememberSyncReply, requireSyncBinding, requireSyncLeader, syncEvent,
} from '../domain/sync/syncState';
import {
  EMPTY_SYNC_HASH, SYNC_LIMITS, SyncFailure, type SyncBody, type SyncContext,
  type SyncDataset, type SyncPreview, type SyncProof, type SyncReply, type SyncRequest, type SyncStatus, type SyncStore,
} from '../domain/sync/syncTypes';

interface SyncDependencies {
  identities: Pick<DeviceIdentityService, 'read'>;
  profiles: Pick<ProfileService, 'load'>;
  peers: { list(owner: string): readonly DeviceRequest[] };
  inspector: { inspect(key: string): Promise<unknown> };
  permissions: Pick<DevicePermissionService, 'assertReadAllowed'>;
  store: SyncStore;
  capture(scope: string): SyncDataset;
  crypto: {
    token(): Promise<string>;
    sign(body: string): Promise<unknown>;
    verify(publicKey: string, body: string, hash: string, signature: string): Promise<boolean>;
  };
  request(publicKey: string, code: string, body: string): Promise<unknown>;
  stop(): Promise<void>;
}
type Context = SyncContext & { publicKey: string; peer?: DeviceRequest };

export function createSyncService(dependencies: SyncDependencies) {
  const d = dependencies;
  let generation = 0;
  let candidate: { context: SyncContext; dataset: SyncDataset; parent: string; proposalId: string | null; generation: number } | null = null;

  function localScope(): string {
    const profile = d.profiles.load();
    if (!profile.ok || !profile.value || !isCongregationId(profile.value.congregationId)) throw new SyncFailure('PROFILE_CHANGED');
    return profile.value.congregationId;
  }
  function assertContext(context: SyncContext): void {
    if (localScope() !== context.localScope) throw new SyncFailure('PROFILE_CHANGED');
  }
  function assertPeer(context: SyncContext, peer: DeviceRequest): void {
    assertContext(context);
    const current = d.peers.list(context.owner).find(item => item.fingerprint === peer.fingerprint);
    if (!current || current.state !== 'trusted' || current.revision !== peer.revision || current.publicKey !== peer.publicKey) throw new SyncFailure('DENIED');
  }
  async function context(fingerprint?: string): Promise<Context> {
    const identity = await d.identities.read();
    if (!identity.ok || !identity.value) throw new SyncFailure('IDENTITY');
    const current: Context = { owner: identity.value.fingerprint, publicKey: identity.value.publicKey, localScope: localScope() };
    if (fingerprint !== undefined) {
      if (!isDeviceFingerprint(fingerprint) || fingerprint === current.owner) throw new SyncFailure('DENIED');
      const peer = d.peers.list(current.owner).find(item => item.fingerprint === fingerprint && item.state === 'trusted');
      if (!peer) throw new SyncFailure('DENIED');
      const inspected = syncRecord(await d.inspector.inspect(peer.publicKey));
      if (inspected.fingerprint !== fingerprint || inspected.publicKey !== peer.publicKey) throw new SyncFailure('IDENTITY');
      assertPeer(current, peer);
      current.peer = peer;
    }
    return current;
  }
  async function token(): Promise<string> {
    const id = await d.crypto.token();
    if (!isSyncId(id)) throw new SyncFailure('INVALID_DATA');
    return id;
  }
  async function sign(body: SyncBody): Promise<SyncProof> {
    const signature = syncRecord(await d.crypto.sign(canonicalSync(body)));
    return parseSyncProof({ body, hash: signature.hash, signature: signature.signature });
  }
  async function verify(proof: SyncProof, key: string): Promise<void> {
    if (!await d.crypto.verify(key, canonicalSync(proof.body), proof.hash, proof.signature)) throw new SyncFailure('INVALID_SIGNATURE');
  }
  function follower(context: Context) {
    const document = d.store.read(context);
    const binding = requireSyncBinding(document);
    if (!context.peer || binding.leader !== context.peer.fingerprint || binding.leaderKey !== context.peer.publicKey ||
      binding.peerRevision !== context.peer.revision) throw new SyncFailure('ADOPTION_REQUIRED');
    return { document, binding };
  }
  async function rpc(context: Context, codeText: string, request: SyncRequest, expectedGeneration: number): Promise<SyncReply> {
    if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
    if (!context.peer) throw new SyncFailure('DENIED');
    const { binding } = follower(context);
    const code = parseLanConnection(codeText);
    if (code.fingerprint !== binding.leader || code.congregationId !== binding.remoteScope) throw new SyncFailure('DENIED');
    const response = syncRecord(await d.request(context.peer.publicKey, JSON.stringify(code), canonicalSync(request)));
    if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
    assertPeer(context, context.peer);
    follower(context);
    if (response.peerFingerprint !== context.peer.fingerprint || response.accepted !== true || typeof response.reply !== 'string' ||
      response.reply.length > SYNC_LIMITS.messageCharacters + 1024) throw new SyncFailure('DENIED');
    return parseSyncReply(JSON.parse(response.reply), request.requestId);
  }
  function stage(context: Context, dataset: SyncDataset, proposalId: string | null, expectedGeneration: number): SyncPreview {
    if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
    const document = d.store.read(context);
    const binding = requireSyncBinding(document);
    const parsed = parseSyncDataset({ ...dataset, congregationId: binding.remoteScope });
    // The view receives a different object from the exact staged persistence candidate.
    candidate = { context: { owner: context.owner, localScope: context.localScope }, dataset: parseSyncDataset(JSON.parse(canonicalSync(parsed))),
      parent: syncHead(document).hash, proposalId, generation };
    const current = document.history.at(-1);
    return { currentDataset: current?.body.dataset ?? null, candidateDataset: parsed,
      current: current ? toSharedSchedule(current.body.dataset, current.body.createdAt) : null,
      candidate: toSharedSchedule(parsed), proposalId };
  }
  async function retryWith(context: Context, code: string, expectedGeneration: number): Promise<void> {
    follower(context);
    const pending = d.store.read(context).jobs.filter(job => job.state === 'pending' || job.state === 'blocked');
    for (const job of pending.slice(0, 32)) {
      if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
      if (job.peer !== context.peer?.fingerprint) continue;
      if (job.state === 'pending' && job.notBefore > Date.now()) continue;
      // Retry is an explicit operator command; blocked work is reauthorized before sending.
      try {
        const reply = await rpc(context, code, job.request, expectedGeneration);
        const expectedHash = job.request.kind === 'proposal' ? job.request.proof.hash : job.request.kind === 'ack' ? job.request.hash : '';
        if (reply.hash !== expectedHash || !['accepted', 'conflict'].includes(reply.status) ||
          (job.kind === 'ack' && reply.status !== 'accepted')) throw new SyncFailure(reply.code === 'DENIED' ? 'DENIED' : 'CONFLICT');
        d.store.change(context, document => {
          const current = document.jobs.find(item => item.id === job.id);
          if (!current) throw new SyncFailure('NOT_FOUND');
          current.attempts++;
          current.state = reply.status === 'conflict' ? 'conflict' : job.kind === 'ack' ? 'done' : 'delivered';
          current.code = '';
          syncEvent(document, job.kind === 'ack' ? 'ack-delivered' : 'proposal-delivered', job.peer, expectedHash);
        });
      } catch (error) {
        if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
        assertContext(context);
        d.store.change(context, document => {
          const current = document.jobs.find(item => item.id === job.id);
          if (!current) return;
          current.attempts++;
          current.code = error instanceof SyncFailure ? error.code : 'NETWORK';
          current.state = current.attempts >= SYNC_LIMITS.attempts || current.code === 'DENIED' || current.code === 'CONFLICT' ? 'blocked' : 'pending';
          current.notBefore = Date.now() + Math.min(60_000, 1000 * 2 ** Math.min(current.attempts, 6));
          syncEvent(document, 'transfer-failed', job.peer);
        });
        throw error;
      }
    }
    for (const job of d.store.read(context).jobs.filter(item => item.kind === 'proposal' && ['delivered', 'conflict'].includes(item.state)).slice(0, 16)) {
      const reply = await rpc(context, code, { version: 2, requestId: await token(), kind: 'proposal-status', proposalId: job.id }, expectedGeneration);
      if (job.request.kind !== 'proposal' || reply.hash !== job.request.proof.hash ||
        !['pending', 'conflict', 'approved', 'rejected'].includes(reply.status)) throw new SyncFailure('INVALID_DATA');
      d.store.change(context, document => {
        const current = document.jobs.find(item => item.id === job.id);
        if (!current) return;
        current.state = reply.status === 'pending' ? 'delivered' : reply.status as 'conflict' | 'approved' | 'rejected';
      });
    }
  }

  return {
    cancel() { generation++; candidate = null; void d.stop().catch(() => undefined); },
    async status(): Promise<SyncStatus> {
      const current = await context();
      const document = d.store.read(current);
      return {
        ownFingerprint: current.owner, localScope: current.localScope, binding: document.binding,
        head: syncHead(document), peers: d.peers.list(current.owner).filter(peer => peer.state === 'trusted').map(peer => ({
          fingerprint: peer.fingerprint, label: peer.label, draftAllowed: maySubmitDraft(document, peer.fingerprint, peer.revision),
        })), jobs: document.jobs, proposals: document.proposals, events: document.events,
        restored: document.restored.map((dataset, index) => ({ index, title: dataset.meetings[0]?.draft.title ?? `Draft ${index + 1}` })),
      };
    },
    async bindSelf(): Promise<void> {
      const expectedGeneration = generation;
      const current = await context();
      if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
      d.store.change(current, document => {
        const binding = document.binding;
        if (binding && (binding.leader !== current.owner || binding.remoteScope !== current.localScope || binding.leaderKey !== current.publicKey)) throw new SyncFailure('CONFLICT');
        document.binding = { leader: current.owner, leaderKey: current.publicKey, remoteScope: current.localScope,
          peerRevision: 0, term: 1, frozen: false };
        syncEvent(document, binding ? 'leader-reapproved' : 'leader-initialized');
      });
      candidate = null;
    },
    async adopt(fingerprint: string, codeText: string): Promise<void> {
      const expectedGeneration = generation;
      const current = await context(fingerprint);
      const peer = current.peer;
      if (!peer) throw new SyncFailure('DENIED');
      const code = parseLanConnection(codeText);
      if (code.fingerprint !== fingerprint) throw new SyncFailure('DENIED');
      const requestId = await token();
      if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
      // QR/NSD metadata is only a hint: authenticate its scope and leader role
      // over pinned TLS before making an immutable authority binding.
      const response = syncRecord(await d.request(peer.publicKey, JSON.stringify(code), canonicalSync({
        version: 2, kind: 'pull', requestId, sequence: 0, hash: EMPTY_SYNC_HASH,
      })));
      if (response.peerFingerprint !== fingerprint || response.accepted !== true || typeof response.reply !== 'string' ||
        response.reply.length > SYNC_LIMITS.messageCharacters + 1024) throw new SyncFailure('DENIED');
      const reply = parseSyncReply(JSON.parse(response.reply), requestId);
      if (reply.status === 'accepted' && reply.proof) {
        const genesis = parseSyncProof(reply.proof);
        if (genesis.body.kind !== 'revision' || genesis.body.sequence !== 1 || genesis.body.parentHash !== EMPTY_SYNC_HASH ||
          genesis.body.authorFingerprint !== fingerprint || genesis.body.congregationId !== code.congregationId) throw new SyncFailure('DENIED');
        await verify(genesis, peer.publicKey);
      } else if (reply.status !== 'up-to-date' || reply.sequence !== 0 || reply.hash !== EMPTY_SYNC_HASH) throw new SyncFailure('DENIED');
      if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
      assertPeer(current, peer);
      d.store.change(current, document => {
        const binding = document.binding;
        if (binding && (binding.leader !== fingerprint || binding.remoteScope !== code.congregationId || binding.leaderKey !== peer.publicKey)) throw new SyncFailure('CONFLICT');
        document.binding = { leader: fingerprint, leaderKey: peer.publicKey, remoteScope: code.congregationId,
          peerRevision: peer.revision, term: 1, frozen: false };
        syncEvent(document, binding ? 'leader-reapproved' : 'leader-adopted', fingerprint);
      });
      candidate = null;
    },
    async setEditor(fingerprint: string, enabled: boolean): Promise<void> {
      const expectedGeneration = generation;
      if (typeof enabled !== 'boolean') throw new SyncFailure('INVALID_DATA');
      const current = await context(fingerprint);
      const peer = current.peer;
      if (!peer) throw new SyncFailure('DENIED');
      assertPeer(current, peer);
      if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
      d.store.change(current, document => {
        requireSyncLeader(current, document);
        const grant = document.grants.find(item => item.peer === fingerprint);
        if (grant) { grant.peerRevision = peer.revision; grant.enabled = enabled; }
        else document.grants.push({ peer: fingerprint, peerRevision: peer.revision, enabled });
        syncEvent(document, enabled ? 'draft-grant-enabled' : 'draft-grant-disabled', fingerprint);
      });
    },
    async previewLocal(): Promise<SyncPreview> {
      candidate = null;
      const expectedGeneration = generation;
      const current = await context();
      return stage(current, d.capture(current.localScope), null, expectedGeneration);
    },
    async previewRestored(index: number): Promise<SyncPreview> {
      candidate = null;
      const expectedGeneration = generation;
      const current = await context();
      if (!Number.isSafeInteger(index) || index < 0) throw new SyncFailure('INVALID_DATA');
      const dataset = d.store.read(current).restored[index];
      if (!dataset) throw new SyncFailure('NOT_FOUND');
      return stage(current, dataset, null, expectedGeneration);
    },
    async previewProposal(id: string): Promise<SyncPreview> {
      candidate = null;
      const expectedGeneration = generation;
      const current = await context();
      const document = d.store.read(current);
      requireSyncLeader(current, document);
      const proposal = document.proposals.find(item => item.id === id && ['pending', 'conflict'].includes(item.state));
      if (!proposal) throw new SyncFailure('NOT_FOUND');
      return stage(current, proposal.proof.body.dataset, id, expectedGeneration);
    },
    async publish(): Promise<void> {
      const selected = candidate;
      if (!selected) throw new SyncFailure('NOT_FOUND');
      const current = await context();
      const document = d.store.read(current);
      requireSyncLeader(current, document);
      if (selected.context.owner !== current.owner || selected.context.localScope !== current.localScope || selected.generation !== generation || selected.parent !== syncHead(document).hash) throw new SyncFailure('CONFLICT');
      const proposal = selected.proposalId ? document.proposals.find(item => item.id === selected.proposalId) : null;
      if (proposal) {
        const author = await context(proposal.peer);
        if (!author.peer || author.peer.revision !== proposal.peerRevision || !maySubmitDraft(d.store.read(current), proposal.peer, proposal.peerRevision)) throw new SyncFailure('DENIED');
        await verify(proposal.proof, author.peer.publicKey);
      }
      const proof = await sign({ version: 2, kind: 'revision', congregationId: requireSyncBinding(document).remoteScope,
        authorFingerprint: current.owner, sequence: syncHead(document).sequence + 1, parentHash: selected.parent,
        requestId: await token(), createdAt: Date.now(), dataset: selected.dataset });
      if (candidate !== selected || generation !== selected.generation) throw new SyncFailure('CANCELLED');
      if (proposal) {
        const author = await context(proposal.peer);
        if (author.peer?.revision !== proposal.peerRevision) throw new SyncFailure('DENIED');
      }
      if (candidate !== selected || generation !== selected.generation) throw new SyncFailure('CANCELLED');
      d.store.change(current, live => {
        requireSyncLeader(current, live);
        if (syncHead(live).hash !== selected.parent) throw new SyncFailure('CONFLICT');
        if (proposal && !maySubmitDraft(live, proposal.peer, proposal.peerRevision)) throw new SyncFailure('DENIED');
        const pending = proposal ? live.proposals.find(item => item.id === proposal.id) : null;
        if (proposal && (!pending || !['pending', 'conflict'].includes(pending.state))) throw new SyncFailure('CONFLICT');
        if (!appendVerifiedRevision(live, proof)) throw new SyncFailure('CONFLICT');
        if (pending) { pending.state = 'approved'; pending.revisionHash = proof.hash; }
        syncEvent(live, pending ? 'proposal-approved' : 'revision-published', proposal?.peer, proof.hash);
      });
      candidate = null;
    },
    async queueProposal(): Promise<void> {
      const selected = candidate;
      if (!selected) throw new SyncFailure('NOT_FOUND');
      const base = await context();
      const binding = requireSyncBinding(d.store.read(base));
      const current = await context(binding.leader);
      const { document } = follower(current);
      if (selected.context.owner !== current.owner || selected.context.localScope !== current.localScope || selected.generation !== generation || selected.parent !== syncHead(document).hash) throw new SyncFailure('CONFLICT');
      const proof = await sign({ version: 2, kind: 'proposal', congregationId: binding.remoteScope,
        authorFingerprint: current.owner, sequence: syncHead(document).sequence, parentHash: selected.parent,
        requestId: await token(), createdAt: Date.now(), dataset: selected.dataset });
      if (candidate !== selected || generation !== selected.generation || !current.peer) throw new SyncFailure('CANCELLED');
      assertPeer(current, current.peer);
      d.store.change(current, live => {
        const active = requireSyncBinding(live);
        if (active.leader !== binding.leader || syncHead(live).hash !== selected.parent) throw new SyncFailure('CONFLICT');
        queueSyncJob(live, binding.leader, { version: 2, kind: 'proposal', requestId: proof.body.requestId, proof });
      });
      candidate = null;
    },
    async rejectProposal(id: string): Promise<void> {
      const expectedGeneration = generation;
      const current = await context();
      if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
      d.store.change(current, document => {
        requireSyncLeader(current, document);
        const proposal = document.proposals.find(item => item.id === id);
        if (!proposal || !['pending', 'conflict'].includes(proposal.state)) throw new SyncFailure('NOT_FOUND');
        proposal.state = 'rejected';
        syncEvent(document, 'proposal-rejected', proposal.peer, proposal.proof.hash);
      });
      candidate = null;
    },
    async retry(code: string): Promise<void> {
      const expectedGeneration = generation;
      const current = await context(parseLanConnection(code).fingerprint);
      await retryWith(current, code, expectedGeneration);
    },
    async synchronize(code: string): Promise<void> {
      candidate = null;
      const expectedGeneration = generation;
      const current = await context(parseLanConnection(code).fingerprint);
      follower(current);
      for (let index = 0; index <= SYNC_LIMITS.history; index++) {
        if (generation !== expectedGeneration) throw new SyncFailure('CANCELLED');
        const head = syncHead(d.store.read(current));
        const reply = await rpc(current, code, { version: 2, kind: 'pull', requestId: await token(), sequence: head.sequence, hash: head.hash }, expectedGeneration);
        if (reply.status === 'up-to-date') {
          if (reply.sequence !== head.sequence || reply.hash !== head.hash) throw new SyncFailure('CONFLICT');
          await retryWith(current, code, expectedGeneration);
          return;
        }
        if (reply.status !== 'accepted' || !reply.proof) throw new SyncFailure(reply.status === 'conflict' ? 'CONFLICT' : 'DENIED');
        const proof = parseSyncProof(reply.proof);
        const { binding } = follower(current);
        try { await verify(proof, binding.leaderKey); }
        catch (error) {
          assertContext(current);
          d.store.change(current, document => quarantineSyncProof(document, proof, 'INVALID_SIGNATURE'));
          throw error;
        }
        if (generation !== expectedGeneration || !current.peer) throw new SyncFailure('CANCELLED');
        assertPeer(current, current.peer);
        const accepted = d.store.change(current, document => {
          const active = requireSyncBinding(document);
          if (active.leader !== current.peer?.fingerprint || active.peerRevision !== current.peer.revision) throw new SyncFailure('ADOPTION_REQUIRED');
          return appendVerifiedRevision(document, proof, { peer: binding.leader,
            request: { version: 2, kind: 'ack', requestId: proof.hash.slice(7), sequence: proof.body.sequence, hash: proof.hash } });
        });
        if (!accepted) throw new SyncFailure('CONFLICT');
      }
      throw new SyncFailure('LIMIT');
    },
    async readPublished(fingerprint: string) {
      const current = await context(fingerprint);
      const document = d.store.read(current);
      if (!document.binding || document.binding.leader !== fingerprint) return null;
      if (document.binding.peerRevision !== current.peer?.revision) throw new SyncFailure('ADOPTION_REQUIRED');
      const proof = document.history.at(-1);
      if (!proof) return null;
      await verify(proof, document.binding.leaderKey);
      if (!current.peer) throw new SyncFailure('DENIED');
      assertPeer(current, current.peer);
      return toSharedSchedule(proof.body.dataset, proof.body.createdAt);
    },
    async handle(fingerprint: string, requestedScope: string, serialized: string): Promise<string> {
      if (serialized.length > SYNC_LIMITS.messageCharacters) throw new SyncFailure('INVALID_DATA');
      const request = parseSyncRequest(JSON.parse(serialized));
      const current = await context(fingerprint);
      const peer = current.peer;
      if (!peer || requestedScope !== current.localScope) throw new SyncFailure('DENIED');
      await d.permissions.assertReadAllowed(fingerprint, requestedScope);
      assertPeer(current, peer);
      const original = d.store.read(current);
      requireSyncLeader(current, original);
      if (requireSyncBinding(original).remoteScope !== requestedScope) throw new SyncFailure('DENIED');
      if (request.kind === 'proposal') {
        if (!maySubmitDraft(original, fingerprint, peer.revision) || request.proof.body.authorFingerprint !== fingerprint || request.proof.body.congregationId !== requestedScope) throw new SyncFailure('DENIED');
        await verify(request.proof, peer.publicKey);
        await d.permissions.assertReadAllowed(fingerprint, requestedScope);
        assertPeer(current, peer);
      }
      const reply = d.store.change(current, document => {
        requireSyncLeader(current, document);
        const response = (status: SyncReply['status'], extras: Partial<SyncReply> = {}): SyncReply => ({ version: 2, requestId: request.requestId, status, ...extras });
        if (request.kind === 'pull') {
          const head = syncHead(document);
          const previous = request.sequence === 0 ? EMPTY_SYNC_HASH : document.history[request.sequence - 1]?.hash;
          if (previous !== request.hash) return response('conflict', { code: 'CONFLICT' });
          if (request.sequence === head.sequence) return response('up-to-date', { sequence: head.sequence, hash: head.hash });
          const proof = document.history[request.sequence];
          if (!proof) return response('conflict', { code: 'CONFLICT' });
          if (!document.events.some(event => event.action === 'revision-served' && event.peer === fingerprint && event.hash === proof.hash)) syncEvent(document, 'revision-served', fingerprint, proof.hash);
          return response('accepted', { hash: proof.hash, sequence: proof.body.sequence, proof });
        }
        if (request.kind === 'proposal-status') {
          const proposal = document.proposals.find(item => item.id === request.proposalId && item.peer === fingerprint && item.peerRevision === peer.revision);
          return proposal ? response(proposal.state, { hash: proposal.proof.hash, ...(proposal.revisionHash ? { revisionHash: proposal.revisionHash } : {}) }) : response('error', { code: 'NOT_FOUND' });
        }
        if (request.kind === 'proposal' && !maySubmitDraft(document, fingerprint, peer.revision)) throw new SyncFailure('DENIED');
        const prior = priorSyncReply(document, fingerprint, request);
        if (prior) return prior;
        if (request.kind === 'ack') {
          const proof = document.history[request.sequence - 1];
          if (!proof || proof.hash !== request.hash) throw new SyncFailure('CONFLICT');
          if (!document.acknowledgments.some(ack => ack.peer === fingerprint && ack.hash === request.hash)) {
            document.acknowledgments.push({ peer: fingerprint, hash: request.hash });
            syncEvent(document, 'peer-acknowledged', fingerprint, request.hash);
          }
          const reply = response('accepted', { hash: request.hash, sequence: request.sequence });
          // Canonical receipt IDs and immutable history reconstruct the same reply
          // without letting a reader grow an inbox with arbitrary request IDs.
          return reply;
        }
        const existing = document.proposals.find(item => item.id === request.requestId);
        if (existing) throw new SyncFailure('CONFLICT');
        // Leave capacity for revocation, receipt acknowledgments and local recovery.
        if (document.proposals.filter(item => item.peer === fingerprint && ['pending', 'conflict'].includes(item.state)).length >= 16 ||
          document.proposals.filter(item => ['pending', 'conflict'].includes(item.state)).length >= 64 ||
          canonicalSync(document).length + 2 * canonicalSync(request).length > SYNC_LIMITS.stateCharacters - 1024 * 1024) throw new SyncFailure('LIMIT');
        const head = syncHead(document);
        const conflict = request.proof.body.parentHash !== head.hash || request.proof.body.sequence !== head.sequence;
        document.proposals.push({ id: request.requestId, peer: fingerprint, peerRevision: peer.revision,
          proof: request.proof, state: conflict ? 'conflict' : 'pending' });
        syncEvent(document, conflict ? 'proposal-conflicted' : 'proposal-received', fingerprint, request.proof.hash);
        const reply = response(conflict ? 'conflict' : 'accepted', { hash: request.proof.hash });
        rememberSyncReply(document, fingerprint, request, reply);
        return reply;
      });
      return canonicalSync(reply);
    },
  };
}

export type SyncService = ReturnType<typeof createSyncService>;
