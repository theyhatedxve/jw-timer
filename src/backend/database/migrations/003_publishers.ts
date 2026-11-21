// Once applied, keep this migration unchanged.
// Future catalog/schema changes require a new migration.
export const PUBLISHER_SQL = `
CREATE TABLE local_publishers (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL
    CHECK (length(trim(display_name)) BETWEEN 1 AND 100),
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_local_publishers_name
  ON local_publishers(display_name COLLATE NOCASE, id);

CREATE INDEX idx_local_publishers_active
  ON local_publishers(is_active, id);

CREATE TABLE local_publisher_roles (
  publisher_id TEXT NOT NULL
    REFERENCES local_publishers(id) ON DELETE RESTRICT,
  role_code TEXT NOT NULL CHECK (
    role_code IN (
      'prayer', 'chairperson', 'bible-reading',
      'demonstration', 'assistant', 'talk',
      'study', 'reader', 'sound',
      'microphones', 'timer', 'attendant'
    )
  ),
  PRIMARY KEY (publisher_id, role_code)
);

CREATE INDEX idx_local_publisher_roles_role
  ON local_publisher_roles(role_code, publisher_id);
`.replace(/\r\n/g, '\n');