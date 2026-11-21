import { getAppDatabase } from '../appDatabase';
import {
  validateAssignment,
  type Assignment,
  type ScheduleResult,
} from '../../domain/assignments/assignment';
import { isPublisherRole, validPublisherId } from '../../domain/publishers/publisher';
import type { AssignmentRepository } from '../../services/scheduleService';

interface SlotRow {
  meeting_id: string;
  part_id: string;
  role_code: string;
  publisher_id: string | null;
  revision: number;
}

class AssignmentStorageError extends Error {
  constructor(readonly field: string, message: string) { super(message); }
}

function safely<T>(operation: () => T): ScheduleResult<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof AssignmentStorageError
        ? { field: error.field, message: error.message }
        : { field: 'storage', message: 'The assignment could not be read or saved.' },
    };
  }
}

function fail(field: string, message: string): never {
  throw new AssignmentStorageError(field, message);
}

function decode(row: SlotRow): Assignment {
  if (
    !validPublisherId(row.meeting_id) || !validPublisherId(row.part_id) ||
    !isPublisherRole(row.role_code) ||
    (row.publisher_id !== null && !validPublisherId(row.publisher_id)) ||
    !Number.isSafeInteger(row.revision) || row.revision < 1
  ) {
    fail('storage', 'Saved assignment information is invalid.');
  }
  return {
    meetingId: row.meeting_id, partId: row.part_id, role: row.role_code,
    publisherId: row.publisher_id, revision: row.revision,
  };
}

export const localAssignmentRepository: AssignmentRepository = {
  list(meetingId) {
    return safely(() => getAppDatabase().getAllSync<SlotRow>(
      `SELECT meeting_id, part_id, role_code, publisher_id, revision
       FROM local_part_assignments WHERE meeting_id = ? ORDER BY part_id, role_code`,
      meetingId,
    ).map(decode));
  },

  save(input) {
    return safely(() => {
      const parsed = validateAssignment(input);
      if (!parsed.ok) fail(parsed.error.field, parsed.error.message);
      const command = parsed.value;
      const db = getAppDatabase();
      const outcome: { value?: Assignment } = {};
      db.withTransactionSync(() => {
        const meeting = db.getFirstSync<{ revision: number }>(
          'SELECT revision FROM local_meeting_drafts WHERE id = ?', command.meetingId,
        );
        if (meeting?.revision !== command.meetingRevision) {
          fail('conflict', 'The meeting changed. Reload before saving.');
        }
        const part = db.getFirstSync<{ id: string }>(
          'SELECT id FROM local_meeting_parts WHERE id = ? AND meeting_id = ?',
          command.partId, command.meetingId,
        );
        if (!part) fail('conflict', 'This meeting part is unavailable.');
        const previousRow = db.getFirstSync<SlotRow>(
          `SELECT meeting_id, part_id, role_code, publisher_id, revision
           FROM local_part_assignments WHERE meeting_id = ? AND part_id = ? AND role_code = ?`,
          command.meetingId, command.partId, command.role,
        );
        const previous = previousRow ? decode(previousRow) : null;
        if ((previous?.revision ?? 0) !== command.expectedRevision) {
          fail('conflict', 'This assignment changed. Reload before saving.');
        }
        if (command.publisherId !== null) {
          const person = db.getFirstSync<{ is_active: number; eligible: number }>(
            `SELECT p.is_active,
               EXISTS(SELECT 1 FROM local_publisher_roles r
                 WHERE r.publisher_id = p.id AND r.role_code = ?) AS eligible
             FROM local_publishers p WHERE p.id = ?`,
            command.role, command.publisherId,
          );
          if (person?.is_active !== 1 || person.eligible !== 1) {
            fail('publisher', 'Choose an active publisher eligible for this responsibility.');
          }
          const duplicate = db.getFirstSync<{ present: number }>(
            `SELECT 1 AS present FROM local_part_assignments
             WHERE meeting_id = ? AND part_id = ? AND publisher_id = ? AND role_code <> ? LIMIT 1`,
            command.meetingId, command.partId, command.publisherId, command.role,
          );
          if (duplicate) fail('publisher', 'This publisher already has another responsibility on this part.');
        }
        const revision = command.expectedRevision + 1;
        const result = db.runSync(
          `INSERT INTO local_part_assignments
           (meeting_id, part_id, role_code, publisher_id, revision, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(meeting_id, part_id, role_code) DO UPDATE SET
             publisher_id = excluded.publisher_id, revision = excluded.revision,
             updated_at = excluded.updated_at
           WHERE local_part_assignments.revision = ?`,
          command.meetingId, command.partId, command.role, command.publisherId,
          revision, Date.now(), command.expectedRevision,
        );
        if (result.changes !== 1) fail('conflict', 'The assignment changed before saving.');
        outcome.value = {
          meetingId: command.meetingId, partId: command.partId, role: command.role,
          publisherId: command.publisherId, revision,
        };
      });
      if (!outcome.value) fail('storage', 'No saved assignment was returned.');
      return outcome.value;
    });
  },
};
