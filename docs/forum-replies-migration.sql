-- Migrasi balasan/komentar forum. IDEMPOTEN: aman dijalankan berulang kali.
--
-- Untuk apa: database yang hanya punya tabel forum_posts (migrasi 001) belum punya
-- tabel/kolom balasan. Tanpa ini POST/GET /api/forum/[id]/replies menjawab
-- "Fitur balasan belum tersedia." (HTTP 503).
--
-- Cara pakai di Supabase: Dashboard -> SQL Editor -> New query -> tempel seluruh
-- isi file ini -> Run. Setelah itu tidak perlu redeploy.
-- Isi sama dengan docs/drafts/forum-thread-replies.sql, hanya dibuat idempoten dan
-- REVOKE untuk role anon/authenticated dijalankan bila role itu ada (Supabase).

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

-- Browser tidak boleh mengakses tabel forum langsung; semua akses lewat server.
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON forum_posts, forum_replies, forum_thread_participants, forum_reply_reports FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON forum_posts, forum_replies, forum_thread_participants, forum_reply_reports FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON forum_posts, forum_replies, forum_thread_participants, forum_reply_reports FROM authenticated;
  END IF;
END $$;
