import {
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import {
  isSessionCheckpoint,
  parseSessionCheckpoint,
} from '../../domain/timer/timerProgram';

import type {
  TimerCheckpointRepository,
} from '../../services/timerSessionService';

const MAX_PAYLOAD_LENGTH = 2_000_000;

let connection: SQLiteDatabase | null = null;

function database(): SQLiteDatabase {
  if (connection) return connection;

  const db = openDatabaseSync('jw-timer-feasibility.db');

  try {
    db.execSync(
      'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;',
    );

    const version = db.getFirstSync<{
      user_version: number;
    }>('PRAGMA user_version')?.user_version;

    if (version !== 0 && version !== 1) {
      throw new Error('Unsupported timer database version.');
    }

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
    try {
      db.closeSync();
    } catch {
      // Preserve the initialization error.
    }

    throw error;
  }
}

export const timerCheckpointRepository:
  TimerCheckpointRepository = {
    read() {
      const row = database().getFirstSync<{
        payload: string;
      }>(
        'SELECT payload FROM timer_checkpoint WHERE id = 1',
      );

      if (!row) return null;

      if (
        typeof row.payload !== 'string' ||
        row.payload.length > MAX_PAYLOAD_LENGTH
      ) {
        throw new Error('Invalid timer checkpoint size.');
      }

      const decoded: unknown = JSON.parse(row.payload);

      return parseSessionCheckpoint(decoded);
    },

    write(value) {
      if (!isSessionCheckpoint(value)) {
        throw new Error('Invalid timer checkpoint.');
      }

      const payload = JSON.stringify(value);

      if (payload.length > MAX_PAYLOAD_LENGTH) {
        throw new Error('Timer checkpoint is too large.');
      }

      const db = database();

      db.withTransactionSync(() => {
        db.runSync(
          `INSERT INTO timer_checkpoint (id, payload)
           VALUES (1, ?)
           ON CONFLICT(id) DO UPDATE
           SET payload = excluded.payload`,
          payload,
        );
      });
    },

    info() {
      const db = database();

      const wal = db.getFirstSync<{
        journal_mode: string;
      }>('PRAGMA journal_mode')?.journal_mode;

      const foreignKeys = db.getFirstSync<{
        foreign_keys: number;
      }>('PRAGMA foreign_keys')?.foreign_keys;

      return [
        'SQLite schema 1',
        'Checkpoint formats 1 and 2 supported',
        wal ?? 'unknown journal',
        `Foreign keys ${foreignKeys === 1 ? 'on' : 'off'}`,
      ].join(' · ');
    },
  };