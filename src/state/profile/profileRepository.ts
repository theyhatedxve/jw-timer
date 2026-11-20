import {
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import type { ProfileRepository } from './profileService';
import {
  parseStoredProfile,
  PROFILE_LIMITS,
  type LocalProfile,
  type ProfileErrorCode,
  type ProfileResult,
} from './profile';

const PROFILE_KEY = 'local_profile';

const MIGRATION_SQL = `
CREATE TABLE app_preferences (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

let connection: SQLiteDatabase | null = null;

class ProfileRepositoryError extends Error {
  constructor(readonly code: ProfileErrorCode) {
    super(code);
  }
}

// A migration-change checksum, not a security signature.
function migrationChecksum(text: string): string {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(
      hash ^ text.charCodeAt(index),
      16777619,
    );
  }

  return `fnv1a32:${(hash >>> 0).toString(16)}`;
}

function safely<T>(
  operation: () => T,
): ProfileResult<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    return {
      ok: false,
      code:
        error instanceof ProfileRepositoryError
          ? error.code
          : 'storage',
    };
  }
}

function database(): SQLiteDatabase {
  if (connection) return connection;

  const db = openDatabaseSync('jw-timer.db', {
    useNewConnection: true,
  });

  try {
    db.execSync(
      'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;',
    );

    db.withTransactionSync(() => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY CHECK (version >= 1),
          checksum TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );
      `);

      const migrations = db.getAllSync<{
        version: number;
        checksum: string;
      }>(
        'SELECT version, checksum FROM schema_migrations ORDER BY version',
      );

      const checksum = migrationChecksum(MIGRATION_SQL);

      if (migrations.length === 0) {
        db.execSync(MIGRATION_SQL);

        db.runSync(
          'INSERT INTO schema_migrations VALUES (?, ?, ?)',
          1,
          checksum,
          Date.now(),
        );
      } else {
        const first = migrations[0];

        if (
          migrations.length !== 1 ||
          first?.version !== 1 ||
          first.checksum !== checksum
        ) {
          throw new ProfileRepositoryError('corrupt');
        }
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

function readProfile(
  db: SQLiteDatabase,
): LocalProfile | null {
  const row = db.getFirstSync<{ value_json: string }>(
    'SELECT value_json FROM app_preferences WHERE key = ?',
    PROFILE_KEY,
  );

  if (!row) return null;

  if (
    typeof row.value_json !== 'string' ||
    row.value_json.length > PROFILE_LIMITS.storedJson
  ) {
    throw new ProfileRepositoryError('corrupt');
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(row.value_json);
  } catch {
    throw new ProfileRepositoryError('corrupt');
  }

  const parsed = parseStoredProfile(decoded);

  if (!parsed.ok) {
    throw new ProfileRepositoryError('corrupt');
  }

  return parsed.value;
}

export const localProfileRepository: ProfileRepository = {
  read() {
    return safely(() => readProfile(database()));
  },

  save(draft, expectedRevision) {
    return safely<LocalProfile>(() => {
      const db = database();
      const outcome: { profile?: LocalProfile } = {};

      db.withTransactionSync(() => {
        const current = readProfile(db);

        if (
          (current?.revision ?? null) !== expectedRevision
        ) {
          throw new ProfileRepositoryError('conflict');
        }

        const profile: LocalProfile = {
          ...draft,
          recordVersion: 1,
          interfaceLanguage: 'en',
          revision: (current?.revision ?? 0) + 1,
        };

        const validated = parseStoredProfile(profile);

        if (!validated.ok) {
          throw new ProfileRepositoryError('corrupt');
        }

        db.runSync(
          `INSERT INTO app_preferences
             (key, value_json, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             value_json = excluded.value_json,
             updated_at = excluded.updated_at`,
          PROFILE_KEY,
          JSON.stringify(validated.value),
          Date.now(),
        );

        const saved = readProfile(db);

        if (!saved) {
          throw new ProfileRepositoryError('corrupt');
        }

        outcome.profile = saved;
      });

      if (!outcome.profile) {
        throw new ProfileRepositoryError('storage');
      }

      return outcome.profile;
    });
  },
};