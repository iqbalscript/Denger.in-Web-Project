-- Dengar.in — forum thread replies (balasan/komentar cerita forum).
-- Run via: npm run db:migrate (reads DATABASE_URL). Applied after 001/002 in
-- filename order by services/persistence/scripts/migrate.ts, which has no
-- tracking table and re-runs every file: this file MUST stay idempotent.
--
-- Without it, POST/GET /api/forum/[postId]/replies answers 503 ("Fitur balasan
-- belum tersedia.") — see apps/web/src/lib/api/replySchema.ts.
-- Supabase twin: supabase/migrations/20261014000000_forum_replies.sql (same
-- schema + RLS and anon/authenticated REVOKEs). Keep both in sync; see README.md.

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reply_state TEXT NOT NULL DEFAULT 'open'
  CHECK (reply_state IN ('open', 'locked'));

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  parent_reply_id UUID NULL,
  author_alias TEXT NOT NULL CHECK (char_length(author_alias) BETWEEN 3 AND 160),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 3 AND 800),
  moderation_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (moderation_status IN ('pending_review', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at TIMESTAMPTZ NULL,
  UNIQUE (id, story_id),
  CONSTRAINT forum_replies_parent_same_story_fkey
    FOREIGN KEY (parent_reply_id, story_id) REFERENCES forum_replies(id, story_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS forum_thread_participants (
  story_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  participant_key_hash TEXT NOT NULL,
  alias TEXT NOT NULL CHECK (char_length(alias) BETWEEN 3 AND 160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, participant_key_hash),
  UNIQUE (story_id, alias)
);

CREATE TABLE IF NOT EXISTS forum_reply_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('harassment_or_bullying', 'self_harm_or_dangerous_advice', 'contact_or_privacy', 'scam_or_spam', 'impersonation', 'other_safety')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_story_status_created ON forum_replies (story_id, moderation_status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies (parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_reports_status_created ON forum_reply_reports (status, created_at ASC);

-- Plain PostgreSQL: no anon/authenticated roles and no Data API. Mirror 002 and
-- only strip the implicit PUBLIC grant; the app connects as the table owner.
REVOKE ALL ON forum_replies, forum_thread_participants, forum_reply_reports FROM PUBLIC;
