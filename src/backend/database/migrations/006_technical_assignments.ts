export const TECHNICAL_ASSIGNMENT_SQL = `
CREATE TABLE local_publisher_roles_v6 (
  publisher_id TEXT NOT NULL
    REFERENCES local_publishers(id) ON DELETE RESTRICT,
  role_code TEXT NOT NULL CHECK (
    role_code IN (
      'prayer', 'chairperson', 'bible-reading',
      'demonstration', 'assistant', 'talk',
      'study', 'reader', 'sound', 'microphones',
      'timer', 'attendant', 'laptop',
      'microphone-adjuster'
    )
  ),
  PRIMARY KEY (publisher_id, role_code)
);

INSERT INTO local_publisher_roles_v6
  (publisher_id, role_code)
SELECT publisher_id, role_code
FROM local_publisher_roles;

DROP TABLE local_publisher_roles;

ALTER TABLE local_publisher_roles_v6
  RENAME TO local_publisher_roles;

CREATE INDEX idx_local_publisher_roles_role
  ON local_publisher_roles(role_code, publisher_id);

CREATE TABLE legacy_part_assignments_v6 AS
  SELECT * FROM local_part_assignments;

DELETE FROM local_part_assignments;

CREATE TABLE local_technical_duties (
  meeting_id TEXT NOT NULL
    REFERENCES local_meeting_drafts(id) ON DELETE RESTRICT,
  duty_key TEXT NOT NULL CHECK (
    duty_key IN (
      'mic-server',
      'sound-operator',
      'laptop-operator',
      'microphone-adjuster'
    )
  ),
  publisher_id TEXT
    REFERENCES local_publishers(id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (meeting_id, duty_key)
);

CREATE INDEX idx_local_technical_duties_publisher
  ON local_technical_duties(publisher_id);

INSERT INTO local_technical_duties
  (meeting_id, duty_key, publisher_id, revision, updated_at)
SELECT meeting_id, 'sound-operator',
       publisher_id, revision, updated_at
FROM local_meeting_duties
WHERE duty_key = 'sound';
`.replace(/\r\n/g, '\n');
