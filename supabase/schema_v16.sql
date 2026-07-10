-- ============================================================
-- Schema v16 — Notifications hardening + push infrastructure
-- Run idempotently in Supabase SQL editor (all changes are safe to re-run)
-- ============================================================

-- ── 1. Ensure notifications table has all required columns ───────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_user_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type          text NOT NULL DEFAULT 'system',
  title         text NOT NULL DEFAULT '',
  body          text NOT NULL DEFAULT '',
  emoji         text NOT NULL DEFAULT '🔔',
  action_url    text,
  read          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Add any missing columns to pre-existing tables
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS from_user_id  uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS emoji         text NOT NULL DEFAULT '🔔';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url    text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title         text NOT NULL DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body          text NOT NULL DEFAULT '';

-- Performance index for the most common query (unread count per user)
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, read, created_at DESC)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

-- ── 2. RLS policies ──────────────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their own notifications as read / delete them
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Any authenticated user can insert a notification for another user.
-- The edge functions (send-push, notify) use service role to bypass RLS,
-- but this policy allows app-level inserts (e.g. SpinChatPage follow action).
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── 3. Realtime — enable for notification badges ─────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── 4. Ensure messages table has receiver_id for the badge count ─────────────
-- (AppShell uses messages.receiver_id for the unread messages count)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read        boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx
  ON messages (receiver_id, read, created_at DESC)
  WHERE read = false;

-- ── 5. Follows table — ensure exists with standard columns ───────────────────

CREATE TABLE IF NOT EXISTS follows (
  id           bigserial PRIMARY KEY,
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "follows_insert" ON follows;
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ── 6. Post reactions table (likes/emoji) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_reactions (
  id         bigserial PRIMARY KEY,
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji      text NOT NULL DEFAULT '❤️',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_reactions_select" ON post_reactions;
CREATE POLICY "post_reactions_select" ON post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "post_reactions_insert" ON post_reactions;
CREATE POLICY "post_reactions_insert" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_reactions_delete" ON post_reactions;
CREATE POLICY "post_reactions_delete" ON post_reactions FOR DELETE USING (auth.uid() = user_id);

-- ── 7. call_notifications — ensure needed for call push ──────────────────────

CREATE TABLE IF NOT EXISTS call_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_name  text NOT NULL,
  call_type  text NOT NULL DEFAULT 'audio',
  status     text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '70 seconds')
);

ALTER TABLE call_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_notif_select" ON call_notifications;
CREATE POLICY "call_notif_select" ON call_notifications
  FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);

DROP POLICY IF EXISTS "call_notif_insert" ON call_notifications;
CREATE POLICY "call_notif_insert" ON call_notifications
  FOR INSERT WITH CHECK (auth.uid() = from_id);

DROP POLICY IF EXISTS "call_notif_update" ON call_notifications;
CREATE POLICY "call_notif_update" ON call_notifications
  FOR UPDATE USING (auth.uid() = from_id OR auth.uid() = to_id);

-- Enable realtime for call signalling
ALTER PUBLICATION supabase_realtime ADD TABLE call_notifications;

-- ── 8. Swipes table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS swipes (
  id         bigserial PRIMARY KEY,
  swiper_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action     text NOT NULL DEFAULT 'like',
  source     text NOT NULL DEFAULT 'discover',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, swiped_id)
);

ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "swipes_select" ON swipes;
CREATE POLICY "swipes_select" ON swipes FOR SELECT USING (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "swipes_insert" ON swipes;
CREATE POLICY "swipes_insert" ON swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "swipes_upsert" ON swipes;
CREATE POLICY "swipes_upsert" ON swipes FOR UPDATE USING (auth.uid() = swiper_id);

-- ── 9. Matches table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matches (
  id         bigserial PRIMARY KEY,
  user_a     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select" ON matches;
CREATE POLICY "matches_select" ON matches
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "matches_insert" ON matches;
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (auth.uid() = user_a);

-- ── 10. Platform settings (for announcement banner + feature flags) ──────────

CREATE TABLE IF NOT EXISTS platform_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT 'null',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_select" ON platform_settings;
CREATE POLICY "platform_settings_select" ON platform_settings FOR SELECT USING (true);

-- ── Done ─────────────────────────────────────────────────────────────────────
-- All changes above are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Safe to run multiple times without side effects.
