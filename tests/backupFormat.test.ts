import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BACKUP_TABLES,
  BackupFailure,
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

test('accepts legacy version 1 content without sync drafts', () => {
  const decoded = decodeBackup(JSON.stringify(archive()));
  assert.equal(decoded.version, 1);
  assert.equal(decoded.schema, 8);
  assert.equal(decoded.syncDrafts, undefined);
});

test('accepts version 2 content with bounded plain sync drafts at schema 8', () => {
  const dataset = {
    version: 2,
    congregationId: 'a'.repeat(32),
    publishers: [],
    meetings: [],
  };
  const input = { ...archive(), version: 2, syncDrafts: [dataset] };
  const decoded = decodeBackup(JSON.stringify(input));

  assert.equal(decoded.version, 2);
  assert.equal(decoded.schema, 8);
  assert.equal(decoded.migrations.length, 8);
  assert.deepEqual(decoded.syncDrafts, [dataset]);
  assert.deepEqual(
    decodeBackup(JSON.stringify({ ...input, syncDrafts: [] })).syncDrafts,
    [],
  );
  assert.equal(decodeBackup(JSON.stringify({
    ...input,
    syncDrafts: Array.from({ length: 256 }, () => dataset),
  })).syncDrafts?.length, 256);
});

test('rejects malformed JSON', () => {
  assert.throws(() => decodeBackup('{'));
});

test('rejects unsupported archive and database versions', () => {
  for (const change of [{ version: 0 }, { version: 3 }, { schema: 9 }]) {
    assert.throws(() =>
      decodeBackup(JSON.stringify({ ...archive(), ...change })),
    );
  }
});

test('rejects sync drafts in legacy version 1 archives', () => {
  assert.throws(() => decodeBackup(JSON.stringify({
    ...archive(), syncDrafts: [],
  })), (error: unknown) => error instanceof BackupFailure && error.code === 'invalid');
});

test('rejects missing, malformed and excessive version 2 sync drafts', () => {
  for (const syncDrafts of [
    undefined,
    null,
    {},
    [null],
    [{ version: 2, congregationId: 'invalid', publishers: [], meetings: [] }],
    [{
      version: 2,
      congregationId: 'a'.repeat(32),
      publishers: [],
      meetings: [],
      grants: [],
    }],
    Array.from({ length: 257 }, () => ({
      version: 2,
      congregationId: 'a'.repeat(32),
      publishers: [],
      meetings: [],
    })),
  ]) {
    assert.throws(() => decodeBackup(JSON.stringify({
      ...archive(), version: 2, syncDrafts,
    })), (error: unknown) => error instanceof BackupFailure && error.code === 'invalid');
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
