import type { SQLiteDatabase } from 'expo-sqlite';
import { getAppDatabase } from '../appDatabase';
import { parseStoredProfile } from '../../domain/profile/profile';
import { isDeviceFingerprint } from '../../domain/devices/devicePermissions';
import { emptySyncDocument, parseSyncDocument } from '../../domain/sync/syncCodec';
import { SYNC_LIMITS, SyncFailure, type SyncContext, type SyncDocument, type SyncStore } from '../../domain/sync/syncTypes';

interface SyncRow {
  owner_fingerprint: string | null;
  revision: number;
  document_json: string;
}

function requireScope(db: SQLiteDatabase, context: SyncContext): void {
  if (!isDeviceFingerprint(context.owner)) throw new SyncFailure('IDENTITY');
  const row = db.getFirstSync<{ value_json: string }>('SELECT value_json FROM app_preferences WHERE key = ?', 'local_profile');
  if (!row) throw new SyncFailure('PROFILE_CHANGED');
  const profile = parseStoredProfile(JSON.parse(row.value_json));
  if (!profile.ok || profile.value.congregationId !== context.localScope) throw new SyncFailure('PROFILE_CHANGED');
}
function read(db: SQLiteDatabase, context: SyncContext) {
  requireScope(db, context);
  const row = db.getFirstSync<SyncRow>('SELECT owner_fingerprint, revision, document_json FROM local_sync_documents WHERE local_scope = ?', context.localScope);
  const document = row ? parseSyncDocument(JSON.parse(row.document_json)) : emptySyncDocument(context.localScope, context.owner);
  if (document.localScope !== context.localScope || (row && row.owner_fingerprint !== document.owner) ||
    (document.owner !== null && document.owner !== context.owner) ||
    (row && (!Number.isSafeInteger(row.revision) || row.revision < 1))) throw new SyncFailure('IDENTITY');
  // Restored plain drafts may be claimed by the current Keystore identity, never authority.
  document.owner = context.owner;
  return { row, document };
}

export function createSyncRepository(database: () => SQLiteDatabase): SyncStore {
  return {
    read(context) {
      const db = database();
      let document: SyncDocument | undefined;
      db.withTransactionSync(() => { document = read(db, context).document; });
      if (!document) throw new SyncFailure('NOT_FOUND');
      return document;
    },
    change<T>(context: SyncContext, change: (document: SyncDocument) => T): T {
      const db = database();
      const result: { value?: T } = {};
      db.withTransactionSync(() => {
        const { row, document } = read(db, context);
        result.value = change(document);
        if (result.value instanceof Promise) throw new SyncFailure('INVALID_DATA');
        if (document.history.length > SYNC_LIMITS.history ||
          [document.proposals, document.jobs, document.grants, document.acknowledgments, document.inbox, document.quarantine, document.events, document.restored]
            .some(entries => entries.length > SYNC_LIMITS.entries) || JSON.stringify(document).length > SYNC_LIMITS.stateCharacters) throw new SyncFailure('LIMIT');
        const serialized = JSON.stringify(parseSyncDocument(document));
        const revision = (row?.revision ?? 0) + 1;
        if (!Number.isSafeInteger(revision)) throw new SyncFailure('LIMIT');
        const saved = db.runSync(
          `INSERT INTO local_sync_documents (local_scope, owner_fingerprint, revision, document_json, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(local_scope) DO UPDATE SET owner_fingerprint = excluded.owner_fingerprint,
             revision = excluded.revision, document_json = excluded.document_json, updated_at = excluded.updated_at
           WHERE local_sync_documents.revision = ?`,
          context.localScope, context.owner, revision, serialized, Date.now(), row?.revision ?? 0,
        );
        if (saved.changes !== 1) throw new SyncFailure('CONFLICT');
      });
      return result.value as T;
    },
  };
}

export const syncRepository = createSyncRepository(getAppDatabase);
