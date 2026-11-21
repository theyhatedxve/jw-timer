import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { isCheckpoint, type TimerCheckpoint } from '../../domain/timer/timer';

let connection: SQLiteDatabase | null = null;

// Keep the handle private: all operations use this connection and short sync
// transactions, so unrelated asynchronous queries cannot enter a transaction.
function database(): SQLiteDatabase {
  if (connection) return connection;
  const db = openDatabaseSync('jw-timer-feasibility.db');
  try {
    db.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version;
    if (version !== 0 && version !== 1) throw new Error('Unsupported prototype database version.');
    if (version === 0) {
      db.withTransactionSync(() => {
        db.execSync(`CREATE TABLE timer_checkpoint (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          payload TEXT NOT NULL
        ); PRAGMA user_version = 1;`);
      });
    }
    connection = db;
    return db;
  } catch (error) {
    db.closeSync();
    throw error;
  }
}

export function loadCheckpoint(): TimerCheckpoint | null {
  const row = database().getFirstSync<{ payload: string }>('SELECT payload FROM timer_checkpoint WHERE id = 1');
  if (!row) return null;
  const value: unknown = JSON.parse(row.payload);
  if (!isCheckpoint(value)) throw new Error('The saved prototype checkpoint is invalid. No data was reset.');
  return value;
}

export function saveCheckpoint(value: TimerCheckpoint): void {
  if (!isCheckpoint(value)) throw new Error('Invalid timer checkpoint.');
  const db = database();
  db.withTransactionSync(() => {
    db.runSync('INSERT INTO timer_checkpoint (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload', JSON.stringify(value));
  });
}

export function storageInfo(): string {
  const db = database();
  const wal = db.getFirstSync<{ journal_mode: string }>('PRAGMA journal_mode')?.journal_mode;
  const foreignKeys = db.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys')?.foreign_keys;
  return `SQLite schema 1 · ${wal ?? 'unknown journal'} · foreign keys ${foreignKeys === 1 ? 'on' : 'off'}`;
}
