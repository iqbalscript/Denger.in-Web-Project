-- Supabase twin of 004_lock_legacy_tables.sql.
-- 001 created admin_users (password hashes) and synced_sessions without Row
-- Level Security, so the Supabase Data API could expose them to the anon and
-- authenticated roles. Enable RLS with no policies (deny all for API roles) and
-- revoke their grants. The server connects as the table owner, which RLS does
-- not restrict, so the app is unaffected. Idempotent.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON admin_users, synced_sessions FROM PUBLIC;
REVOKE ALL ON admin_users, synced_sessions FROM anon, authenticated;
