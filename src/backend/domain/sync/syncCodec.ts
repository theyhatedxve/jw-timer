import { isDeviceFingerprint } from '../devices/devicePermissions';
import { isCongregationId } from '../profile/profile';
import { validateMeetingDraft } from '../meetings/meetingValidation';
import { MEETING_DUTY_SLOTS, isMeetingDutyKey } from '../assignments/meetingDuty';
import { checkMeetingOverlap } from '../assignments/meetingOverlap';
import type { SharedSchedule } from '../devices/sharedSchedule';
import {
  EMPTY_SYNC_HASH, SYNC_LIMITS, SYNC_ROLES, SyncFailure,
  type SyncBody, type SyncDataset, type SyncDocument, type SyncProof,
  type SyncReply, type SyncRequest, type SyncRole,
} from './syncTypes';

export function syncRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new SyncFailure('INVALID_DATA');
  return input as Record<string, unknown>;
}
function requireData(condition: unknown): asserts condition {
  if (!condition) throw new SyncFailure('INVALID_DATA');
}
export function isSyncId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}
function integer(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
}
function exact(value: Record<string, unknown>, fields: readonly string[]) {
  requireData(Object.keys(value).sort().join(',') === [...fields].sort().join(','));
}
export function canonicalSync(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalSync).join(',')}]`;
  const object = syncRecord(value);
  return `{${Object.keys(object).filter(key => object[key] !== undefined).sort()
    .map(key => `${JSON.stringify(key)}:${canonicalSync(object[key])}`).join(',')}}`;
}

export function parseSyncDataset(input: unknown): SyncDataset {
  requireData(canonicalSync(input).length <= SYNC_LIMITS.datasetCharacters);
  const value = syncRecord(input);
  exact(value, ['version', 'congregationId', 'publishers', 'meetings']);
  requireData(value.version === 2 && isCongregationId(value.congregationId));
  requireData(Array.isArray(value.publishers) && value.publishers.length <= SYNC_LIMITS.publishers);
  requireData(Array.isArray(value.meetings) && value.meetings.length <= SYNC_LIMITS.meetings);
  const ids = new Set<string>();
  function claim(id: unknown): string {
    requireData(typeof id === 'string' && /^[a-f0-9]{32}$/.test(id) && !ids.has(id));
    ids.add(id);
    return id;
  }
  const publishers = value.publishers.map(inputPublisher => {
    const publisher = syncRecord(inputPublisher);
    exact(publisher, ['id', 'displayName', 'isActive', 'roles']);
    const id = claim(publisher.id);
    requireData(typeof publisher.displayName === 'string' && publisher.displayName === publisher.displayName.trim() &&
      publisher.displayName.length >= 1 && publisher.displayName.length <= 100 &&
      !/[\u0000-\u001f\u007f]/.test(publisher.displayName));
    requireData(typeof publisher.isActive === 'boolean' && Array.isArray(publisher.roles));
    const roles: SyncRole[] = [];
    for (const role of publisher.roles) {
      requireData(SYNC_ROLES.some(known => known === role) && !roles.includes(role as SyncRole));
      roles.push(role as SyncRole);
    }
    return { id, displayName: publisher.displayName, isActive: publisher.isActive, roles };
  });
  const people = new Map(publishers.map(publisher => [publisher.id, publisher]));
  const meetings = value.meetings.map(inputMeeting => {
    const meeting = syncRecord(inputMeeting);
    exact(meeting, ['id', 'revision', 'draft', 'duties']);
    const id = claim(meeting.id);
    requireData(integer(meeting.revision, 1));
    const parsed = validateMeetingDraft(meeting.draft);
    requireData(parsed.ok);
    const draft = parsed.value;
    requireData(draft.importSource === undefined && canonicalSync(draft) === canonicalSync(meeting.draft));
    for (const section of draft.sections) {
      claim(section.id);
      for (const part of section.parts) claim(part.id);
    }
    requireData(Array.isArray(meeting.duties) && meeting.duties.length === MEETING_DUTY_SLOTS.length);
    const keys = new Set<string>();
    const assigned = new Set<string>();
    const duties = meeting.duties.map(inputDuty => {
      const duty = syncRecord(inputDuty);
      exact(duty, ['key', 'publisherId']);
      requireData(isMeetingDutyKey(duty.key) && !keys.has(duty.key));
      keys.add(duty.key);
      if (duty.publisherId !== null) {
        requireData(typeof duty.publisherId === 'string' && !assigned.has(duty.publisherId));
        const person = people.get(duty.publisherId);
        const slot = MEETING_DUTY_SLOTS.find(item => item.key === duty.key);
        requireData(person?.isActive === true && slot !== undefined &&
          person.roles.some(role => role === slot.role));
        assigned.add(duty.publisherId);
      }
      return { key: duty.key, publisherId: duty.publisherId as string | null };
    });
    return { id, revision: meeting.revision, draft, duties };
  });
  // Eligibility and collision policy remain ID-based, even for identical names.
  for (const publisher of publishers) {
    const assigned = meetings.filter(meeting => meeting.duties.some(duty => duty.publisherId === publisher.id))
      .map(meeting => ({ id: meeting.id, ...meeting.draft }));
    for (const meeting of assigned) {
      requireData(checkMeetingOverlap(meeting, assigned.filter(other => other.id !== meeting.id)).kind === 'clear');
    }
  }
  return { version: 2, congregationId: value.congregationId, publishers, meetings };
}

export function parseSyncProof(input: unknown): SyncProof {
  requireData(canonicalSync(input).length <= SYNC_LIMITS.messageCharacters);
  const value = syncRecord(input);
  exact(value, ['body', 'hash', 'signature']);
  const body = syncRecord(value.body);
  exact(body, ['version', 'kind', 'congregationId', 'authorFingerprint', 'sequence', 'parentHash', 'requestId', 'createdAt', 'dataset']);
  requireData(body.version === 2 && (body.kind === 'revision' || body.kind === 'proposal') &&
    isCongregationId(body.congregationId) && isDeviceFingerprint(body.authorFingerprint) &&
    integer(body.sequence, body.kind === 'revision' ? 1 : 0) && isDeviceFingerprint(body.parentHash) &&
    isSyncId(body.requestId) && integer(body.createdAt));
  requireData(isDeviceFingerprint(value.hash) && typeof value.signature === 'string' &&
    value.signature.length >= 80 && value.signature.length <= 104 && /^[A-Za-z0-9+/]+={0,2}$/.test(value.signature));
  const dataset = parseSyncDataset(body.dataset);
  requireData(dataset.congregationId === body.congregationId);
  const parsed: SyncBody = {
    version: 2, kind: body.kind, congregationId: body.congregationId,
    authorFingerprint: body.authorFingerprint, sequence: body.sequence, parentHash: body.parentHash,
    requestId: body.requestId, createdAt: body.createdAt, dataset,
  };
  requireData(canonicalSync(parsed) === canonicalSync(body));
  return { body: parsed, hash: value.hash, signature: value.signature };
}

export function parseSyncRequest(input: unknown): SyncRequest {
  requireData(canonicalSync(input).length <= SYNC_LIMITS.messageCharacters);
  const value = syncRecord(input);
  requireData(value.version === 2 && isSyncId(value.requestId));
  if (value.kind === 'pull' || value.kind === 'ack') {
    exact(value, ['version', 'requestId', 'kind', 'sequence', 'hash']);
    requireData(integer(value.sequence, value.kind === 'ack' ? 1 : 0) && isDeviceFingerprint(value.hash));
    if (value.kind === 'ack') requireData(value.requestId === value.hash.slice(7));
    return { version: 2, requestId: value.requestId, kind: value.kind, sequence: value.sequence, hash: value.hash };
  }
  if (value.kind === 'proposal') {
    exact(value, ['version', 'requestId', 'kind', 'proof']);
    const proof = parseSyncProof(value.proof);
    requireData(proof.body.kind === 'proposal' && proof.body.requestId === value.requestId);
    return { version: 2, requestId: value.requestId, kind: 'proposal', proof };
  }
  exact(value, ['version', 'requestId', 'kind', 'proposalId']);
  requireData(value.kind === 'proposal-status' && isSyncId(value.proposalId));
  return { version: 2, requestId: value.requestId, kind: 'proposal-status', proposalId: value.proposalId };
}

export function parseSyncReply(input: unknown, requestId?: string): SyncReply {
  requireData(canonicalSync(input).length <= SYNC_LIMITS.messageCharacters + 1024);
  const value = syncRecord(input);
  const fields = ['version', 'requestId', 'status', 'hash', 'sequence', 'proof', 'revisionHash', 'code'];
  requireData(Object.keys(value).every(key => fields.includes(key)) && value.version === 2 && isSyncId(value.requestId) &&
    (requestId === undefined || value.requestId === requestId) && typeof value.status === 'string' &&
    ['accepted', 'up-to-date', 'conflict', 'pending', 'approved', 'rejected', 'error'].includes(value.status));
  if (value.hash !== undefined) requireData(isDeviceFingerprint(value.hash));
  if (value.sequence !== undefined) requireData(integer(value.sequence));
  if (value.revisionHash !== undefined) requireData(isDeviceFingerprint(value.revisionHash));
  if (value.code !== undefined) requireData(typeof value.code === 'string' && /^[A-Z_]{1,40}$/.test(value.code));
  if (value.proof !== undefined) parseSyncProof(value.proof);
  return value as unknown as SyncReply;
}

export function emptySyncDocument(localScope: string, owner: string | null): SyncDocument {
  return { version: 2, owner, localScope, binding: null, history: [], proposals: [], jobs: [], grants: [],
    acknowledgments: [], inbox: [], quarantine: [], events: [], restored: [] };
}
export function syncHead(document: SyncDocument) {
  const proof = document.history.at(-1);
  return proof ? { sequence: proof.body.sequence, hash: proof.hash } : { sequence: 0, hash: EMPTY_SYNC_HASH };
}
export function toSharedSchedule(dataset: SyncDataset, createdAt = 0): SharedSchedule {
  const people = new Map(dataset.publishers.map(person => [person.id, person.displayName]));
  return {
    version: 1, congregationId: dataset.congregationId, createdAt,
    meetings: dataset.meetings.map(meeting => ({ ...meeting, duties: meeting.duties.map(duty => ({
      key: duty.key, publisherName: duty.publisherId === null ? null : people.get(duty.publisherId) ?? null,
    })) })),
  };
}

export function parseSyncDocument(input: unknown): SyncDocument {
  const value = syncRecord(input);
  exact(value, ['version', 'owner', 'localScope', 'binding', 'history', 'proposals', 'jobs', 'grants',
    'acknowledgments', 'inbox', 'quarantine', 'events', 'restored']);
  requireData(canonicalSync(value).length <= SYNC_LIMITS.stateCharacters && value.version === 2 &&
    (value.owner === null || isDeviceFingerprint(value.owner)) && isCongregationId(value.localScope));
  for (const field of ['history', 'proposals', 'jobs', 'grants', 'acknowledgments', 'inbox', 'quarantine', 'events', 'restored']) {
    requireData(Array.isArray(value[field]) && value[field].length <= SYNC_LIMITS.entries);
  }
  const document = value as unknown as SyncDocument;
  requireData(document.history.length <= SYNC_LIMITS.history);
  if (document.binding !== null) {
    const binding = syncRecord(document.binding);
    exact(binding, ['leader', 'leaderKey', 'remoteScope', 'peerRevision', 'term', 'frozen']);
    requireData(isDeviceFingerprint(binding.leader) && typeof binding.leaderKey === 'string' &&
      /^[A-Za-z0-9+/]{122}==$/.test(binding.leaderKey) && isCongregationId(binding.remoteScope) &&
      integer(binding.peerRevision) && binding.term === 1 && typeof binding.frozen === 'boolean' && document.owner !== null);
  } else {
    requireData(document.history.length === 0 && document.proposals.length === 0 && document.grants.length === 0 && document.jobs.length === 0);
  }
  let parent = EMPTY_SYNC_HASH;
  for (let index = 0; index < document.history.length; index++) {
    const proof = parseSyncProof(document.history[index]);
    requireData(proof.body.kind === 'revision' && proof.body.sequence === index + 1 && proof.body.parentHash === parent &&
      proof.body.authorFingerprint === document.binding?.leader && proof.body.congregationId === document.binding.remoteScope);
    parent = proof.hash;
  }
  const proposalIds = new Set<string>();
  for (const proposal of document.proposals) {
    requireData(isSyncId(proposal.id) && !proposalIds.has(proposal.id) && isDeviceFingerprint(proposal.peer) && integer(proposal.peerRevision, 1) &&
      ['pending', 'conflict', 'approved', 'rejected'].includes(proposal.state));
    proposalIds.add(proposal.id);
    const proof = parseSyncProof(proposal.proof);
    requireData(proof.body.kind === 'proposal' && proof.body.authorFingerprint === proposal.peer && proof.body.requestId === proposal.id &&
      proof.body.congregationId === document.binding?.remoteScope);
    if (proposal.revisionHash !== undefined) requireData(document.history.some(item => item.hash === proposal.revisionHash));
  }
  const jobIds = new Set<string>();
  for (const job of document.jobs) {
    requireData(isSyncId(job.id) && !jobIds.has(job.id) && isDeviceFingerprint(job.peer) && integer(job.attempts) && integer(job.notBefore) &&
      ['pending', 'delivered', 'approved', 'rejected', 'conflict', 'blocked', 'done'].includes(job.state) &&
      typeof job.code === 'string' && job.code.length <= 40);
    jobIds.add(job.id);
    const request = parseSyncRequest(job.request);
    requireData(request.requestId === job.id && request.kind === job.kind);
    if (request.kind === 'proposal') requireData(request.proof.body.authorFingerprint === document.owner &&
      request.proof.body.congregationId === document.binding?.remoteScope);
    if (request.kind === 'ack') requireData(document.history.some(item => item.hash === request.hash && item.body.sequence === request.sequence));
  }
  for (const grant of document.grants) requireData(isDeviceFingerprint(grant.peer) && integer(grant.peerRevision, 1) && typeof grant.enabled === 'boolean');
  for (const ack of document.acknowledgments) requireData(isDeviceFingerprint(ack.peer) && document.history.some(proof => proof.hash === ack.hash));
  for (const inbox of document.inbox) {
    requireData(isDeviceFingerprint(inbox.peer) && isSyncId(inbox.requestId) && typeof inbox.request === 'string');
    requireData(parseSyncRequest(JSON.parse(inbox.request)).requestId === inbox.requestId);
    parseSyncReply(inbox.reply, inbox.requestId);
  }
  for (const item of document.quarantine) {
    requireData(isDeviceFingerprint(item.hash) && typeof item.reason === 'string' && item.reason.length <= 40);
    requireData(parseSyncProof(item.proof).hash === item.hash);
  }
  document.events.forEach((event, index) => {
    requireData(event.id === index + 1 && integer(event.at) && typeof event.action === 'string' && /^[a-z-]{1,40}$/.test(event.action));
    if (event.peer !== undefined) requireData(isDeviceFingerprint(event.peer));
    if (event.hash !== undefined) requireData(isDeviceFingerprint(event.hash));
  });
  document.restored.forEach(parseSyncDataset);
  if (document.owner === null) requireData(document.binding === null && document.inbox.length === 0 && document.events.length === 0);
  return document;
}
