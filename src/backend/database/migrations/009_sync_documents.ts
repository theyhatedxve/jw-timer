// Append-only migration. Legacy drafts and their IDs are preserved.
export const SYNC_DOCUMENT_SQL = `
CREATE TABLE local_sync_documents (
  local_scope TEXT PRIMARY KEY NOT NULL CHECK(length(local_scope) = 32),
  owner_fingerprint TEXT,
  revision INTEGER NOT NULL CHECK(revision >= 1),
  document_json TEXT NOT NULL CHECK(length(document_json) <= 33554432),
  updated_at INTEGER NOT NULL CHECK(updated_at >= 0)
);
`.replace(/\r\n/g, '\n');
