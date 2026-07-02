-- ═══════════════════════════════════════════════════════════════════════════
-- SmartzConnect — Schema v6 Addendum
-- Gaps identified by scanning live DB against the Platform Redesign spec.
-- FULLY IDEMPOTENT — safe to run multiple times.
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper: updated_at trigger (re-include, safe) ────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. ACTIVITY FEED (new table)                                            ║
-- ║  Tracks per-user social events for the Activity / Notification Feed      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS activity_feed (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id      uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type text NOT NULL,          -- 'like','comment','follow','repost','mention','reaction','share','call_missed','new_post'
  entity_type   text,                   -- 'post','comment','video_call','message','profile'
  entity_id     text,                   -- UUID or external ID of the entity
  meta          jsonb DEFAULT '{}',     -- extra payload (emoji, excerpt, etc.)
  read          boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- Index for fast per-user feed queries
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id     ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id    ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_entity      ON activity_feed(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_unread      ON activity_feed(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own feed"   ON activity_feed;
DROP POLICY IF EXISTS "System inserts feed"   ON activity_feed;
DROP POLICY IF EXISTS "Users mark feed read"  ON activity_feed;

CREATE POLICY "Users read own feed"
  ON activity_feed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts feed"
  ON activity_feed FOR INSERT
  WITH CHECK (true);   -- service-role inserts on behalf of actors

CREATE POLICY "Users mark feed read"
  ON activity_feed FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. VIDEO CALLS — LiveKit columns (Jitsi remnant migration)              ║
-- ║  The spec removes Jitsi; we add LiveKit-native columns.                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
ALTER TABLE video_calls
  ADD COLUMN IF NOT EXISTS livekit_room   text,           -- LiveKit room name / SID
  ADD COLUMN IF NOT EXISTS livekit_token  text,           -- caller's LiveKit token
  ADD COLUMN IF NOT EXISTS room_type      text DEFAULT 'call',  -- 'call' | 'group' | 'screen_share'
  ADD COLUMN IF NOT EXISTS participants   jsonb DEFAULT '[]',   -- [{user_id, joined_at, left_at}]
  ADD COLUMN IF NOT EXISTS recording_url  text,
  ADD COLUMN IF NOT EXISTS ended_at       timestamptz;

-- Index for active-room lookups
CREATE INDEX IF NOT EXISTS idx_video_calls_livekit_room ON video_calls(livekit_room) WHERE livekit_room IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. STREAM TOKENS — LiveKit room & type support                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
ALTER TABLE stream_tokens
  ADD COLUMN IF NOT EXISTS room_id     text,          -- LiveKit room name for group/conference
  ADD COLUMN IF NOT EXISTS token_type  text DEFAULT 'livestream';  -- 'livestream' | 'call' | 'conference'

CREATE INDEX IF NOT EXISTS idx_stream_tokens_room_id ON stream_tokens(room_id) WHERE room_id IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. NOTIFICATION PREFERENCES — extended OneSignal channels               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
ALTER TABLE notification_preferences
  -- social activity
  ADD COLUMN IF NOT EXISTS push_likes        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_comments     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_follows      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_reposts      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_mentions     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_reactions    boolean DEFAULT true,
  -- calls & live
  ADD COLUMN IF NOT EXISTS push_calls        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_livestreams  boolean DEFAULT true,
  -- marketplace & rides
  ADD COLUMN IF NOT EXISTS push_marketplace  boolean DEFAULT true,
  -- in-app vs push distinction
  ADD COLUMN IF NOT EXISTS in_app_enabled    boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS browser_push      boolean DEFAULT true,
  -- OneSignal external ID (supplement existing onesignal_player_id)
  ADD COLUMN IF NOT EXISTS onesignal_external_id text;

CREATE INDEX IF NOT EXISTS idx_notif_prefs_onesignal_ext ON notification_preferences(onesignal_external_id)
  WHERE onesignal_external_id IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. POSTS — ensure shares_count column exists (schema audit)             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS shares_count  int DEFAULT 0;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. POST SHARES — explicit join table for share tracking                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS post_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type  text DEFAULT 'external',  -- 'repost' | 'external' | 'story'
  created_at  timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id, share_type)
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post   ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user   ON post_shares(user_id);

ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can see shares" ON post_shares;
DROP POLICY IF EXISTS "Users share own"       ON post_shares;
DROP POLICY IF EXISTS "Users delete own"      ON post_shares;

CREATE POLICY "Anyone can see shares" ON post_shares FOR SELECT USING (true);
CREATE POLICY "Users share own"       ON post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own"      ON post_shares FOR DELETE USING (auth.uid() = user_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. CALL PARTICIPANTS — per-participant record for group calls            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- call_participants table already exists per the live DB scan; add LiveKit cols
ALTER TABLE call_participants
  ADD COLUMN IF NOT EXISTS livekit_identity text,
  ADD COLUMN IF NOT EXISTS livekit_sid      text,
  ADD COLUMN IF NOT EXISTS is_muted         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS camera_on        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_screen_sharing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS connection_quality text;   -- 'excellent' | 'good' | 'poor'


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  8. PLATFORM FILES — extend for richer upload metadata                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
ALTER TABLE platform_files
  ADD COLUMN IF NOT EXISTS entity_type  text,   -- 'post' | 'message' | 'profile' | 'marketplace'
  ADD COLUMN IF NOT EXISTS entity_id    text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration_sec  int,   -- for audio/video
  ADD COLUMN IF NOT EXISTS width         int,
  ADD COLUMN IF NOT EXISTS height        int,
  ADD COLUMN IF NOT EXISTS is_public     boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_platform_files_entity ON platform_files(entity_type, entity_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  9. STORAGE BUCKETS — ensure required buckets exist                     ║
-- ║  (Run separately if bucket creation requires dashboard)                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Buckets needed (create in Dashboard → Storage → New Bucket if not present):
--   user-uploads   (public: false)
--   posts          (public: true)
--   marketplace    (public: true)
--   stream-thumbnails (public: true)
--   voice-notes    (public: false)
--   documents      (public: false)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('user-uploads',       'user-uploads',       false, 52428800,  NULL),
  ('posts',              'posts',              true,  52428800,  NULL),
  ('marketplace',        'marketplace',        true,  52428800,  NULL),
  ('stream-thumbnails',  'stream-thumbnails',  true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('voice-notes',        'voice-notes',        false, 10485760,  ARRAY['audio/webm','audio/ogg','audio/mpeg','audio/mp4']),
  ('documents',          'documents',          false, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  10. VERIFICATION                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
SELECT
  'activity_feed'            AS "table",  (SELECT count(*) FROM information_schema.columns WHERE table_name='activity_feed'            AND table_schema='public') AS cols
UNION ALL SELECT
  'post_shares',                           (SELECT count(*) FROM information_schema.columns WHERE table_name='post_shares'             AND table_schema='public')
UNION ALL SELECT
  'video_calls (livekit_room)',             (SELECT count(*) FROM information_schema.columns WHERE table_name='video_calls'            AND table_schema='public' AND column_name='livekit_room')
UNION ALL SELECT
  'stream_tokens (room_id)',                (SELECT count(*) FROM information_schema.columns WHERE table_name='stream_tokens'          AND table_schema='public' AND column_name='room_id')
UNION ALL SELECT
  'notification_preferences (push_calls)',  (SELECT count(*) FROM information_schema.columns WHERE table_name='notification_preferences' AND table_schema='public' AND column_name='push_calls')
UNION ALL SELECT
  'platform_files (entity_type)',           (SELECT count(*) FROM information_schema.columns WHERE table_name='platform_files'         AND table_schema='public' AND column_name='entity_type');
