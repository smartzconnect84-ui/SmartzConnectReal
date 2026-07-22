-- ============================================================
-- Schema v21: YouTube Live streaming (replaces Mux columns)
-- ============================================================
-- Run this migration in the Supabase SQL editor or via psql.
-- It is additive — existing data is preserved.
-- ============================================================

-- ── 1. Update tv_channels: drop Mux columns, add YouTube columns ──────────────

ALTER TABLE tv_channels
  ADD COLUMN IF NOT EXISTS youtube_video_id    text,
  ADD COLUMN IF NOT EXISTS youtube_channel_id  text;

-- Migrate any data from mux_playback_id → youtube_video_id if needed
-- (only relevant if you had data in mux_playback_id; leave as-is otherwise)
-- UPDATE tv_channels SET youtube_video_id = playback_url WHERE mux_playback_id IS NOT NULL;

-- Drop Mux-specific columns (comment out if you want to keep them temporarily)
ALTER TABLE tv_channels
  DROP COLUMN IF EXISTS mux_stream_id,
  DROP COLUMN IF EXISTS mux_playback_id;

-- Remove Mux-specific URL columns (RTMPS was Mux-specific; YouTube uses its own ingest)
-- Keep stream_key, playback_url as generic fields
-- Keep rtmp_url, srt_url, whip_url for future provider flexibility (or drop if not needed)

-- ── 2. Create tv_comments table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tv_comments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id       uuid        NOT NULL REFERENCES tv_channels(id) ON DELETE CASCADE,
  broadcast_id     text,                          -- YouTube video ID or session ID
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id        uuid        REFERENCES tv_comments(id) ON DELETE CASCADE,
  content          text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  is_pinned        boolean     NOT NULL DEFAULT false,
  is_deleted       boolean     NOT NULL DEFAULT false,
  is_admin_hidden  boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tv_comments_channel_id_idx    ON tv_comments (channel_id);
CREATE INDEX IF NOT EXISTS tv_comments_broadcast_id_idx  ON tv_comments (broadcast_id);
CREATE INDEX IF NOT EXISTS tv_comments_parent_id_idx     ON tv_comments (parent_id);
CREATE INDEX IF NOT EXISTS tv_comments_user_id_idx       ON tv_comments (user_id);
CREATE INDEX IF NOT EXISTS tv_comments_created_at_idx    ON tv_comments (created_at DESC);
CREATE INDEX IF NOT EXISTS tv_comments_pinned_idx        ON tv_comments (channel_id, is_pinned) WHERE is_pinned = true;

-- ── 3. Create tv_comment_reactions table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tv_comment_reactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid        NOT NULL REFERENCES tv_comments(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS tv_comment_reactions_comment_id_idx ON tv_comment_reactions (comment_id);
CREATE INDEX IF NOT EXISTS tv_comment_reactions_user_id_idx    ON tv_comment_reactions (user_id);

-- ── 4. Create tv_stream_reactions table (floating emoji reactions on stream) ──

CREATE TABLE IF NOT EXISTS tv_stream_reactions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   uuid        NOT NULL REFERENCES tv_channels(id) ON DELETE CASCADE,
  broadcast_id text,
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji        text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tv_stream_reactions_channel_id_idx   ON tv_stream_reactions (channel_id);
CREATE INDEX IF NOT EXISTS tv_stream_reactions_broadcast_id_idx ON tv_stream_reactions (broadcast_id);

-- ── 5. Create tv_muted_users table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tv_muted_users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  uuid        NOT NULL REFERENCES tv_channels(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  muted_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS tv_muted_users_channel_id_idx ON tv_muted_users (channel_id);
CREATE INDEX IF NOT EXISTS tv_muted_users_user_id_idx    ON tv_muted_users (user_id);

-- ── 6. Create tv_comment_reports table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS tv_comment_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id   uuid        NOT NULL REFERENCES tv_comments(id) ON DELETE CASCADE,
  reporter_id  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS tv_comment_reports_comment_id_idx ON tv_comment_reports (comment_id);

-- ── 7. RLS policies ───────────────────────────────────────────────────────────

-- tv_comments: anyone can read non-deleted, non-hidden; only owners can insert
ALTER TABLE tv_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read visible comments" ON tv_comments;
CREATE POLICY "Public can read visible comments" ON tv_comments
  FOR SELECT USING (
    is_deleted = false AND is_admin_hidden = false
  );

DROP POLICY IF EXISTS "Admins can read all comments" ON tv_comments;
CREATE POLICY "Admins can read all comments" ON tv_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON tv_comments;
CREATE POLICY "Authenticated users can insert comments" ON tv_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM tv_muted_users
      WHERE channel_id = tv_comments.channel_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update comments" ON tv_comments;
CREATE POLICY "Admins can update comments" ON tv_comments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can soft-delete own comments" ON tv_comments;
CREATE POLICY "Users can soft-delete own comments" ON tv_comments
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    is_deleted = true AND is_admin_hidden = is_admin_hidden AND is_pinned = is_pinned
  );

-- tv_comment_reactions
ALTER TABLE tv_comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reactions" ON tv_comment_reactions;
CREATE POLICY "Anyone can read reactions" ON tv_comment_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can react" ON tv_comment_reactions;
CREATE POLICY "Authenticated users can react" ON tv_comment_reactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reactions" ON tv_comment_reactions;
CREATE POLICY "Users can delete own reactions" ON tv_comment_reactions
  FOR DELETE USING (user_id = auth.uid());

-- tv_stream_reactions
ALTER TABLE tv_stream_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read stream reactions" ON tv_stream_reactions;
CREATE POLICY "Anyone can read stream reactions" ON tv_stream_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can send stream reactions" ON tv_stream_reactions;
CREATE POLICY "Authenticated users can send stream reactions" ON tv_stream_reactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- tv_muted_users
ALTER TABLE tv_muted_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage muted users" ON tv_muted_users;
CREATE POLICY "Admins can manage muted users" ON tv_muted_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- tv_comment_reports
ALTER TABLE tv_comment_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can report" ON tv_comment_reports;
CREATE POLICY "Authenticated can report" ON tv_comment_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can read reports" ON tv_comment_reports;
CREATE POLICY "Admins can read reports" ON tv_comment_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ── 8. Enable Realtime on tv_comments ─────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE tv_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE tv_stream_reactions;

-- ── 9. Grant permissions ──────────────────────────────────────────────────────

GRANT SELECT, INSERT ON tv_comments TO anon;
GRANT SELECT, INSERT, UPDATE ON tv_comments TO authenticated;

GRANT SELECT, INSERT, DELETE ON tv_comment_reactions TO authenticated;
GRANT SELECT ON tv_comment_reactions TO anon;

GRANT SELECT, INSERT ON tv_stream_reactions TO authenticated;
GRANT SELECT ON tv_stream_reactions TO anon;

GRANT SELECT, INSERT, DELETE ON tv_muted_users TO authenticated;
GRANT SELECT, INSERT ON tv_comment_reports TO authenticated;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Run: psql $DATABASE_URL -f schema_v21_youtube_streaming.sql
