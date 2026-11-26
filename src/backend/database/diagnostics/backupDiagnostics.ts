import { openDatabaseSync } from 'expo-sqlite';

import {
  APP_SCHEMA_MIGRATIONS,
  migrationChecksum,
} from '../appDatabase';

import { createBackupRepository } from '../repositories/backupRepository';
import { createMeetingRepository } from '../repositories/meetingRepository';
import { backupCrypto } from '../../files/backupCrypto';

import {
  BackupFailure,
  decodeBackup,
} from '../../domain/backups/backupFormat';

import type {
  DiagnosticResult,
} from '../../services/diagnostics.types';

function requireCondition(
  condition: boolean,
  message: string,
): void {
  if (!condition) throw new Error(message);
}

async function expectRejection(
  operation: () => Promise<unknown>,
): Promise<void> {
  let rejected = false;

  try {
    await operation();
  } catch {
    rejected = true;
  }

  requireCondition(rejected, 'Invalid ciphertext was accepted.');
}

export async function runBackupChecks():
  Promise<readonly DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  async function check(
    name: string,
    operation: () => void | Promise<void>,
  ): Promise<boolean> {
    try {
      await operation();
      results.push({
        name,
        passed: true,
        detail: 'Expected result observed.',
      });
      return true;
    } catch (error) {
      results.push({
        name,
        passed: false,
        detail: error instanceof Error
          ? error.message
          : 'Native diagnostic failed.',
      });
      return false;
    }
  }

  // Explicitly isolated. Never calls getAppDatabase().
  const db = openDatabaseSync(':memory:', {
    useNewConnection: true,
  });

  const publisherId = 'a'.repeat(32);
  const meetingId = 'b'.repeat(32);
  const sectionId = 'c'.repeat(32);
  const partId = 'd'.repeat(32);

  try {
    const initialized = await check('Create isolated fixture', () => {
      db.execSync('PRAGMA foreign_keys = ON');

      db.withTransactionSync(() => {
        db.execSync(`
          CREATE TABLE schema_migrations (
            version INTEGER PRIMARY KEY CHECK (version >= 1),
            checksum TEXT NOT NULL,
            applied_at INTEGER NOT NULL
          );
        `);

        for (const migration of APP_SCHEMA_MIGRATIONS) {
          db.execSync(migration.sql);

          db.runSync(
            `INSERT INTO schema_migrations
             (version, checksum, applied_at) VALUES (?, ?, ?)`,
            migration.version,
            migrationChecksum(migration.sql),
            1,
          );
        }

        db.runSync(
          `INSERT INTO app_preferences
           (key, value_json, updated_at) VALUES (?, ?, ?)`,
          'local_profile',
          JSON.stringify({
            name: 'Backup Diagnostic',
            timezone: 'Asia/Manila',
            programLanguage: 'en',
            interfaceLanguage: 'en',
            recordVersion: 1,
            revision: 1,
          }),
          1,
        );

        db.runSync(
          `INSERT INTO local_publishers
           (id, display_name, is_active, revision,
            created_at, updated_at)
           VALUES (?, ?, 1, 1, 1, 1)`,
          publisherId,
          'Original publisher',
        );

        db.runSync(
          `INSERT INTO local_publisher_roles
           (publisher_id, role_code) VALUES (?, ?)`,
          publisherId,
          'sound',
        );

        db.runSync(
          `INSERT INTO local_meeting_drafts
           (id, title, meeting_type, meeting_date,
            start_local_time, end_local_time,
            timezone, program_language, revision,
            created_at, updated_at, import_source_json)
           VALUES (?, ?, 'midweek', '2026-11-25',
                   '18:30', '20:00', 'Asia/Manila',
                   'en', 1, 1, 1, NULL)`,
          meetingId,
          'Original meeting',
        );

        db.runSync(
          `INSERT INTO local_meeting_sections
           (id, meeting_id, position, title)
           VALUES (?, ?, 0, ?)`,
          sectionId,
          meetingId,
          'Diagnostic section',
        );

        db.runSync(
          `INSERT INTO local_meeting_parts
           (id, meeting_id, section_id, position,
            title, kind, duration_seconds, is_timed)
           VALUES (?, ?, ?, 0, ?, 'talk', 600, 1)`,
          partId,
          meetingId,
          sectionId,
          'Diagnostic part',
        );

        db.runSync(
          `INSERT INTO local_technical_duties
           (meeting_id, duty_key, publisher_id,
            revision, updated_at)
           VALUES (?, 'sound-operator', ?, 1, 1)`,
          meetingId,
          publisherId,
        );
      });
    });

    if (!initialized) return results;

    const repository = createBackupRepository(() => db);
    const original = repository.capture();
    const originalToken = repository.token();

    const replacement = decodeBackup(JSON.stringify({
      ...original,
      tables: {
        ...original.tables,
        local_publishers: original.tables.local_publishers.map(
          row => ({ ...row, display_name: 'Restored publisher' }),
        ),
        local_meeting_drafts:
          original.tables.local_meeting_drafts.map(
            row => ({ ...row, title: 'Restored meeting' }),
          ),
      },
    }));

    const password = 'Diagnostic-only-passphrase';
    const plaintext = JSON.stringify(original);
    const ciphertext: { value?: Uint8Array } = {};

    const cryptoReady = await check(
      'Native encrypted backup round trip',
      async () => {
        ciphertext.value = await backupCrypto.encrypt(
          plaintext,
          password,
        );

        const decrypted = await backupCrypto.decrypt(
          ciphertext.value,
          password,
        );

        requireCondition(
          decrypted === plaintext,
          'Decrypted backup differs from its input.',
        );
      },
    );

    if (cryptoReady && ciphertext.value) {
      const encrypted = ciphertext.value;

      await check('Reject wrong password', async () => {
        await expectRejection(() =>
          backupCrypto.decrypt(
            encrypted,
            'Different-diagnostic-password',
          ),
        );
      });

      await check('Reject modified authentication tag', async () => {
        const modified = encrypted.slice();
        const last = modified.length - 1;

        modified[last] = (modified[last] ?? 0) ^ 1;

        await expectRejection(() =>
          backupCrypto.decrypt(modified, password),
        );
      });
    }

    await check('Preview validates without replacing records', () => {
      const summary = repository.prepare(replacement);

      requireCondition(
        summary.meetings === 1 &&
        summary.publishers === 1 &&
        summary.assignments === 1,
        'Preview counts are incorrect.',
      );

      requireCondition(
        repository.token() === originalToken,
        'Preview modified the fixture.',
      );
    });

    await check('Late restore failure rolls back all records', () => {
      db.execSync(`
        CREATE TEMP TRIGGER backup_restore_abort
        BEFORE INSERT ON local_technical_duties
        BEGIN
          SELECT CASE WHEN
            NOT EXISTS (
              SELECT 1 FROM local_publishers
              WHERE display_name = 'Restored publisher'
            )
            OR NOT EXISTS (
              SELECT 1 FROM local_meeting_drafts
              WHERE title = 'Restored meeting'
            )
          THEN RAISE(ABORT, 'WRONG_FAILURE_POINT') END;

          SELECT RAISE(ABORT, 'EXPECTED_RESTORE_ABORT');
        END;
      `);

      try {
        let failure = '';

        try {
          repository.restore(replacement, originalToken);
        } catch (error) {
          failure = String(error);
        }

        requireCondition(
          failure.includes('EXPECTED_RESTORE_ABORT'),
          'Restore did not fail at the intended final insert.',
        );

        requireCondition(
          repository.token() === originalToken,
          'Failed restore changed original records.',
        );

        // Reuses integrity, foreign-key, and domain validation.
        repository.capture();
      } finally {
        db.execSync('DROP TRIGGER IF EXISTS backup_restore_abort');
      }
    });

    await check('Successful restore replaces fixture records', () => {
      repository.restore(replacement, repository.token());

      const restored = repository.capture();

      requireCondition(
        restored.tables.local_publishers[0]?.display_name ===
          'Restored publisher',
        'Publisher was not restored.',
      );

      requireCondition(
        restored.tables.local_meeting_drafts[0]?.title ===
          'Restored meeting',
        'Meeting was not restored.',
      );

      requireCondition(
        restored.tables.local_technical_duties[0]?.publisher_id ===
          publisherId,
        'Assignment was not restored.',
      );
    });

    await check('Reject stale restore preview without changes', () => {
      const oldToken = repository.token();

      db.runSync(
        'UPDATE local_meeting_drafts SET title = ? WHERE id = ?',
        'Changed after preview',
        meetingId,
      );

      const changedToken = repository.token();
      let rejected = false;

      try {
        repository.restore(original, oldToken);
      } catch (error) {
        rejected =
          error instanceof BackupFailure &&
          error.code === 'changed';
      }

      requireCondition(rejected, 'Stale preview was accepted.');

      requireCondition(
        repository.token() === changedToken,
        'Rejected restore modified current records.',
      );
    });

    await check('Retired assignments survive meeting edits and backup restore', () => {
      db.runSync(
        `INSERT INTO local_part_assignments
           (meeting_id, part_id, role_code, publisher_id, revision, updated_at)
         VALUES (?, ?, 'sound', ?, 2, 123)`,
        meetingId, partId, publisherId,
      );

      const before = repository.capture();
      const meetings = createMeetingRepository(() => db);
      const current = meetings.get(meetingId);
      if (!current.ok || !current.value) throw new Error('Fixture meeting missing.');

      const saved = meetings.save({
        ...current.value.draft,
        startLocalTime: null,
        endLocalTime: null,
        sections: current.value.draft.sections.map(section => ({
          ...section,
          parts: section.parts.filter(part => part.id !== partId),
        })),
      }, { id: meetingId, revision: current.value.revision });

      if (!saved.ok) throw new Error(saved.error.message);

      const archived = repository.capture();
      requireCondition(
        archived.tables.local_part_assignments.length === 0 &&
          archived.tables.local_meeting_parts.length === 0 &&
          archived.tables.local_meeting_drafts[0]?.start_local_time === null &&
          JSON.stringify(archived.tables.legacy_part_assignments_v6) ===
            JSON.stringify(before.tables.local_part_assignments) &&
          JSON.stringify(archived.tables.local_technical_duties) ===
            JSON.stringify(before.tables.local_technical_duties),
        'Meeting edit did not preserve the historical records.',
      );

      repository.restore(before, repository.token());
      requireCondition(
        JSON.stringify(repository.capture().tables.local_part_assignments) ===
          JSON.stringify(before.tables.local_part_assignments),
        'The earlier backup did not restore the original assignment.',
      );

      repository.restore(archived, repository.token());
      requireCondition(
        JSON.stringify(repository.capture().tables.legacy_part_assignments_v6) ===
          JSON.stringify(archived.tables.legacy_part_assignments_v6),
        'The archived assignment did not survive restore.',
      );
    });
  } catch {
    results.push({
      name: 'Diagnostic setup or fixture validation',
      passed: false,
      detail: 'The isolated diagnostic could not finish.',
    });
  } finally {
    await check('Close isolated database', () => db.closeSync());
  }

  return results;
}