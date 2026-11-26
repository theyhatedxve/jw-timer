import { parseSyncDataset } from '../legacy/syncCodec';
import type { SyncDataset } from '../legacy/syncTypes';

export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;

export const BACKUP_TABLES = [
  'app_preferences',
  'local_publishers',
  'local_publisher_roles',
  'local_meeting_drafts',
  'local_meeting_sections',
  'local_meeting_parts',
  'local_part_assignments',
  'local_meeting_duties',
  'legacy_part_assignments_v6',
  'local_technical_duties',
] as const;

export type BackupTable = typeof BACKUP_TABLES[number];
export type BackupValue = string | number | null;
export type BackupRow = Record<string, BackupValue>;

export interface BackupArchive {
  readonly format: 'jw-timer-backup';
  readonly version: 1 | 2;
  // Content tables and checksums stay at schema 8 independently of the live DB.
  readonly schema: 8;
  readonly createdAt: number;
  readonly migrations: readonly {
    readonly version: number;
    readonly checksum: string;
  }[];
  readonly tables: Record<BackupTable, readonly BackupRow[]>;
  readonly syncDrafts?: readonly SyncDataset[];
}

export interface BackupSummary {
  readonly createdAt: number;
  readonly meetings: number;
  readonly publishers: number;
  readonly assignments: number;
  readonly historicalRows: number;
}

export class BackupFailure extends Error {
  constructor(
    readonly code: 'invalid' | 'changed' | 'password' | 'native',
  ) {
    super(code);
  }
}

function record(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value);
}

export function decodeBackup(serialized: string): BackupArchive {
  if (serialized.length > MAX_BACKUP_BYTES) {
    throw new BackupFailure('invalid');
  }

  let input: unknown;

  try {
    input = JSON.parse(serialized);
  } catch {
    throw new BackupFailure('invalid');
  }

  if (
    !record(input) ||
    input.format !== 'jw-timer-backup' ||
    (input.version !== 1 && input.version !== 2) ||
    input.schema !== 8 ||
    typeof input.createdAt !== 'number' ||
    !Number.isSafeInteger(input.createdAt) ||
    input.createdAt < 0 ||
    !Array.isArray(input.migrations) ||
    input.migrations.length !== 8 ||
    !record(input.tables)
  ) {
    throw new BackupFailure('invalid');
  }

  let syncDrafts: readonly SyncDataset[] | undefined;

  if (input.version === 1) {
    if (input.syncDrafts !== undefined) {
      throw new BackupFailure('invalid');
    }
  } else {
    if (!Array.isArray(input.syncDrafts) || input.syncDrafts.length > 256) {
      throw new BackupFailure('invalid');
    }

    try {
      syncDrafts = input.syncDrafts.map(dataset => parseSyncDataset(dataset));
    } catch {
      throw new BackupFailure('invalid');
    }
  }

  input.migrations.forEach((migration, index) => {
    if (
      !record(migration) ||
      migration.version !== index + 1 ||
      typeof migration.checksum !== 'string' ||
      !/^fnv1a32:[a-f0-9]{1,8}$/.test(migration.checksum)
    ) {
      throw new BackupFailure('invalid');
    }
  });

  const tableNames = Object.keys(input.tables);

  if (
    tableNames.length !== BACKUP_TABLES.length ||
    tableNames.some(name =>
      !BACKUP_TABLES.some(allowed => allowed === name),
    )
  ) {
    throw new BackupFailure('invalid');
  }

  let totalRows = 0;

  for (const table of BACKUP_TABLES) {
    const rows = input.tables[table];

    if (!Array.isArray(rows)) {
      throw new BackupFailure('invalid');
    }

    totalRows += rows.length;

    if (rows.length > 20_000 || totalRows > 50_000) {
      throw new BackupFailure('invalid');
    }

    for (const row of rows) {
      if (!record(row)) throw new BackupFailure('invalid');

      for (const value of Object.values(row)) {
        const valid =
          value === null ||
          (typeof value === 'string' && value.length <= 1_000_000) ||
          (typeof value === 'number' && Number.isSafeInteger(value));

        if (!valid) throw new BackupFailure('invalid');
      }
    }
  }

  return {
    ...input,
    ...(syncDrafts === undefined ? {} : { syncDrafts }),
  } as unknown as BackupArchive;
}
