import {
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { PUBLISHER_SQL } from './migrations/003_publishers';
import { ASSIGNMENT_SQL } from './migrations/004_assignments';
import {
  MEETING_DUTY_SQL,
} from './migrations/005_meeting_duties';
import { WORKBOOK_SOURCE_SQL } from './migrations/008_workbook_source';

import { MEETING_END_TIME_SQL } from './migrations/007_meeting_end_time';
import { TECHNICAL_ASSIGNMENT_SQL } from './migrations/006_technical_assignments';

export class AppDatabaseError extends Error {
  constructor(readonly code: 'corrupt') {
    super(code);
  }
}

// Preserve the exact original version 1 migration text.
const PROFILE_SQL = [
  '',
  'CREATE TABLE app_preferences (',
  '  key TEXT PRIMARY KEY,',
  '  value_json TEXT NOT NULL,',
  '  updated_at INTEGER NOT NULL',
  ');',
  '',
].join('\r\n');

const MEETING_SQL = `
CREATE TABLE local_meeting_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL
    CHECK (meeting_type IN ('midweek', 'weekend')),
  meeting_date TEXT NOT NULL,
  start_local_time TEXT,
  timezone TEXT NOT NULL,
  program_language TEXT NOT NULL
    CHECK (program_language IN ('en', 'war')),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_local_meeting_drafts_date
  ON local_meeting_drafts(meeting_date, id);

CREATE TABLE local_meeting_sections (
  id TEXT PRIMARY KEY NOT NULL,
  meeting_id TEXT NOT NULL
    REFERENCES local_meeting_drafts(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 0),
  title TEXT NOT NULL,
  UNIQUE (meeting_id, position),
  UNIQUE (id, meeting_id)
);

CREATE TABLE local_meeting_parts (
  id TEXT PRIMARY KEY NOT NULL,
  meeting_id TEXT NOT NULL
    REFERENCES local_meeting_drafts(id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (
    kind IN (
      'song', 'prayer', 'talk', 'study',
      'comments', 'custom', 'other'
    )
  ),
  duration_seconds INTEGER NOT NULL
    CHECK (duration_seconds BETWEEN 0 AND 86400),
  is_timed INTEGER NOT NULL CHECK (is_timed IN (0, 1)),
  CHECK (is_timed = 0 OR duration_seconds > 0),
  FOREIGN KEY (section_id, meeting_id)
    REFERENCES local_meeting_sections(id, meeting_id)
    ON DELETE RESTRICT,
  UNIQUE (section_id, position)
);

CREATE INDEX idx_local_meeting_parts_meeting
  ON local_meeting_parts(meeting_id);
`.replace(/\r\n/g, '\n');

const MIGRATIONS = [
  { version: 1, sql: PROFILE_SQL },
  { version: 2, sql: MEETING_SQL },
  { version: 3, sql: PUBLISHER_SQL },
  { version: 4, sql: ASSIGNMENT_SQL },
  { version: 5, sql: MEETING_DUTY_SQL },
  { version: 6, sql: TECHNICAL_ASSIGNMENT_SQL },
  { version: 7, sql: MEETING_END_TIME_SQL },
  { version: 8, sql: WORKBOOK_SOURCE_SQL },
] as const;

let connection: SQLiteDatabase | null = null;

function checksum(text: string): string {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }

  return `fnv1a32:${(hash >>> 0).toString(16)}`;
}

export function getAppDatabase(): SQLiteDatabase {
  if (connection) return connection;

  const db = openDatabaseSync('jw-timer.db', {
    useNewConnection: true,
  });

  try {
    db.execSync(
      'PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;',
    );

    const journal = db.getFirstSync<{ journal_mode: string }>(
      'PRAGMA journal_mode = WAL',
    );

    const foreignKeys = db.getFirstSync<{
      foreign_keys: number;
    }>('PRAGMA foreign_keys');

    if (
      journal?.journal_mode.toLowerCase() !== 'wal' ||
      foreignKeys?.foreign_keys !== 1
    ) {
      throw new Error('Required SQLite configuration unavailable.');
    }

    db.withTransactionSync(() => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY CHECK (version >= 1),
          checksum TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );
      `);

      const applied = db.getAllSync<{
        version: number;
        checksum: string;
      }>(
        'SELECT version, checksum FROM schema_migrations ORDER BY version',
      );

      for (let index = 0; index < applied.length; index += 1) {
        const actual = applied[index];
        const expected = MIGRATIONS[index];

        const checksumMatches =
          actual !== undefined &&
          expected !== undefined &&
          (
            actual.checksum === checksum(expected.sql) ||
            (
              expected.version === 1 &&
              actual.checksum === checksum(
                expected.sql.replace(/\r\n/g, '\n'),
              )
            )
          );

        if (
          !actual ||
          !expected ||
          actual.version !== expected.version ||
          !checksumMatches
        ) {
          throw new AppDatabaseError('corrupt');
        }
      }

      for (const migration of MIGRATIONS.slice(applied.length)) {
        db.execSync(migration.sql);

        db.runSync(
          `INSERT INTO schema_migrations
             (version, checksum, applied_at)
           VALUES (?, ?, ?)`,
          migration.version,
          checksum(migration.sql),
          Date.now(),
        );
      }
    });

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

export {
  MIGRATIONS as APP_SCHEMA_MIGRATIONS,
  checksum as migrationChecksum,
};