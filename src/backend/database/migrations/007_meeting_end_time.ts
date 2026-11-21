export const MEETING_END_TIME_SQL = `
ALTER TABLE local_meeting_drafts
ADD COLUMN end_local_time TEXT;
`.replace(/\r\n/g, '\n');