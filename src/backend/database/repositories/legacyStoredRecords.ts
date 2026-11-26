import type { SQLiteDatabase } from 'expo-sqlite';

import {
  validPublisherId,
  validatePublisherDraft,
} from '../../domain/legacy/publisher';
import {
  isMeetingDutyKey,
  type MeetingDuty,
} from '../../domain/legacy/meetingDutyRecord';

export interface PublisherRow {
  id: string;
  display_name: string;
  is_active: number;
  revision: number;
  updated_at: number;
}

export interface DutyRow {
  meeting_id: string;
  duty_key: string;
  publisher_id: string | null;
  revision: number;
}

export class PublisherStorageError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export class DutyError extends Error {
  constructor(readonly field: string, message: string) {
    super(message);
  }
}

export function corruptPublisher(): never {
  throw new PublisherStorageError(
    'storage',
    'Saved publisher information could not be read safely.',
  );
}

export function failDuty(field: string, message: string): never {
  throw new DutyError(field, message);
}

export function decodePublisherRecord(
  row: PublisherRow,
  roles: readonly string[],
) {
  if (
    !validPublisherId(row.id) ||
    (row.is_active !== 0 && row.is_active !== 1) ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1 ||
    !Number.isSafeInteger(row.updated_at) ||
    row.updated_at < 0
  ) {
    corruptPublisher();
  }

  const validated = validatePublisherDraft({
    displayName: row.display_name,
    isActive: row.is_active === 1,
    roles,
  });

  if (!validated.ok) corruptPublisher();

  return {
    ...validated.value,
    id: row.id,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

export function readPublisherForBackup(
  db: SQLiteDatabase,
  id: string,
) {
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

  return decodePublisherRecord(
    row,
    roles.map(role => role.role_code),
  );
}

export function decodeDutyForBackup(row: DutyRow): MeetingDuty {
  if (
    !validPublisherId(row.meeting_id) ||
    !isMeetingDutyKey(row.duty_key) ||
    (
      row.publisher_id !== null &&
      !validPublisherId(row.publisher_id)
    ) ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1
  ) {
    failDuty('storage', 'Invalid saved meeting duty.');
  }

  return {
    meetingId: row.meeting_id,
    key: row.duty_key,
    publisherId: row.publisher_id,
    revision: row.revision,
  };
}
