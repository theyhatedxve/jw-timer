import { openDatabaseSync } from 'expo-sqlite';
import { APP_SCHEMA_MIGRATIONS, migrationChecksum } from '../appDatabase';
import { createSyncRepository } from '../repositories/syncRepository';
import { createBackupRepository } from '../repositories/backupRepository';
import { canonicalSync, parseSyncDocument, syncHead } from '../../domain/sync/syncCodec';
import { appendVerifiedRevision, syncEvent } from '../../domain/sync/syncState';
import { EMPTY_SYNC_HASH, type SyncProof } from '../../domain/sync/syncTypes';
import type { DiagnosticResult } from '../../services/diagnostics.types';

// Explicit user-run storage checks. Synthetic records; never opens jw-timer.db.
export async function runSyncStorageChecks(): Promise<readonly DiagnosticResult[]> {
  const db = openDatabaseSync(':memory:', { useNewConnection: true });
  const results: DiagnosticResult[] = [];
  const scope = 'a'.repeat(32);
  const owner = `sha256:${'b'.repeat(64)}`;
  const peer = `sha256:${'c'.repeat(64)}`;
  const context = { owner, localScope: scope };
  const store = createSyncRepository(() => db);
  const requireCondition = (value: boolean) => { if (!value) throw new Error('Expected isolated storage invariant was not observed.'); };
  function check(name: string, action: () => void): boolean {
    try { action(); results.push({ name, passed: true, detail: 'Expected storage result observed.' }); return true; }
    catch (error) { results.push({ name, passed: false, detail: error instanceof Error ? error.message : 'Storage check failed.' }); return false; }
  }
  const proof = (sequence: number, parentHash: string, digit: string): SyncProof => ({
    body: { version: 2, kind: 'revision', authorFingerprint: owner, congregationId: scope,
      sequence, parentHash, requestId: digit.repeat(64), createdAt: 1,
      dataset: { version: 2, congregationId: scope, publishers: [], meetings: [] } },
    hash: `sha256:${digit.repeat(64)}`, signature: 'A'.repeat(96),
  });
  const first = proof(1, EMPTY_SYNC_HASH, 'd');
  const accept = (next: SyncProof) => store.change(context, document => appendVerifiedRevision(document, next, {
    peer, request: { version: 2, kind: 'ack', requestId: next.hash.slice(7), sequence: next.body.sequence, hash: next.hash },
  }));
  try {
    const initialized = check('Migrations 1–9 preserve an isolated draft store', () => {
      db.execSync('PRAGMA foreign_keys = ON; CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL)');
      db.withTransactionSync(() => {
        for (const migration of APP_SCHEMA_MIGRATIONS) {
          db.execSync(migration.sql);
          db.runSync('INSERT INTO schema_migrations VALUES (?, ?, ?)', migration.version, migrationChecksum(migration.sql), 1);
        }
        db.runSync('INSERT INTO app_preferences (key, value_json, updated_at) VALUES (?, ?, ?)', 'local_profile', JSON.stringify({
          recordVersion: 1, revision: 1, interfaceLanguage: 'en', name: 'Isolated Sync Fixture',
          timezone: 'Asia/Manila', programLanguage: 'en', congregationId: scope,
        }), 1);
      });
      store.change(context, document => {
        document.binding = { leader: owner, leaderKey: `${'A'.repeat(122)}==`, remoteScope: scope, peerRevision: 0, term: 1, frozen: false };
        document.grants.push({ peer, peerRevision: 1, enabled: true });
      });
      requireCondition(db.getFirstSync<{ count: number }>('SELECT count(*) AS count FROM schema_migrations')?.count === APP_SCHEMA_MIGRATIONS.length);
    });
    if (!initialized) return results;
    check('Thrown change rolls back head, receipt work, and journal together', () => {
      const before = canonicalSync(store.read(context));
      let rejected = false;
      try { store.change(context, document => { appendVerifiedRevision(document, first); syncEvent(document, 'revision-published'); throw new Error('Synthetic failure'); }); }
      catch { rejected = true; }
      requireCondition(rejected && canonicalSync(store.read(context)) === before);
    });
    const accepted = check('Accept and receipt enqueue commit once; retry is idempotent', () => {
      requireCondition(accept(first));
      requireCondition(accept(first));
      const document = store.read(context);
      requireCondition(syncHead(document).hash === first.hash && document.history.length === 1 && document.jobs.length === 1);
    });
    if (!accepted) return results;
    check('SQLite write failure preserves head, queue, journal and row revision', () => {
      const before = db.getFirstSync<{ revision: number; document_json: string }>('SELECT revision, document_json FROM local_sync_documents WHERE local_scope = ?', scope);
      db.execSync("CREATE TEMP TRIGGER sync_write_abort BEFORE UPDATE OF document_json ON local_sync_documents BEGIN SELECT RAISE(ABORT, 'Synthetic sync write failure'); END;");
      let rejected = false;
      try { accept(proof(2, first.hash, 'e')); } catch { rejected = true; }
      finally { db.execSync('DROP TRIGGER sync_write_abort'); }
      const after = db.getFirstSync<{ revision: number; document_json: string }>('SELECT revision, document_json FROM local_sync_documents WHERE local_scope = ?', scope);
      requireCondition(rejected && canonicalSync(before) === canonicalSync(after));
    });
    check('Content backup restore creates drafts, freezes authority and removes grant inheritance', () => {
      const backup = createBackupRepository(() => db);
      const archive = backup.capture();
      requireCondition(archive.version === 2 && archive.syncDrafts?.length === 1);
      backup.prepare(archive);
      backup.restore(archive, backup.token());
      const oldRow = db.getFirstSync<{ document_json: string }>('SELECT document_json FROM local_sync_documents WHERE local_scope = ?', scope);
      requireCondition(!!oldRow);
      const old = parseSyncDocument(JSON.parse(oldRow!.document_json));
      requireCondition(old.binding?.frozen === true && old.grants.every(grant => !grant.enabled) && old.jobs.every(job => job.state !== 'pending'));
      const profileRow = db.getFirstSync<{ value_json: string }>('SELECT value_json FROM app_preferences WHERE key = ?', 'local_profile');
      const profile = JSON.parse(profileRow!.value_json) as { congregationId: string };
      requireCondition(profile.congregationId !== scope);
      const restoredRow = db.getFirstSync<{ document_json: string }>('SELECT document_json FROM local_sync_documents WHERE local_scope = ?', profile.congregationId);
      const restored = parseSyncDocument(JSON.parse(restoredRow!.document_json));
      requireCondition(restored.owner === null && restored.binding === null && restored.history.length === 0 && restored.grants.length === 0 && restored.restored.length === 1);
    });
    check('SQLite integrity and foreign keys remain valid', () => {
      requireCondition(db.getFirstSync<{ integrity_check: string }>('PRAGMA integrity_check')?.integrity_check === 'ok' && db.getAllSync('PRAGMA foreign_key_check').length === 0);
    });
  } finally { db.closeSync(); }
  return results;
}
