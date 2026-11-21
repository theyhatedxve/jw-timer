import type { SQLiteDatabase } from 'expo-sqlite';
import { checkPublisherMeeting } from './meetingConflictCheck';

import {
  AppDatabaseError,
  getAppDatabase,
} from '../appDatabase';

import { parseStoredProfile } from '../../domain/profile/profile';

import type {
  MeetingDraft,
  MeetingResult,
} from '../../domain/meetings/meeting.types';

import type {
  MeetingRepository,
  MeetingSummary,
  SavedMeeting,
} from '../../services/meetingService';

import { workbookParsingEn } from '../../../constants/strings/workbookParsingEn';

import { validateMeetingDraft } from '../../domain/meetings/meetingValidation';

interface MeetingRow {
  id: string;
  title: string;
  meeting_type: string;
  meeting_date: string;
  start_local_time: string | null;
  end_local_time: string | null;
  timezone: string;
  program_language: string;
  revision: number;
  updated_at: number;
  import_source_json: string | null;
}

interface SectionRow {
  id: string;
  title: string;
}

interface PartRow {
  id: string;
  section_id: string;
  title: string;
  kind: string;
  duration_seconds: number;
  is_timed: number;
}

class MeetingStorageError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

function safely<T>(operation: () => T): MeetingResult<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    if (error instanceof MeetingStorageError) {
      return {
        ok: false,
        error: { field: error.field, message: error.message },
      };
    }

    return {
      ok: false,
      error: {
        field: 'storage',
        message: error instanceof AppDatabaseError
          ? 'The database version could not be verified.'
          : 'The operation could not be completed. Your changes were not saved.',
      },
    };
  }
}

function corrupt(): never {
  throw new MeetingStorageError(
    'storage',
    'The saved meeting could not be validated.',
  );
}

function newId(db: SQLiteDatabase): string {
  const row = db.getFirstSync<{ id: string }>(
    'SELECT lower(hex(randomblob(16))) AS id',
  );

  if (!row || !/^[a-f0-9]{32}$/.test(row.id)) {
    throw new Error('Identifier generation failed.');
  }

  return row.id;
}

function requireProfile(db: SQLiteDatabase): void {
  const row = db.getFirstSync<{ value_json: string }>(
    'SELECT value_json FROM app_preferences WHERE key = ?',
    'local_profile',
  );

  if (!row) {
    throw new MeetingStorageError(
      'profile',
      'Complete profile setup before saving meetings.',
    );
  }

  let input: unknown;

  try {
    input = JSON.parse(row.value_json);
  } catch {
    corrupt();
  }

  if (!parseStoredProfile(input).ok) corrupt();
}

function decodeHeader(
  row: MeetingRow,
  sections: unknown,
): MeetingDraft {
  if (
    !/^[a-f0-9]{32}$/.test(row.id) ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1 ||
    !Number.isSafeInteger(row.updated_at) ||
    row.updated_at < 0
  ) {
    corrupt();
  }

  const result = validateMeetingDraft({
    title: row.title,
    meetingType: row.meeting_type,
    meetingDate: row.meeting_date,
    startLocalTime: row.start_local_time,
    endLocalTime: row.end_local_time,
    timezone: row.timezone,
    programLanguage: row.program_language,
    sections,

    importSource: row.import_source_json === null
     ? undefined
     : JSON.parse(row.import_source_json),
  });

  if (!result.ok) corrupt();

  return result.value;
}

function readMeeting(
  db: SQLiteDatabase,
  id: string,
): SavedMeeting | null {
  const row = db.getFirstSync<MeetingRow>(
    'SELECT * FROM local_meeting_drafts WHERE id = ?',
    id,
  );

  if (!row) return null;

  const sections = db.getAllSync<SectionRow>(
    `SELECT id, title FROM local_meeting_sections
     WHERE meeting_id = ? ORDER BY position`,
    id,
  );

  const parts = db.getAllSync<PartRow>(
    `SELECT id, section_id, title, kind,
            duration_seconds, is_timed
     FROM local_meeting_parts
     WHERE meeting_id = ? ORDER BY position`,
    id,
  );

  const sectionIds = new Set(sections.map(section => section.id));

  for (const part of parts) {
    if (
      !sectionIds.has(part.section_id) ||
      (part.is_timed !== 0 && part.is_timed !== 1)
    ) {
      corrupt();
    }
  }

  const draft = decodeHeader(
    row,
    sections.map(section => ({
      id: section.id,
      title: section.title,
      parts: parts
        .filter(part => part.section_id === section.id)
        .map(part => ({
          id: part.id,
          title: part.title,
          kind: part.kind,
          durationSeconds: part.duration_seconds,
          isTimed: part.is_timed === 1,
        })),
    })),
  );

  return {
    id: row.id,
    revision: row.revision,
    updatedAt: row.updated_at,
    draft,
  };
}

