import type { SQLiteDatabase } from 'expo-sqlite';
import { parseStoredProfile } from '../../domain/profile/profile';
import { canonicalSync, emptySyncDocument, parseSyncDataset, parseSyncDocument } from '../../domain/sync/syncCodec';
import { SyncFailure, type SyncDataset } from '../../domain/sync/syncTypes';

function exists(db: SQLiteDatabase): boolean {
  return db.getFirstSync('SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?', 'table', 'local_sync_documents') !== null;
}
export function syncRestoreToken(db: SQLiteDatabase): unknown {
  return exists(db) ? db.getAllSync('SELECT local_scope, owner_fingerprint, revision, document_json FROM local_sync_documents ORDER BY local_scope') : [];
}
export function captureSyncDrafts(db: SQLiteDatabase): readonly SyncDataset[] {
  if (!exists(db)) return [];
  const result = new Map<string, SyncDataset>();
  const profileRow = db.getFirstSync<{ value_json: string }>('SELECT value_json FROM app_preferences WHERE key = ?', 'local_profile');
  const profile = profileRow ? parseStoredProfile(JSON.parse(profileRow.value_json)) : null;
  if (!profile?.ok) throw new SyncFailure('PROFILE_CHANGED');
  // Pre-scope profiles (including isolated legacy diagnostics) have no sync authority.
  if (!profile.value.congregationId) return [];
  for (const row of db.getAllSync<{ document_json: string }>('SELECT document_json FROM local_sync_documents WHERE local_scope = ?', profile.value.congregationId)) {
    const document = parseSyncDocument(JSON.parse(row.document_json));
    const datasets = [document.history.at(-1)?.body.dataset, ...document.restored,
      ...document.proposals.filter(proposal => proposal.state === 'pending' || proposal.state === 'conflict').map(proposal => proposal.proof.body.dataset),
      ...document.jobs.flatMap(job => job.request.kind === 'proposal' ? [job.request.proof.body.dataset] : []),
    ];
    for (const dataset of datasets) if (dataset) result.set(canonicalSync(dataset), dataset);
  }
  if (result.size > 256) throw new SyncFailure('LIMIT');
  return [...result.values()];
}
// Called inside the caller's staged/real restore transaction.
export function restoreSyncDrafts(db: SQLiteDatabase, inputs: readonly SyncDataset[]): void {
  if (inputs.length > 256) throw new SyncFailure('LIMIT');
  const datasets = inputs.map(parseSyncDataset);
  if (!exists(db)) {
    if (datasets.length) throw new SyncFailure('INVALID_DATA');
    return; // Old diagnostic fixtures and v1 archives remain readable.
  }
  for (const row of db.getAllSync<{ local_scope: string; revision: number; document_json: string }>('SELECT local_scope, revision, document_json FROM local_sync_documents')) {
    const document = parseSyncDocument(JSON.parse(row.document_json));
    if (document.binding) document.binding.frozen = true;
    document.grants.forEach(grant => { grant.enabled = false; });
    document.jobs.forEach(job => { if (job.state === 'pending') { job.state = 'blocked'; job.code = 'RESTORE_REAPPROVAL'; } });
    db.runSync('UPDATE local_sync_documents SET revision = ?, document_json = ?, updated_at = ? WHERE local_scope = ?',
      row.revision + 1, JSON.stringify(parseSyncDocument(document)), Date.now(), row.local_scope);
  }
  const profileRow = db.getFirstSync<{ value_json: string }>('SELECT value_json FROM app_preferences WHERE key = ?', 'local_profile');
  const parsed = profileRow ? parseStoredProfile(JSON.parse(profileRow.value_json)) : null;
  if (!parsed?.ok) throw new SyncFailure('PROFILE_CHANGED');
  const localScope = db.getFirstSync<{ id: string }>('SELECT lower(hex(randomblob(16))) AS id')?.id;
  if (!localScope) throw new SyncFailure('INVALID_DATA');
  const profile = parseStoredProfile({ ...parsed.value, congregationId: localScope, revision: parsed.value.revision + 1 });
  if (!profile.ok) throw new SyncFailure('INVALID_DATA');
  db.runSync('UPDATE app_preferences SET value_json = ?, updated_at = ? WHERE key = ?', JSON.stringify(profile.value), Date.now(), 'local_profile');
  const document = emptySyncDocument(localScope, null);
  document.restored = datasets;
  db.runSync('INSERT INTO local_sync_documents (local_scope, owner_fingerprint, revision, document_json, updated_at) VALUES (?, NULL, 1, ?, ?)',
    localScope, JSON.stringify(parseSyncDocument(document)), Date.now());
}
