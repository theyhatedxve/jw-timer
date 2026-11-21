import type { MeetingDraft } from '../meetings/meeting.types';
import type { MeetingDutyKey } from '../assignments/meetingDuty';
import type { SharedSchedule } from '../devices/sharedSchedule';

export const SYNC_LIMITS = {
  datasetCharacters: 196_608,
  messageCharacters: 262_144,
  stateCharacters: 32 * 1024 * 1024,
  meetings: 25,
  publishers: 1000,
  history: 512,
  entries: 4096,
  attempts: 5,
} as const;
export const EMPTY_SYNC_HASH = `sha256:${'0'.repeat(64)}`;
export const SYNC_ROLES = ['microphones', 'sound', 'laptop', 'microphone-adjuster'] as const;
export type SyncRole = typeof SYNC_ROLES[number];

export interface SyncPublisher {
  readonly id: string;
  readonly displayName: string;
  readonly isActive: boolean;
  readonly roles: readonly SyncRole[];
}
export interface SyncMeeting {
  readonly id: string;
  readonly revision: number;
  readonly draft: MeetingDraft;
  readonly duties: readonly { readonly key: MeetingDutyKey; readonly publisherId: string | null }[];
}
export interface SyncDataset {
  readonly version: 2;
  readonly congregationId: string;
  readonly publishers: readonly SyncPublisher[];
  readonly meetings: readonly SyncMeeting[];
}
export interface SyncBody {
  readonly version: 2;
  readonly kind: 'revision' | 'proposal';
  readonly congregationId: string;
  readonly authorFingerprint: string;
  readonly sequence: number;
  readonly parentHash: string;
  readonly requestId: string;
  readonly createdAt: number;
  readonly dataset: SyncDataset;
}
export interface SyncProof {
  readonly body: SyncBody;
  readonly hash: string;
  readonly signature: string;
}
export type SyncRequest =
  | { readonly version: 2; readonly requestId: string; readonly kind: 'pull'; readonly sequence: number; readonly hash: string }
  | { readonly version: 2; readonly requestId: string; readonly kind: 'proposal'; readonly proof: SyncProof }
  | { readonly version: 2; readonly requestId: string; readonly kind: 'ack'; readonly sequence: number; readonly hash: string }
  | { readonly version: 2; readonly requestId: string; readonly kind: 'proposal-status'; readonly proposalId: string };
export interface SyncReply {
  readonly version: 2;
  readonly requestId: string;
  readonly status: 'accepted' | 'up-to-date' | 'conflict' | 'pending' | 'approved' | 'rejected' | 'error';
  readonly hash?: string;
  readonly sequence?: number;
  readonly proof?: SyncProof;
  readonly revisionHash?: string;
  readonly code?: string;
}
export interface SyncBinding {
  leader: string;
  leaderKey: string;
  remoteScope: string;
  peerRevision: number;
  term: 1;
  frozen: boolean;
}
export interface SyncProposal {
  id: string;
  peer: string;
  peerRevision: number;
  proof: SyncProof;
  state: 'pending' | 'conflict' | 'approved' | 'rejected';
  revisionHash?: string;
}
export interface SyncJob {
  id: string;
  peer: string;
  kind: 'proposal' | 'ack';
  request: SyncRequest;
  state: 'pending' | 'delivered' | 'approved' | 'rejected' | 'conflict' | 'blocked' | 'done';
  attempts: number;
  notBefore: number;
  code: string;
}
export interface SyncEvent {
  id: number;
  at: number;
  action: string;
  peer?: string;
  hash?: string;
}
export interface SyncDocument {
  version: 2;
  owner: string | null;
  localScope: string;
  binding: SyncBinding | null;
  history: SyncProof[];
  proposals: SyncProposal[];
  jobs: SyncJob[];
  grants: { peer: string; peerRevision: number; enabled: boolean }[];
  acknowledgments: { peer: string; hash: string }[];
  inbox: { peer: string; requestId: string; request: string; reply: SyncReply }[];
  quarantine: { hash: string; reason: string; proof: SyncProof }[];
  events: SyncEvent[];
  restored: SyncDataset[];
}
export interface SyncContext { readonly owner: string; readonly localScope: string }
export interface SyncStore {
  read(context: SyncContext): SyncDocument;
  change<T>(context: SyncContext, change: (document: SyncDocument) => T): T;
}
export interface SyncStatus {
  readonly ownFingerprint: string;
  readonly localScope: string;
  readonly binding: SyncBinding | null;
  readonly head: { readonly sequence: number; readonly hash: string };
  readonly peers: readonly { readonly fingerprint: string; readonly label: string; readonly draftAllowed: boolean }[];
  readonly jobs: readonly SyncJob[];
  readonly proposals: readonly SyncProposal[];
  readonly events: readonly SyncEvent[];
  readonly restored: readonly { readonly index: number; readonly title: string }[];
}
export interface SyncPreview {
  readonly currentDataset: SyncDataset | null;
  readonly candidateDataset: SyncDataset;
  readonly current: SharedSchedule | null;
  readonly candidate: SharedSchedule;
  readonly proposalId: string | null;
}
export class SyncFailure extends Error {
  constructor(readonly code: 'INVALID_DATA' | 'DENIED' | 'IDENTITY' | 'PROFILE_CHANGED' | 'LEADER_REQUIRED' | 'ADOPTION_REQUIRED' | 'FROZEN' | 'CONFLICT' | 'INVALID_SIGNATURE' | 'CANCELLED' | 'LIMIT' | 'NETWORK' | 'NOT_FOUND') {
    super(code);
  }
}
