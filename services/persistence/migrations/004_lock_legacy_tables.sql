-- Close default PUBLIC access on the tables created in 001 (admin_users holds
-- password hashes; synced_sessions holds legacy encrypted backups). The app
-- connects as the table owner, so it keeps full access. Idempotent.
REVOKE ALL ON admin_users, synced_sessions FROM PUBLIC;
