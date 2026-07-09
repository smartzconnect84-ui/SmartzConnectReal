-- ============================================================
-- Schema v14 — Post reactions, text stories, team_members
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Post Reactions (emoji reactions beyond just Likes) ──────
CREATE TABLE IF NOT EXISTS post_reactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       text NOT NULL CHECK (emoji IN ('❤️','🔥','😂','😮','😢','👏')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON post_reactions(user_id);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own reactions" ON post_reactions;
CREATE POLICY "Users can manage own reactions"
  ON post_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read reactions" ON post_reactions;
CREATE POLICY "Anyone can read reactions"
  ON post_reactions FOR SELECT
  USING (true);

-- ── Stories: add text_content and bg_color columns ──────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'text_content'
  ) THEN
    ALTER TABLE stories ADD COLUMN text_content text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'bg_color'
  ) THEN
    ALTER TABLE stories ADD COLUMN bg_color text DEFAULT 'from-pink-500 to-rose-600';
  END IF;
END
$$;

-- ── Post saves (if not already exists) ──────────────────────
CREATE TABLE IF NOT EXISTS post_saves (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_saves_user_id_idx ON post_saves(user_id);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saves" ON post_saves;
CREATE POLICY "Users can manage own saves"
  ON post_saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Team Members (if not already exists) ────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name      text NOT NULL,
  role           text NOT NULL,
  bio            text,
  photo_url      text,
  emoji          text,
  country        text,
  organization   text,
  skills         text[] DEFAULT '{}',
  linkedin_url   text,
  twitter_url    text,
  joined_year    text,
  display_order  integer DEFAULT 0,
  is_active      boolean DEFAULT true,
  is_advisor     boolean DEFAULT false,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS team_members_display_order_idx ON team_members(display_order);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active members" ON team_members;
CREATE POLICY "Public can read active members"
  ON team_members FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;
CREATE POLICY "Admins can manage team members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'ceo', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'ceo', 'moderator')
    )
  );

-- ── Reaction counts on posts view (optional helper) ──────────
CREATE OR REPLACE VIEW post_reaction_counts AS
SELECT
  post_id,
  emoji,
  COUNT(*) AS count
FROM post_reactions
GROUP BY post_id, emoji;

-- ── Platform settings: ensure banner_enabled exists ──────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'null'
);

INSERT INTO platform_settings (key, value)
VALUES ('banner_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- ── Grants ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON post_reactions TO authenticated;
GRANT SELECT ON post_reaction_counts TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_saves TO authenticated;
GRANT SELECT ON team_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT ON platform_settings TO authenticated;
GRANT SELECT ON platform_settings TO anon;
