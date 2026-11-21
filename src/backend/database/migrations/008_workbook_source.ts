export const WORKBOOK_SOURCE_SQL = `
ALTER TABLE local_meeting_drafts
ADD COLUMN import_source_json TEXT;
`.replace(/\r\n/g, '\n');