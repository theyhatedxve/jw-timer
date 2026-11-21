import { getAppDatabase } from '../appDatabase';
import { readMeetingForShare } from './meetingRepository';
import { parseStoredProfile } from '../../domain/profile/profile';
import {
  isMeetingDutyKey,
  MEETING_DUTY_SLOTS,
} from '../../domain/assignments/meetingDuty';
import {
  parseSharedSchedule,
  SHARED_SCHEDULE_LIMITS,
  type SharedMeeting,
} from '../../domain/devices/sharedSchedule';

export function exportSchedule(congregationId: string): string {
  const db = getAppDatabase();
  let serialized = '';

  db.withTransactionSync(() => {
    const row = db.getFirstSync<{ value_json: string }>(
      'SELECT value_json FROM app_preferences WHERE key = ?',
      'local_profile',
    );

    if (!row) throw new Error('Profile unavailable');

    const profile = parseStoredProfile(JSON.parse(row.value_json));

    if (
      !profile.ok ||
      profile.value.congregationId !== congregationId
    ) {
      throw new Error('Profile changed');
    }

    const rows = db.getAllSync<{ id: string }>(
      `SELECT id FROM local_meeting_drafts
       ORDER BY meeting_date, id LIMIT ?`,
      SHARED_SCHEDULE_LIMITS.meetings + 1,
    );

    if (rows.length > SHARED_SCHEDULE_LIMITS.meetings) {
      throw new Error('Too many meetings for this transfer');
    }

    const meetings = rows.map(({ id }): SharedMeeting => {
      const saved = readMeetingForShare(db, id);

      if (!saved) throw new Error('Meeting unavailable');

      const dutyRows = db.getAllSync<{
        duty_key: string;
        publisher_id: string | null;
        publisher_name: string | null;
      }>(
        `SELECT d.duty_key, d.publisher_id,
                p.display_name AS publisher_name
         FROM local_technical_duties d
         LEFT JOIN local_publishers p ON p.id = d.publisher_id
         WHERE d.meeting_id = ?`,
        id,
      );

      for (const duty of dutyRows) {
        if (
          !isMeetingDutyKey(duty.duty_key) ||
          (
            duty.publisher_id !== null &&
            duty.publisher_name === null
          )
        ) {
          throw new Error('Invalid saved duty');
        }
      }

      const draft = saved.draft;

      return {
        id,
        revision: saved.revision,
        draft: {
          title: draft.title,
          meetingType: draft.meetingType,
          meetingDate: draft.meetingDate,
          startLocalTime: draft.startLocalTime,
          endLocalTime: draft.endLocalTime ?? null,
          timezone: draft.timezone,
          programLanguage: draft.programLanguage,
          sections: draft.sections.map(section => ({
            id: section.id,
            title: section.title,
            parts: section.parts.map(part => ({
              id: part.id,
              title: part.title,
              kind: part.kind,
              durationSeconds: part.durationSeconds,
              isTimed: part.isTimed,
            })),
          })),
        },
        duties: MEETING_DUTY_SLOTS.map(slot => {
          const duty = dutyRows.find(row => row.duty_key === slot.key);

          return {
            key: slot.key,
            publisherName: duty?.publisher_name ?? null,
          };
        }),
      };
    });

    serialized = JSON.stringify(parseSharedSchedule({
      version: 1,
      congregationId,
      createdAt: Date.now(),
      meetings,
    }));
  });

  return serialized;
}