-- Additive v2 backup store. Legacy synced_sessions remains readable.
CREATE TABLE IF NOT EXISTS synced_sessions_v2 (
  backup_id TEXT PRIMARY KEY,
  encrypted_blob TEXT NOT NULL,
  write_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE synced_sessions_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON synced_sessions_v2 FROM PUBLIC;
REVOKE ALL ON synced_sessions_v2 FROM anon, authenticated;
