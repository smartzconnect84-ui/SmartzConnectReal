-- ══════════════════════════════════════════════════════════════════════════
-- Schema v11: SmartzTV Creator Studio & Chat reliability
-- Safe additive migration — all changes use IF NOT EXISTS / IF EXISTS
-- ══════════════════════════════════════════════════════════════════════════

-- ── stream_comments (ensure exists) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_comments (
  id           BIGSERIAL PRIMARY KEY,
  stream_id    TEXT NOT NULL,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_deleted   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stream_comments_stream_idx ON stream_comments(stream_id, created_at DESC);

-- ── stream_gifts (ensure exists) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_gifts (
  id          BIGSERIAL PRIMARY KEY,
  stream_id   TEXT NOT NULL,
  sender_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  gift_type   TEXT NOT NULL,
  gift_emoji  TEXT,
  coins_cost  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stream_gifts_stream_idx ON stream_gifts(stream_id, created_at DESC);

-- ── stream_tokens (cache for stream JWT tokens) ───────────────────────────
CREATE TABLE IF NOT EXISTS stream_tokens (
  user_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── livestreams: add missing columns if not present ───────────────────────
DO $$
BEGIN
  -- moderation_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='livestreams' AND column_name='moderation_status'
  ) THEN
    ALTER TABLE livestreams ADD COLUMN moderation_status TEXT DEFAULT 'approved'
      CHECK (moderation_status IN ('pending','approved','rejected'));
  END IF;

  -- description column for admin notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='livestreams' AND column_name='description'
  ) THEN
    ALTER TABLE livestreams ADD COLUMN description TEXT;
  END IF;

  -- tags column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='livestreams' AND column_name='tags'
  ) THEN
    ALTER TABLE livestreams ADD COLUMN tags TEXT[];
  END IF;

  -- is_admin_created flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='livestreams' AND column_name='is_admin_created'
  ) THEN
    ALTER TABLE livestreams ADD COLUMN is_admin_created BOOLEAN DEFAULT FALSE;
  END IF;

  -- invited_creator_id (admin can assign a creator)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='livestreams' AND column_name='invited_creator_id'
  ) THEN
    ALTER TABLE livestreams ADD COLUMN invited_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- scheduled_at for future streams
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='livestreams' AND column_name='scheduled_at'
  ) THEN
    ALTER TABLE livestreams ADD COLUMN scheduled_at TIMESTAMPTZ;
  END IF;
END;
$$;

-- ── RLS policies ─────────────────────────────────────────────────────────
ALTER TABLE stream_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_tokens ENABLE ROW LEVEL SECURITY;

-- stream_comments: anyone authenticated can read, owners can insert/soft-delete
DROP POLICY IF EXISTS "stream_comments_select" ON stream_comments;
CREATE POLICY "stream_comments_select" ON stream_comments
  FOR SELECT USING (is_deleted = FALSE);

DROP POLICY IF EXISTS "stream_comments_insert" ON stream_comments;
CREATE POLICY "stream_comments_insert" ON stream_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "stream_comments_update" ON stream_comments;
CREATE POLICY "stream_comments_update" ON stream_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- stream_gifts: authenticated users can read and insert
DROP POLICY IF EXISTS "stream_gifts_select" ON stream_gifts;
CREATE POLICY "stream_gifts_select" ON stream_gifts
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "stream_gifts_insert" ON stream_gifts;
CREATE POLICY "stream_gifts_insert" ON stream_gifts
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- stream_tokens: user can read/write own token
DROP POLICY IF EXISTS "stream_tokens_own" ON stream_tokens;
CREATE POLICY "stream_tokens_own" ON stream_tokens
  FOR ALL USING (auth.uid() = user_id);

-- livestreams: creators can update/delete their own streams
DROP POLICY IF EXISTS "livestreams_owner_update" ON livestreams;
CREATE POLICY "livestreams_owner_update" ON livestreams
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "livestreams_owner_delete" ON livestreams;
CREATE POLICY "livestreams_owner_delete" ON livestreams
  FOR DELETE USING (auth.uid() = creator_id);

-- ── increment_gifts_earned RPC (ensure exists) ────────────────────────────
CREATE OR REPLACE FUNCTION increment_gifts_earned(stream_row_id TEXT, amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE livestreams
    SET gifts_earned = COALESCE(gifts_earned, 0) + amount
    WHERE id::TEXT = stream_row_id;
END;
$$;

-- ── Realtime replication for stream_comments ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'stream_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stream_comments;
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;
