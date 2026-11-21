import type { SQLiteDatabase } from 'expo-sqlite';

import {
  checkMeetingOverlap,
  type MeetingSchedule,
} from '../../domain/assignments/meetingOverlap';

import { meetingConflictEn } from '../../../constants/strings/meetingConflictEn';

interface ScheduleRow {
  id: string;
  title: string;
  meeting_date: string;
  start_local_time: string | null;
  end_local_time: string | null;
  timezone: string;
}

export interface MeetingConflictIssue {
  readonly field: 'conflict' | 'schedule';
  readonly message: string;
}

export function checkPublisherMeeting(
  db: SQLiteDatabase,
  publisherId: string,
  target: MeetingSchedule,
): MeetingConflictIssue | null {
  const rows = db.getAllSync<ScheduleRow>(
    `SELECT DISTINCT
       m.id, m.title, m.meeting_date,
       m.start_local_time, m.end_local_time, m.timezone
     FROM local_meeting_drafts m
     JOIN local_technical_duties d ON d.meeting_id = m.id
     WHERE d.publisher_id = ? AND m.id <> ?
     ORDER BY m.meeting_date, m.id`,
    publisherId,
    target.id,
  );

  const others: MeetingSchedule[] = rows.map(row => ({
    id: row.id,
    title: row.title,
    meetingDate: row.meeting_date,
    startLocalTime: row.start_local_time,
    endLocalTime: row.end_local_time,
    timezone: row.timezone,
  }));

  const result = checkMeetingOverlap(target, others);

  if (result.kind === 'clear') return null;

  const title = result.meetingId === target.id
    ? target.title
    : others.find(meeting => meeting.id === result.meetingId)
      ?.title ?? 'Saved meeting';

  return result.kind === 'conflict'
    ? {
        field: 'conflict',
        message: meetingConflictEn.overlap(title),
      }
    : {
        field: 'schedule',
        message: meetingConflictEn.unverified(title),
      };
}
