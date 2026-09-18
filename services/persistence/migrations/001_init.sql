-- Dengar.in — initial backend schema (Sprint 2+)
-- Run via: npm run db:migrate (reads DATABASE_URL)
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS forum_posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_pseudonym   TEXT NOT NULL,
  domain             TEXT NOT NULL,
  title              TEXT NOT NULL,
  body               TEXT NOT NULL,
  moderation_status  TEXT NOT NULL DEFAULT 'pending_review'
                       CHECK (moderation_status IN ('pending_review', 'approved', 'rejected')),
  support_count      INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_status_created
  ON forum_posts (moderation_status, created_at DESC);

-- Opaque, client-encrypted blobs for opt-in cross-device sync. The server
-- never stores the 12-word recovery mnemonic itself, only a hash of it.
CREATE TABLE IF NOT EXISTS synced_sessions (
  mnemonic_hash   TEXT PRIMARY KEY,
  encrypted_blob  TEXT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Operator/moderator accounts only — never an end-user table. Dengar.in's
-- anonymous users never authenticate (docs/SAFETY.md, Zero Unnecessary PII).
CREATE TABLE IF NOT EXISTS admin_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