function assignIds(
  db: SQLiteDatabase,
  draft: MeetingDraft,
  current: SavedMeeting | null,
): MeetingDraft {
  const allowedSections = new Set(
    current?.draft.sections.map(section => section.id) ?? [],
  );

  const allowedParts = new Set(
    current?.draft.sections.flatMap(section =>
      section.parts.map(part => part.id),
    ) ?? [],
  );

  const used = new Set<string>();

  function claim(
    id: string | undefined,
    allowed: ReadonlySet<string | undefined>,
  ): string {
    if (id !== undefined && !allowed.has(id)) {
      throw new MeetingStorageError(
        'id',
        'A section or part does not belong to this saved meeting.',
      );
    }

    const assigned = id ?? newId(db);

    if (used.has(assigned)) {
      throw new MeetingStorageError(
        'id',
        'A section or part identifier was repeated.',
      );
    }

    used.add(assigned);
    return assigned;
  }

  return {
    ...draft,
    sections: draft.sections.map(section => ({
      ...section,
      id: claim(section.id, allowedSections),
      parts: section.parts.map(part => ({
        ...part,
        id: claim(part.id, allowedParts),
      })),
    })),
  };
}

function saveMeetingChildren(
  db: SQLiteDatabase,
  meetingId: string,
  draft: MeetingDraft,
): void {
  const partIds = new Set(draft.sections.flatMap(section => section.parts.map(part => part.id)));
  const sectionIds = new Set(draft.sections.map(section => section.id));
  const oldParts = db.getAllSync<{ id: string }>(
    'SELECT id FROM local_meeting_parts WHERE meeting_id = ?', meetingId,
  );
  const oldSections = db.getAllSync<{ id: string }>(
    'SELECT id FROM local_meeting_sections WHERE meeting_id = ?', meetingId,
  );
  for (const part of oldParts) {
    if (partIds.has(part.id)) continue;
    const assigned = db.getFirstSync<{ present: number }>(
      `SELECT 1 AS present FROM local_part_assignments
       WHERE meeting_id = ? AND part_id = ? AND publisher_id IS NOT NULL LIMIT 1`,
      meetingId, part.id,
    );
    if (assigned) {
      throw new MeetingStorageError('assignments', 'Clear this part’s assignments before removing it.');
    }
    db.runSync('DELETE FROM local_part_assignments WHERE meeting_id = ? AND part_id = ?', meetingId, part.id);
    db.runSync('DELETE FROM local_meeting_parts WHERE meeting_id = ? AND id = ?', meetingId, part.id);
  }

  function stagePositions(
    table: 'local_meeting_parts' | 'local_meeting_sections',
    finalMaximum: number,
  ) {
    // Private fixed identifiers only; values remain parameterized.
    const maximum = db.getFirstSync<{ maximum: number }>(
      `SELECT COALESCE(MAX(position), -1) AS maximum FROM ${table} WHERE meeting_id = ?`, meetingId,
    )?.maximum;
    if (maximum === undefined || !Number.isSafeInteger(maximum) || maximum < -1) corrupt();
    if (maximum === -1) return;
    // Staged rows must sit above both old and newly inserted positions.
    const offset = Math.max(maximum, finalMaximum) + 1;
    if (!Number.isSafeInteger(maximum + offset)) corrupt();
    db.runSync(`UPDATE ${table} SET position = position + ? WHERE meeting_id = ?`, offset, meetingId);
  }

  const finalPartMaximum = draft.sections.reduce(
    (maximum, section) => Math.max(maximum, section.parts.length - 1), -1,
  );
  stagePositions('local_meeting_parts', finalPartMaximum);
  stagePositions('local_meeting_sections', draft.sections.length - 1);

  draft.sections.forEach((section, sectionIndex) => {
    const sectionId = section.id;
    if (!sectionId) corrupt();
    const savedSection = db.runSync(
      `INSERT INTO local_meeting_sections (id, meeting_id, position, title) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET position = excluded.position, title = excluded.title
       WHERE local_meeting_sections.meeting_id = excluded.meeting_id`,
      sectionId, meetingId, sectionIndex, section.title,
    );
    if (savedSection.changes !== 1) corrupt();
    section.parts.forEach((part, partIndex) => {
      if (!part.id) corrupt();
      const savedPart = db.runSync(
        `INSERT INTO local_meeting_parts
         (id, meeting_id, section_id, position, title, kind, duration_seconds, is_timed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           section_id = excluded.section_id, position = excluded.position,
           title = excluded.title, kind = excluded.kind,
           duration_seconds = excluded.duration_seconds, is_timed = excluded.is_timed
         WHERE local_meeting_parts.meeting_id = excluded.meeting_id`,
        part.id, meetingId, sectionId, partIndex, part.title,
        part.kind, part.durationSeconds, part.isTimed ? 1 : 0,
      );
      if (savedPart.changes !== 1) corrupt();
    });
  });

  for (const section of oldSections) {
    if (!sectionIds.has(section.id)) {
      db.runSync('DELETE FROM local_meeting_sections WHERE meeting_id = ? AND id = ?', meetingId, section.id);
    }
  }
}

