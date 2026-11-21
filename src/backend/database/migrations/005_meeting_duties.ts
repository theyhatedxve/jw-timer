export const MEETING_DUTY_SQL = `
CREATE TABLE local_meeting_duties (
  meeting_id TEXT NOT NULL
    REFERENCES local_meeting_drafts(id) ON DELETE RESTRICT,
  duty_key TEXT NOT NULL CHECK (
    duty_key IN (
      'sound',
      'timer',
      'attendant',
      'microphone-left',
      'microphone-right'
    )
  ),
  publisher_id TEXT
    REFERENCES local_publishers(id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (meeting_id, duty_key)
);

CREATE INDEX idx_local_meeting_duties_publisher
  ON local_meeting_duties(publisher_id);
`.replace(/\r\n/g, '\n');