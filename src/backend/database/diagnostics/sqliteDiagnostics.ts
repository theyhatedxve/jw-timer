import { deleteDatabaseSync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { DiagnosticResult } from '../../services/diagnostics.types';

let runNumber = 0;

function requireCondition(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function expectFailure(operation: () => void, matches: (error: unknown) => boolean): void {
  try {
    operation();
  } catch (error) {
    if (matches(error)) return;
    throw error;
  }
  throw new Error('The operation unexpectedly succeeded.');
}

// Native integration checks. Called only by the owner's explicit screen action.
// Never opens jw-timer-feasibility.db or imports the timer checkpoint adapter.
export function runSqliteDiagnostics(): readonly DiagnosticResult[] {
  const name = `jw-sqlite-check-${Date.now()}-${++runNumber}.db`;
  const results: DiagnosticResult[] = [];
  const connections = new Set<SQLiteDatabase>();

  function open(): SQLiteDatabase {
    const db = openDatabaseSync(name, { useNewConnection: true });
    connections.add(db);
    db.execSync('PRAGMA busy_timeout = 0; PRAGMA foreign_keys = ON;');
    return db;
  }

  function close(db: SQLiteDatabase) {
    db.closeSync();
    connections.delete(db);
  }

  function check(label: string, operation: () => void): boolean {
    try {
      operation();
      results.push({ name: label, passed: true, detail: 'Observed expected SQLite behavior.' });
      return true;
    } catch (error) {
      results.push({ name: label, passed: false, detail: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  try {
    let db = open();
    if (!check('WAL and foreign keys', () => {
      db.execSync('PRAGMA journal_mode = WAL;');
      requireCondition(db.getFirstSync<{ journal_mode: string }>('PRAGMA journal_mode')?.journal_mode === 'wal', 'WAL is not active.');
      requireCondition(db.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys')?.foreign_keys === 1, 'Foreign keys are disabled.');
      db.withTransactionSync(() => {
        db.execSync(`
          CREATE TABLE parent (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
          CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parent(id));
          CREATE TABLE journal (id INTEGER PRIMARY KEY, message TEXT NOT NULL);
          INSERT INTO parent VALUES (1, 'original');
          PRAGMA user_version = 1;
        `);
      });
    })) return results;

    if (!check('Foreign-key rejection', () => {
      expectFailure(() => db.runSync('INSERT INTO child VALUES (1, 999)'),
        error => /foreign key constraint failed/i.test(String(error)));
      requireCondition(db.getAllSync('SELECT * FROM child').length === 0, 'Invalid child was saved.');
    })) return results;

    if (!check('Atomic data and journal rollback', () => {
      const abort = new Error('Deliberate diagnostic transaction failure');
      expectFailure(() => db.withTransactionSync(() => {
        db.runSync("UPDATE parent SET value = 'uncommitted' WHERE id = 1");
        db.runSync('INSERT INTO child VALUES (1, 1)');
        db.runSync("INSERT INTO journal VALUES (1, 'uncommitted')");
        throw abort;
      }), error => error === abort);
      requireCondition(db.getFirstSync<{ value: string }>('SELECT value FROM parent WHERE id = 1')?.value === 'original', 'Parent change survived rollback.');
      requireCondition(db.getAllSync('SELECT * FROM child').length === 0, 'Child change survived rollback.');
      requireCondition(db.getAllSync('SELECT * FROM journal').length === 0, 'Journal change survived rollback.');
    })) return results;

    if (!check('Single writer and WAL reader isolation', () => {
      const peer = open();
      try {
        db.withTransactionSync(() => {
          db.runSync("UPDATE parent SET value = 'writer-a' WHERE id = 1");
          requireCondition(peer.getFirstSync<{ value: string }>('SELECT value FROM parent WHERE id = 1')?.value === 'original', 'Peer read uncommitted data.');
          expectFailure(() => peer.runSync("UPDATE parent SET value = 'blocked' WHERE id = 1"),
            error => /locked|SQLITE_BUSY/i.test(String(error)));
        });
        peer.runSync("UPDATE parent SET value = 'writer-b' WHERE id = 1");
        requireCondition(db.getFirstSync<{ value: string }>('SELECT value FROM parent WHERE id = 1')?.value === 'writer-b', 'Writer could not proceed after commit.');
      } finally {
        close(peer);
      }
    })) return results;

    if (!check('Failed migration preserves schema and data', () => {
      const abort = new Error('Deliberate diagnostic migration failure');
      expectFailure(() => db.withTransactionSync(() => {
        db.execSync("CREATE TABLE migration_probe (id INTEGER PRIMARY KEY); UPDATE parent SET value = 'bad-migration'; PRAGMA user_version = 2;");
        throw abort;
      }), error => error === abort);
      requireCondition(db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version === 1, 'Failed migration advanced the schema version.');
      requireCondition(db.getFirstSync("SELECT name FROM sqlite_master WHERE name = 'migration_probe'") === null, 'Failed migration left a table.');
      requireCondition(db.getFirstSync<{ value: string }>('SELECT value FROM parent WHERE id = 1')?.value === 'writer-b', 'Failed migration changed existing data.');
    })) return results;

    if (!check('Successful migration and reopen persistence', () => {
      db.withTransactionSync(() => {
        db.execSync('CREATE TABLE migration_probe (id INTEGER PRIMARY KEY); INSERT INTO migration_probe VALUES (1); PRAGMA user_version = 2;');
      });
      close(db);
      db = open();
      requireCondition(db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version === 2, 'Schema version was not persisted.');
      requireCondition(db.getFirstSync<{ value: string }>('SELECT value FROM parent WHERE id = 1')?.value === 'writer-b', 'Saved data did not survive reopen.');
      requireCondition(db.getAllSync('SELECT * FROM migration_probe').length === 1, 'Migrated table was not persisted.');
      requireCondition(db.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys')?.foreign_keys === 1, 'Reopened connection lacks foreign keys.');
    })) return results;

    check('Database integrity', () => {
      requireCondition(db.getAllSync('PRAGMA foreign_key_check').length === 0, 'Foreign-key violations found.');
      const integrity = db.getAllSync<{ integrity_check: string }>('PRAGMA integrity_check');
      requireCondition(integrity.length === 1 && integrity[0]?.integrity_check === 'ok', 'Database integrity check failed.');
    });
  } catch (error) {
    results.push({ name: 'Diagnostic setup', passed: false, detail: error instanceof Error ? error.message : String(error) });
  } finally {
    let allClosed = true;
    for (const db of connections) {
      if (!check('Close scratch connection', () => close(db))) allClosed = false;
    }
    if (allClosed) check('Remove disposable database', () => deleteDatabaseSync(name));
  }
  return results;
}