export const localMeetingRepository: MeetingRepository = {
  list() {
    return safely(() => {
      const db = getAppDatabase();

      return db.getAllSync<MeetingRow>(
        `SELECT * FROM local_meeting_drafts
         ORDER BY meeting_date, id`,
      ).map((row): MeetingSummary => {
        const draft = decodeHeader(row, []);

        return {
          id: row.id,
          revision: row.revision,
          title: draft.title,
          meetingDate: draft.meetingDate,
          meetingType: draft.meetingType,
        };
      });
    });
  },

  get(id) {
    return safely(() => {
      const db = getAppDatabase();
      let result: SavedMeeting | null = null;

      db.withTransactionSync(() => {
        result = readMeeting(db, id);
      });

      return result;
    });
  },

  save(input, target) {
    return safely(() => {
      // Validate again at the persistence boundary.
      const validated = validateMeetingDraft(input);

      if (!validated.ok) {
        throw new MeetingStorageError(
          validated.error.field,
          validated.error.message,
        );
      }

      const db = getAppDatabase();
      let saved: SavedMeeting | null = null;

      db.withTransactionSync(() => {
        requireProfile(db);

        const current = target
          ? readMeeting(db, target.id)
          : null;

        if (
          target &&
          (!current || current.revision !== target.revision)
        ) {
          throw new MeetingStorageError(
            'conflict',
            'This meeting changed or is unavailable. Reopen it before saving.',
          );
        }

        const revision = (current?.revision ?? 0) + 1;

        if (!Number.isSafeInteger(revision)) {
          throw new MeetingStorageError(
            'revision',
            'The meeting version cannot be increased.',
          );
        }

        const draft = assignIds(db, validated.value, current);
        const id = current?.id ?? newId(db);
        const now = Date.now();

                if (!current && draft.importSource) {
          const duplicate = db.getFirstSync<{ id: string }>(
            `SELECT id FROM local_meeting_drafts
             WHERE (
               meeting_date = ?
               AND meeting_type = ?
               AND program_language = ?
             ) OR import_source_json = ?
             LIMIT 1`,
            draft.meetingDate,
            draft.meetingType,
            draft.programLanguage,
            JSON.stringify(draft.importSource),
          );

          if (duplicate) {
            throw new MeetingStorageError(
              'conflict',
              workbookParsingEn.duplicate,
            );
          }
        }

        const scheduleChanged = current !== null && (
          current.draft.meetingDate !== draft.meetingDate ||
          current.draft.startLocalTime !== draft.startLocalTime ||
          (current.draft.endLocalTime ?? null) !==
            (draft.endLocalTime ?? null) ||
          current.draft.timezone !== draft.timezone
        );

        if (scheduleChanged) {
          const publishers = db.getAllSync<{
            publisher_id: string;
          }>(
            `SELECT DISTINCT publisher_id
             FROM local_technical_duties
             WHERE meeting_id = ? AND publisher_id IS NOT NULL`,
            id,
          );

          for (const publisher of publishers) {
            const issue = checkPublisherMeeting(
              db,
              publisher.publisher_id,
              { ...draft, id },
            );

            if (issue) {
              throw new MeetingStorageError(
                issue.field,
                issue.message,
              );
            }
          }
        }

        if (current) {
                    const update = db.runSync(
            `UPDATE local_meeting_drafts
             SET title = ?, meeting_type = ?, meeting_date = ?,
                 start_local_time = ?, end_local_time = ?,
                 timezone = ?, program_language = ?,
                 revision = ?, updated_at = ?
             WHERE id = ? AND revision = ?`,
            draft.title,
            draft.meetingType,
            draft.meetingDate,
            draft.startLocalTime,
            draft.endLocalTime ?? null,
            draft.timezone,
            draft.programLanguage,
            revision,
            now,
            id,
            current.revision,
          );

          if (update.changes !== 1) {
            throw new MeetingStorageError(
              'conflict',
              'The meeting changed before it could be saved.',
            );
          }
        } else {
                    db.runSync(
            `INSERT INTO local_meeting_drafts
             (id, title, meeting_type, meeting_date,
              start_local_time, end_local_time,
              timezone, program_language,
              revision, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            draft.title,
            draft.meetingType,
            draft.meetingDate,
            draft.startLocalTime,
            draft.endLocalTime ?? null,
            draft.timezone,
            draft.programLanguage,
            revision,
            now,
            now,
          );
        }

        saveMeetingChildren(db, id, draft);

        db.runSync(
          `UPDATE local_meeting_drafts
           SET import_source_json = ?
           WHERE id = ?`,
          draft.importSource
            ? JSON.stringify(draft.importSource)
            : null,
          id,
        );

        saved = readMeeting(db, id);

        if (!saved) corrupt();
      });

      if (!saved) {
        throw new Error('The transaction returned no saved meeting.');
      }

      return saved;
    });
  },
};

export { readMeeting as readMeetingForBackup };
export { readMeeting as readMeetingForShare };