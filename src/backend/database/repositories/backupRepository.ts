import {
  backupDatabaseSync,
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { getAppDatabase } from '../appDatabase';
import { readMeetingForBackup } from './meetingRepository';
import {
  readPublisherForBackup,
  decodeDutyForBackup,
} from './legacyStoredRecords';
import { parseStoredProfile } from '../../domain/profile/profile';
import {
  captureSyncDrafts,
  restoreSyncDrafts,
  syncRestoreToken,
} from './legacySyncBackup';

import {
  BACKUP_TABLES,
  BackupFailure,
  decodeBackup,
  type BackupArchive,
  type BackupRow,
  type BackupSummary,
} from '../../domain/backups/backupFormat';

function invalid(): never {
  throw new BackupFailure('invalid');
}

function quote(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function migrationRows(db: SQLiteDatabase) {
  const rows = db.getAllSync<{
    version: number;
    checksum: string;
  }>(
    'SELECT version, checksum FROM schema_migrations WHERE version <= 8 ORDER BY version',
  );

  if (
    rows.length !== 8 ||
    rows.some((row, index) => row.version !== index + 1)
  ) {
    invalid();
  }

  return rows;
}

function checkMigrations(
  db: SQLiteDatabase,
  archive: BackupArchive,
): void {
  const expected = migrationRows(db);
  const profileChecksums = new Set([
    'fnv1a32:4337d0ce',
    'fnv1a32:c501792e',
  ]);

  archive.migrations.forEach((row, index) => {
    const current = expected[index];

    const matches =
      current?.version === row.version &&
      (
        current.checksum === row.checksum ||
        (
          row.version === 1 &&
          profileChecksums.has(current.checksum) &&
          profileChecksums.has(row.checksum)
        )
      );

    if (!matches) invalid();
  });
}

function readTables(db: SQLiteDatabase): BackupArchive['tables'] {
  const tables = {} as BackupArchive['tables'];

  for (const table of BACKUP_TABLES) {
    tables[table] = table === 'app_preferences'
      ? db.getAllSync<BackupRow>(
          `SELECT * FROM app_preferences
           WHERE key = ? ORDER BY rowid`,
          'local_profile',
        )
      : db.getAllSync<BackupRow>(
          `SELECT * FROM ${quote(table)} ORDER BY rowid`,
        );
  }

  return tables;
}

function validateData(db: SQLiteDatabase): void {
  const integrity = db.getFirstSync<{ integrity_check: string }>(
    'PRAGMA integrity_check',
  );

  if (
    integrity?.integrity_check !== 'ok' ||
    db.getAllSync('PRAGMA foreign_key_check').length > 0
  ) {
    invalid();
  }

  const profile = db.getFirstSync<{ value_json: string }>(
    'SELECT value_json FROM app_preferences WHERE key = ?',
    'local_profile',
  );

  if (
    !profile ||
    profile.value_json.length > 4096 ||
    !parseStoredProfile(JSON.parse(profile.value_json)).ok
  ) {
    invalid();
  }

  for (const row of db.getAllSync<{ id: string }>(
    'SELECT id FROM local_publishers',
  )) {
    if (!readPublisherForBackup(db, row.id)) invalid();
  }

  for (const row of db.getAllSync<{ id: string }>(
    'SELECT id FROM local_meeting_drafts',
  )) {
    if (!readMeetingForBackup(db, row.id)) invalid();
  }

  const duties = db.getAllSync<{
    meeting_id: string;
    duty_key: string;
    publisher_id: string | null;
    revision: number;
  }>('SELECT * FROM local_technical_duties');

  duties.forEach(decodeDutyForBackup);
}

function restoreToken(db: SQLiteDatabase): string {
  return JSON.stringify({ tables: readTables(db), sync: syncRestoreToken(db) });
}

function replaceRows(
  db: SQLiteDatabase,
  archive: BackupArchive,
): void {
  for (const table of [...BACKUP_TABLES].reverse()) {
    if (table === 'app_preferences') {
      db.runSync(
        'DELETE FROM app_preferences WHERE key = ?',
        'local_profile',
      );
    } else {
      db.execSync(`DELETE FROM ${quote(table)}`);
    }
  }

  for (const table of BACKUP_TABLES) {
    const columns = db.getAllSync<{ name: string }>(
      `PRAGMA table_info(${quote(table)})`,
    ).map(column => column.name);

    const expected = [...columns].sort().join('\0');

    const sql =
      `INSERT INTO ${quote(table)} ` +
      `(${columns.map(quote).join(',')}) ` +
      `VALUES (${columns.map(() => '?').join(',')})`;

    for (const row of archive.tables[table]) {
      if (
        Object.keys(row).sort().join('\0') !== expected ||
        (
          table === 'app_preferences' &&
          row.key !== 'local_profile'
        )
      ) {
        invalid();
      }

      const values = columns.map(column => {
        const value = row[column];
        if (value === undefined) invalid();
        return value;
      });

      db.runSync(sql, ...values);
    }
  }
}

export function createBackupRepository(
  database: () => SQLiteDatabase,
) {
  return {
  capture(): BackupArchive {
    const db = database();
    let archive: BackupArchive | undefined;

    db.withTransactionSync(() => {
      validateData(db);

      archive = decodeBackup(JSON.stringify({
        format: 'jw-timer-backup',
        version: 2,
        schema: 8,
        createdAt: Date.now(),
        migrations: migrationRows(db),
        tables: readTables(db),
        syncDrafts: captureSyncDrafts(db),
      }));
    });

    if (!archive) invalid();
    return archive;
  },

  token(): string {
    const db = database();
    let token = '';

    db.withTransactionSync(() => {
      token = restoreToken(db);
    });

    return token;
  },

  prepare(archive: BackupArchive): BackupSummary {
    const current = database();
    checkMigrations(current, archive);

    const staged = openDatabaseSync(':memory:', {
      useNewConnection: true,
    });

    try {
      backupDatabaseSync({
        sourceDatabase: current,
        destDatabase: staged,
      });

      staged.execSync('PRAGMA foreign_keys = ON');

      staged.withTransactionSync(() => {
        replaceRows(staged, archive);
        restoreSyncDrafts(staged, archive.syncDrafts ?? []);
        validateData(staged);
      });
    } finally {
      staged.closeSync();
    }

    return {
      createdAt: archive.createdAt,
      meetings: archive.tables.local_meeting_drafts.length,
      publishers: archive.tables.local_publishers.length,
      assignments: archive.tables.local_technical_duties
        .filter(row => row.publisher_id !== null).length,
      historicalRows:
        archive.tables.local_part_assignments.length +
        archive.tables.local_meeting_duties.length +
        archive.tables.legacy_part_assignments_v6.length,
    };
  },

  restore(archive: BackupArchive, expectedToken: string): void {
    const db = database();

    db.withTransactionSync(() => {
      checkMigrations(db, archive);

      if (restoreToken(db) !== expectedToken) {
        throw new BackupFailure('changed');
      }

      replaceRows(db, archive);
      restoreSyncDrafts(db, archive.syncDrafts ?? []);
      validateData(db);
    });
  },
  };
}

export const backupRepository =
  createBackupRepository(getAppDatabase);
