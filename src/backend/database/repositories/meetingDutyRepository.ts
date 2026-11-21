import { getAppDatabase } from '../appDatabase';

import {
  isMeetingDutyKey,
  MEETING_DUTY_SLOTS,
  validateMeetingDuty,
  type MeetingDuty,
} from '../../domain/assignments/meetingDuty';

import type { ScheduleResult } from '../../domain/assignments/assignment';
import { validPublisherId } from '../../domain/publishers/publisher';

import type {
  MeetingDutyRepository,
} from '../../services/meetingDutyService';

interface DutyRow {
  meeting_id: string;
  duty_key: string;
  publisher_id: string | null;
  revision: number;
}

class DutyError extends Error {
  constructor(readonly field: string, message: string) {
    super(message);
  }
}

function fail(field: string, message: string): never {
  throw new DutyError(field, message);
}

function safely<T>(operation: () => T): ScheduleResult<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof DutyError
        ? { field: error.field, message: error.message }
        : {
            field: 'storage',
            message: 'The meeting duty could not be read or saved.',
          },
    };
  }
}

function decode(row: DutyRow): MeetingDuty {
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
    fail('storage', 'Invalid saved meeting duty.');
  }

  return {
    meetingId: row.meeting_id,
    key: row.duty_key,
    publisherId: row.publisher_id,
    revision: row.revision,
  };
}

export const localMeetingDutyRepository:
  MeetingDutyRepository = {
    list(meetingId) {
      return safely(() =>
        getAppDatabase().getAllSync<DutyRow>(
          `SELECT meeting_id, duty_key, publisher_id, revision
           FROM local_technical_duties
           WHERE meeting_id = ? ORDER BY duty_key`,
          meetingId,
        ).map(decode),
      );
    },

    save(input) {
      return safely(() => {
        const parsed = validateMeetingDuty(input);

        if (!parsed.ok) {
          fail(parsed.error.field, parsed.error.message);
        }

        const command = parsed.value;

        const definition = MEETING_DUTY_SLOTS.find(
          slot => slot.key === command.key,
        );

        if (!definition) fail('duty', 'Unknown meeting duty.');

        const db = getAppDatabase();
        const outcome: { value?: MeetingDuty } = {};

        db.withTransactionSync(() => {
          const meeting = db.getFirstSync<{ revision: number }>(
            'SELECT revision FROM local_meeting_drafts WHERE id = ?',
            command.meetingId,
          );

          if (meeting?.revision !== command.meetingRevision) {
            fail('conflict', 'The meeting changed. Reload first.');
          }

          const previousRow = db.getFirstSync<DutyRow>(
            `SELECT meeting_id, duty_key, publisher_id, revision
             FROM local_technical_duties
             WHERE meeting_id = ? AND duty_key = ?`,
            command.meetingId,
            command.key,
          );

          const previous = previousRow
            ? decode(previousRow)
            : null;

          if (
            (previous?.revision ?? 0) !== command.expectedRevision
          ) {
            fail('conflict', 'This duty changed. Reload first.');
          }

          if (command.publisherId !== null) {
            const publisher = db.getFirstSync<{
              is_active: number;
              eligible: number;
            }>(
              `SELECT p.is_active,
                 EXISTS(
                   SELECT 1 FROM local_publisher_roles r
                   WHERE r.publisher_id = p.id
                     AND r.role_code = ?
                 ) AS eligible
               FROM local_publishers p WHERE p.id = ?`,
              definition.role,
              command.publisherId,
            );

            if (
              publisher?.is_active !== 1 ||
              publisher.eligible !== 1
            ) {
              fail(
                'publisher',
                'Choose an active publisher eligible for this duty.',
              );
            }
          }

          const revision = command.expectedRevision + 1;

          const saved = db.runSync(
            `INSERT INTO local_technical_duties
             (meeting_id, duty_key, publisher_id,
              revision, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(meeting_id, duty_key) DO UPDATE SET
               publisher_id = excluded.publisher_id,
               revision = excluded.revision,
               updated_at = excluded.updated_at
             WHERE local_technical_duties.revision = ?`,
            command.meetingId,
            command.key,
            command.publisherId,
            revision,
            Date.now(),
            command.expectedRevision,
          );

          if (saved.changes !== 1) {
            fail('conflict', 'The duty changed before saving.');
          }

          outcome.value = {
            meetingId: command.meetingId,
            key: command.key,
            publisherId: command.publisherId,
            revision,
          };
        });

        if (!outcome.value) {
          fail('storage', 'No saved duty was returned.');
        }

        return outcome.value;
      });
    },
  };