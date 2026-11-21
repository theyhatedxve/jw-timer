import type { SQLiteDatabase } from 'expo-sqlite';

import {
  AppDatabaseError,
  getAppDatabase as database,
} from '../db/appDatabase';

import type { ProfileRepository } from './profileService';
import {
  parseStoredProfile,
  PROFILE_LIMITS,
  type LocalProfile,
  type ProfileErrorCode,
  type ProfileResult,
} from './profile';

const PROFILE_KEY = 'local_profile';

class ProfileRepositoryError extends Error {
  constructor(readonly code: ProfileErrorCode) {
    super(code);
  }
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
        error instanceof ProfileRepositoryError ||
        error instanceof AppDatabaseError
          ? error.code
          : 'storage',
    };
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