import { canonicalSync, parseSyncDataset, syncHead } from './syncCodec';
import { SyncFailure, type SyncContext, type SyncDocument, type SyncJob, type SyncProof, type SyncReply, type SyncRequest } from './syncTypes';

export function syncEvent(document: SyncDocument, action: string, peer?: string, hash?: string): void {
  document.events.push({ id: document.events.length + 1, at: Date.now(), action,
    ...(peer === undefined ? {} : { peer }), ...(hash === undefined ? {} : { hash }) });
}
export function requireSyncBinding(document: SyncDocument, active = true) {
  if (!document.binding) throw new SyncFailure('ADOPTION_REQUIRED');
  if (active && document.binding.frozen) throw new SyncFailure('FROZEN');
  return document.binding;
}
export function requireSyncLeader(context: SyncContext, document: SyncDocument): void {
  if (requireSyncBinding(document).leader !== context.owner) throw new SyncFailure('LEADER_REQUIRED');
}
export function maySubmitDraft(document: SyncDocument, peer: string, revision: number): boolean {
  return document.binding !== null && !document.binding.frozen &&
    document.grants.some(grant => grant.peer === peer && grant.peerRevision === revision && grant.enabled === true);
}
export function queueSyncJob(document: SyncDocument, peer: string, request: SyncRequest): void {
  if (request.kind !== 'ack' && request.kind !== 'proposal') throw new SyncFailure('INVALID_DATA');
  const previous = document.jobs.find(job => job.id === request.requestId);
  if (previous) {
    if (previous.peer !== peer || canonicalSync(previous.request) !== canonicalSync(request)) throw new SyncFailure('CONFLICT');
    return;
  }
  const job: SyncJob = { id: request.requestId, peer, kind: request.kind, request,
    state: 'pending', attempts: 0, notBefore: 0, code: '' };
  document.jobs.push(job);
  syncEvent(document, request.kind === 'ack' ? 'ack-queued' : 'proposal-queued', peer);
}
export function priorSyncReply(document: SyncDocument, peer: string, request: SyncRequest): SyncReply | null {
  const prior = document.inbox.find(item => item.peer === peer && item.requestId === request.requestId);
  if (!prior) return null;
  if (prior.request !== canonicalSync(request)) throw new SyncFailure('CONFLICT');
  return prior.reply;
}
export function rememberSyncReply(document: SyncDocument, peer: string, request: SyncRequest, reply: SyncReply): void {
  document.inbox.push({ peer, requestId: request.requestId, request: canonicalSync(request), reply });
}
export function quarantineSyncProof(document: SyncDocument, proof: SyncProof, reason: string): void {
  if (!document.quarantine.some(item => item.hash === proof.hash)) {
    document.quarantine.push({ hash: proof.hash, reason, proof });
    syncEvent(document, 'revision-quarantined', proof.body.authorFingerprint, proof.hash);
  }
}
// Crypto verification happens in the application service before entering this transaction.
export function appendVerifiedRevision(document: SyncDocument, proof: SyncProof, acknowledgment?: { peer: string; request: SyncRequest }): boolean {
  const binding = requireSyncBinding(document);
  const head = syncHead(document);
  const prior = document.history.find(item => item.hash === proof.hash);
  if (prior) {
    if (canonicalSync(prior) !== canonicalSync(proof)) throw new SyncFailure('CONFLICT');
    if (acknowledgment) queueSyncJob(document, acknowledgment.peer, acknowledgment.request);
    return true;
  }
  if (proof.body.kind !== 'revision' || proof.body.authorFingerprint !== binding.leader ||
    proof.body.congregationId !== binding.remoteScope || proof.body.sequence !== head.sequence + 1 || proof.body.parentHash !== head.hash) {
    quarantineSyncProof(document, proof, 'CONFLICT');
    return false;
  }
  parseSyncDataset(proof.body.dataset);
  document.history.push(proof);
  if (acknowledgment) queueSyncJob(document, acknowledgment.peer, acknowledgment.request);
  syncEvent(document, 'revision-accepted', proof.body.authorFingerprint, proof.hash);
  return true;
}
