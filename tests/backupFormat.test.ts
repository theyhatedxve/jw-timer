import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BACKUP_TABLES,
  decodeBackup,
} from '../src/backend/domain/backups/backupFormat';

function archive() {
  const tables: Record<string, unknown> = Object.fromEntries(
    BACKUP_TABLES.map(table => [table, []]),
  );

  return {
    format: 'jw-timer-backup',
    version: 1,
    schema: 8,
    createdAt: 1,
    migrations: Array.from({ length: 8 }, (_, index) => ({
      version: index + 1,
      checksum: 'fnv1a32:1234abcd',
    })),
    tables,
  };
}

test('accepts the supported backup envelope', () => {
  assert.equal(decodeBackup(JSON.stringify(archive())).schema, 8);
});

test('rejects malformed JSON', () => {
  assert.throws(() => decodeBackup('{'));
});

test('rejects unsupported archive and database versions', () => {
  for (const change of [{ version: 2 }, { schema: 9 }]) {
    assert.throws(() =>
      decodeBackup(JSON.stringify({ ...archive(), ...change })),
    );
  }
});

test('rejects unknown tables', () => {
  const input = archive();
  input.tables.untrusted_table = [];

  assert.throws(() => decodeBackup(JSON.stringify(input)));
});

test('rejects nested values inside database rows', () => {
  const input = archive();
  input.tables.local_publishers = [{ id: { unexpected: true } }];

  assert.throws(() => decodeBackup(JSON.stringify(input)));
});

test('rejects incomplete migration history', () => {
  const input = archive();
  input.migrations.pop();

  assert.throws(() => decodeBackup(JSON.stringify(input)));
});