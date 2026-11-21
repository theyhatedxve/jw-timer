import type { SQLiteDatabase } from 'expo-sqlite';

import { getAppDatabase } from '../appDatabase';

import {
  parseStoredProfile,
  PROFILE_LIMITS,
} from '../../domain/profile/profile';

import {
  validPublisherId,
  validatePublisherDraft,
  type PublisherResult,
} from '../../domain/publishers/publisher';

import type {
  PublisherRepository,
  SavedPublisher,
} from '../../services/publisherService';

interface PublisherRow {
  id: string;
  display_name: string;
  is_active: number;
  revision: number;
  updated_at: number;
}

interface RoleRow {
  publisher_id: string;
  role_code: string;
}

class PublisherStorageError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

function safely<T>(
  operation: () => T,
): PublisherResult<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof PublisherStorageError
        ? { field: error.field, message: error.message }
        : {
            field: 'storage',
            message:
              'The publisher operation could not be completed. Your changes were not saved.',
          },
    };
  }
}

function corrupt(): never {
  throw new PublisherStorageError(
    'storage',
    'Saved publisher information could not be read safely.',
  );
}

function requireProfile(db: SQLiteDatabase): void {
  const row = db.getFirstSync<{ value_json: string }>(
    'SELECT value_json FROM app_preferences WHERE key = ?',
    'local_profile',
  );

  if (!row) {
    throw new PublisherStorageError(
      'profile',
      'Complete congregation profile setup first.',
    );
  }

  if (
    typeof row.value_json !== 'string' ||
    row.value_json.length > PROFILE_LIMITS.storedJson
  ) {
    corrupt();
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(row.value_json);
  } catch {
    corrupt();
  }

  if (!parseStoredProfile(decoded).ok) corrupt();
}

function decode(
  row: PublisherRow,
  roles: readonly string[],
): SavedPublisher {
  if (
    !validPublisherId(row.id) ||
    (row.is_active !== 0 && row.is_active !== 1) ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1 ||
    !Number.isSafeInteger(row.updated_at) ||
    row.updated_at < 0
  ) {
    corrupt();
  }

  const validated = validatePublisherDraft({
    displayName: row.display_name,
    isActive: row.is_active === 1,
    roles,
  });

  if (!validated.ok) corrupt();

  return {
    ...validated.value,
    id: row.id,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

function readPublisher(
  db: SQLiteDatabase,
  id: string,
): SavedPublisher | null {
  const row = db.getFirstSync<PublisherRow>(
    'SELECT * FROM local_publishers WHERE id = ?',
    id,
  );

  if (!row) return null;

  const roles = db.getAllSync<{ role_code: string }>(
    `SELECT role_code FROM local_publisher_roles
     WHERE publisher_id = ? ORDER BY role_code`,
    id,
  );

  return decode(row, roles.map(role => role.role_code));
}

function newId(db: SQLiteDatabase): string {
  const row = db.getFirstSync<{ id: string }>(
    'SELECT lower(hex(randomblob(16))) AS id',
  );

  if (!validPublisherId(row?.id)) {
    throw new Error('Publisher identifier generation failed.');
  }

  return row.id;
}

export const localPublisherRepository:
  PublisherRepository = {
    list() {
      return safely(() => {
        const db = getAppDatabase();
        const outcome: { value: SavedPublisher[] } = {
          value: [],
        };

        db.withTransactionSync(() => {
          const rows = db.getAllSync<PublisherRow>(
            `SELECT * FROM local_publishers
             ORDER BY display_name COLLATE NOCASE, id`,
          );

          const roles = db.getAllSync<RoleRow>(
            `SELECT publisher_id, role_code
             FROM local_publisher_roles
             ORDER BY publisher_id, role_code`,
          );

          const grouped = new Map<string, string[]>();
          const ids = new Set(rows.map(row => row.id));

          for (const role of roles) {
            if (!ids.has(role.publisher_id)) corrupt();

            const selected = grouped.get(role.publisher_id) ?? [];
            selected.push(role.role_code);
            grouped.set(role.publisher_id, selected);
          }

          outcome.value = rows.map(row =>
            decode(row, grouped.get(row.id) ?? []),
          );
        });

        return outcome.value;
      });
    },

    get(id) {
      return safely(() => {
        const db = getAppDatabase();

        const outcome: {
          value: SavedPublisher | null;
        } = { value: null };

        db.withTransactionSync(() => {
          outcome.value = readPublisher(db, id);
        });

        return outcome.value;
      });
    },

    save(input, target) {
      return safely(() => {
        const validated = validatePublisherDraft(input);

        if (!validated.ok) {
          throw new PublisherStorageError(
            validated.error.field,
            validated.error.message,
          );
        }

        const db = getAppDatabase();

        const outcome: {
          value?: SavedPublisher;
        } = {};

        db.withTransactionSync(() => {
          requireProfile(db);

          const current = target
            ? readPublisher(db, target.id)
            : null;

          if (
            target &&
            (!current || current.revision !== target.revision)
          ) {
            throw new PublisherStorageError(
              'conflict',
              'This publisher changed or is unavailable. Reload before saving.',
            );
          }

          const id = current?.id ?? newId(db);
          const revision = (current?.revision ?? 0) + 1;
          const now = Date.now();
          const draft = validated.value;

          if (!Number.isSafeInteger(revision)) {
            throw new PublisherStorageError(
              'revision',
              'The publisher version cannot be increased.',
            );
          }

          if (current) {
            const updated = db.runSync(
              `UPDATE local_publishers
               SET display_name = ?, is_active = ?,
                   revision = ?, updated_at = ?
               WHERE id = ? AND revision = ?`,
              draft.displayName,
              draft.isActive ? 1 : 0,
              revision,
              now,
              id,
              current.revision,
            );

            if (updated.changes !== 1) {
              throw new PublisherStorageError(
                'conflict',
                'The publisher changed before saving.',
              );
            }
          } else {
            db.runSync(
              `INSERT INTO local_publishers
               (id, display_name, is_active,
                revision, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              id,
              draft.displayName,
              draft.isActive ? 1 : 0,
              revision,
              now,
              now,
            );
          }

          db.runSync(
            'DELETE FROM local_publisher_roles WHERE publisher_id = ?',
            id,
          );

          for (const role of draft.roles) {
            db.runSync(
              `INSERT INTO local_publisher_roles
               (publisher_id, role_code) VALUES (?, ?)`,
              id,
              role,
            );
          }

          const saved = readPublisher(db, id);

          if (!saved) corrupt();

          outcome.value = saved;
        });

        if (!outcome.value) {
          throw new Error('The transaction returned no publisher.');
        }

        return outcome.value;
      });
    },
  };