export const ASSIGNMENT_SQL = `
CREATE UNIQUE INDEX idx_local_parts_assignment_parent
  ON local_meeting_parts(id, meeting_id);

CREATE TABLE local_part_assignments (
  meeting_id TEXT NOT NULL,
  part_id TEXT NOT NULL,
  role_code TEXT NOT NULL CHECK (
    role_code IN (
      'prayer', 'chairperson', 'bible-reading',
      'demonstration', 'assistant', 'talk',
      'study', 'reader', 'sound',
      'microphones', 'timer', 'attendant'
    )
  ),
  publisher_id TEXT
    REFERENCES local_publishers(id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (meeting_id, part_id, role_code),
  FOREIGN KEY (part_id, meeting_id)
    REFERENCES local_meeting_parts(id, meeting_id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_local_assignments_person_part
  ON local_part_assignments(meeting_id, part_id, publisher_id)
  WHERE publisher_id IS NOT NULL;

CREATE INDEX idx_local_assignments_publisher
  ON local_part_assignments(publisher_id);
`.replace(/\r\n/g, '\n');
