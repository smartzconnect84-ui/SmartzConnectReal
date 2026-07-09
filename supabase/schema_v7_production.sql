-- ═══════════════════════════════════════════════════════════════════════════
-- SmartzConnect — Schema v7 Production Addendum
-- Covers ALL gaps from v1–v6: new tables, missing columns, realtime, RLS,
-- storage buckets, triggers, and seed data.
-- FULLY IDEMPOTENT — safe to run multiple times on any state.
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
--    OR:  psql $DATABASE_URL -f schema_v7_production.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Helper: updated_at trigger (idempotent) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.apply_updated_at(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I
     FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at()', tbl, tbl);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1 — PROFILES (ensure all columns exist)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          text UNIQUE,
  full_name         text,
  avatar_url        text,
  cover_url         text,
  bio               text,
  location          text,
  city              text,
  country           text,
  age               int,
  date_of_birth     date,
  gender            text,
  occupation        text,
  education         text,
  relationship_goal text,
  languages         text[],
  interests         text[],
  height_cm         int,
  role              text DEFAULT 'user' CHECK (role IN ('user','admin','ceo')),
  is_verified       boolean DEFAULT false,
  is_vip            boolean DEFAULT false,
  is_premium        boolean DEFAULT false,
  is_online         boolean DEFAULT false,
  last_seen         timestamptz,
  push_token        text,
  language_pref     text DEFAULT 'en',
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free','premium','vip')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Add any missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role              text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city              text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth     date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation        text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_goal text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages         text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests         text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm         int;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_vip            boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium        boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online         boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen         timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token        text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_pref     text DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_country_idx  ON public.profiles(country);
CREATE INDEX IF NOT EXISTS profiles_online_idx   ON public.profiles(is_online, last_seen DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);                       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('profiles');

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    now(), now()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2 — USERS (admin panel extended table)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
  id                bigserial PRIMARY KEY,
  auth_id           uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text UNIQUE NOT NULL,
  full_name         text,
  country           text,
  phone             text,
  role              text DEFAULT 'user' CHECK (role IN ('user','admin','superadmin','moderator','support')),
  subscription_tier text DEFAULT 'free',
  email_verified    boolean DEFAULT false,
  is_active         boolean DEFAULT true,
  is_banned         boolean DEFAULT false,
  is_verified       boolean DEFAULT false,
  ban_reason        text,
  last_login        timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason    text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login    timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS users_email_idx  ON public.users(email);
CREATE INDEX IF NOT EXISTS users_active_idx ON public.users(is_active, is_banned);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (auth.uid() = auth_id);  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = auth_id);  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('users');

CREATE OR REPLACE FUNCTION public.handle_new_user_extended()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users(auth_id, email, full_name, created_at, updated_at)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    now(), now())
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created_extended ON auth.users;
CREATE TRIGGER on_auth_user_created_extended
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_extended();

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3 — ADMIN USERS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  full_name  text,
  role       text DEFAULT 'moderator' CHECK (role IN ('superadmin','admin','moderator','support')),
  status     text DEFAULT 'active'    CHECK (status IN ('active','inactive','suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "admin_users_select_self" ON public.admin_users FOR SELECT USING (auth.uid() = auth_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('admin_users');

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4 — DATING / SWIPE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.likes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  liked_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_super_like boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);
CREATE INDEX IF NOT EXISTS likes_liker_idx ON public.likes(liker_id);
CREATE INDEX IF NOT EXISTS likes_liked_idx ON public.likes(liked_id);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = liker_id);                         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "likes_select_own" ON public.likes FOR SELECT USING (auth.uid() = liker_id OR auth.uid() = liked_id);     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = liker_id);                              EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.swipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  swiped_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  swiped_name text,
  action      text NOT NULL CHECK (action IN ('like','pass','super_like')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(swiper_id, swiped_id)
);
CREATE INDEX IF NOT EXISTS swipes_swiper_idx ON public.swipes(swiper_id, created_at DESC);
CREATE INDEX IF NOT EXISTS swipes_action_idx ON public.swipes(swiper_id, action);
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "swipes_select_own" ON public.swipes FOR SELECT USING (auth.uid() = swiper_id);                          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "swipes_insert_own" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);                     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "swipes_delete_own" ON public.swipes FOR DELETE USING (auth.uid() = swiper_id);                          EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.matches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status     text DEFAULT 'accepted' CHECK (status IN ('pending','accepted','rejected','blocked')),
  is_active  boolean DEFAULT true,
  liked_by_1 boolean DEFAULT false,
  liked_by_2 boolean DEFAULT false,
  matched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_active  boolean DEFAULT true;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS liked_by_1 boolean DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS liked_by_2 boolean DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS matched_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS matches_user1_idx ON public.matches(user1_id, status);
CREATE INDEX IF NOT EXISTS matches_user2_idx ON public.matches(user2_id, status);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "matches_select_own" ON public.matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "matches_insert_own" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user1_id);                     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "matches_update_own" ON public.matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5 — SOCIAL FEED
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.posts (
  id             bigserial PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content        text,
  image_url      text,
  video_url      text,
  location       text,
  type           text DEFAULT 'text' CHECK (type IN ('text','image','video','link','story')),
  likes_count    int DEFAULT 0,
  comments_count int DEFAULT 0,
  shares_count   int DEFAULT 0,
  is_deleted     boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count int DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url    text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location     text;

CREATE INDEX IF NOT EXISTS posts_user_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON public.posts(created_at DESC) WHERE NOT is_deleted;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "posts_select_public" ON public.posts FOR SELECT USING (NOT is_deleted);                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_insert_own"    ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_update_own"    ON public.posts FOR UPDATE USING (auth.uid() = user_id);              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_delete_own"    ON public.posts FOR DELETE USING (auth.uid() = user_id);              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('posts');

CREATE TABLE IF NOT EXISTS public.post_likes (
  id         bigserial PRIMARY KEY,
  post_id    bigint REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);                          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);          EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         bigserial PRIMARY KEY,
  post_id    bigint REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_comments_post_idx ON public.post_comments(post_id, created_at DESC);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (NOT is_deleted);           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Post shares join table
CREATE TABLE IF NOT EXISTS public.post_shares (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    bigint REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_type text DEFAULT 'external',
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id, share_type)
);
CREATE INDEX IF NOT EXISTS idx_post_shares_post ON public.post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user ON public.post_shares(user_id);
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "post_shares_select" ON public.post_shares FOR SELECT USING (true);                        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "post_shares_insert" ON public.post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "post_shares_delete" ON public.post_shares FOR DELETE USING (auth.uid() = user_id);       EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_url  text NOT NULL,
  media_type text DEFAULT 'image' CHECK (media_type IN ('image','video')),
  caption    text,
  views      int DEFAULT 0,
  expires_at timestamptz DEFAULT (now() + INTERVAL '24 hours'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stories_user_idx    ON public.stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_expires_idx ON public.stories(expires_at DESC);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "stories_select_all"  ON public.stories FOR SELECT USING (expires_at > now()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stories_insert_own"  ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stories_delete_own"  ON public.stories FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS follows_follower_idx  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "follows_select_all"  ON public.follows FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "follows_insert_own"  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "follows_delete_own"  ON public.follows FOR DELETE USING (auth.uid() = follower_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Activity Feed
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id      uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  entity_type   text,
  entity_id     text,
  meta          jsonb DEFAULT '{}',
  read          boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id  ON public.activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id ON public.activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_entity   ON public.activity_feed(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_unread   ON public.activity_feed(user_id, read) WHERE read = false;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "activity_feed_read_own"   ON public.activity_feed FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "activity_feed_insert_any" ON public.activity_feed FOR INSERT WITH CHECK (true);             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "activity_feed_update_own" ON public.activity_feed FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6 — MESSAGING
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.messages (
  id          bigserial PRIMARY KEY,
  sender_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     text,
  type        text DEFAULT 'text' CHECK (type IN ('text','image','voice','emoji','file','gif')),
  reaction    text,
  read        boolean DEFAULT false,
  delivered   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_receiver_idx     ON public.messages(receiver_id, read);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE USING (auth.uid() = sender_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Platform files (attachments)
CREATE TABLE IF NOT EXISTS public.platform_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url      text NOT NULL,
  file_name     text,
  file_type     text,
  file_size     int,
  bucket        text,
  entity_type   text,
  entity_id     text,
  thumbnail_url text,
  duration_sec  int,
  width         int,
  height        int,
  is_public     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS entity_type   text;
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS entity_id     text;
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS duration_sec  int;
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS width         int;
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS height        int;
ALTER TABLE public.platform_files ADD COLUMN IF NOT EXISTS is_public     boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_platform_files_entity ON public.platform_files(entity_type, entity_id);
ALTER TABLE public.platform_files ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "files_select_own" ON public.platform_files FOR SELECT USING (auth.uid() = user_id OR is_public); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "files_insert_own" ON public.platform_files FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "files_delete_own" ON public.platform_files FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       text DEFAULT 'system' CHECK (type IN ('match','like','message','group','system','promo','spin','call','payment')),
  title      text NOT NULL,
  body       text,
  emoji      text DEFAULT '🔔',
  action_url text,
  data       jsonb,
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, read, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "notifications_insert_any" ON public.notifications FOR INSERT WITH CHECK (true);             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  push_enabled         boolean DEFAULT true,
  email_enabled        boolean DEFAULT true,
  onesignal_player_id  text,
  onesignal_external_id text,
  push_likes           boolean DEFAULT true,
  push_comments        boolean DEFAULT true,
  push_follows         boolean DEFAULT true,
  push_reposts         boolean DEFAULT true,
  push_mentions        boolean DEFAULT true,
  push_reactions       boolean DEFAULT true,
  push_calls           boolean DEFAULT true,
  push_livestreams     boolean DEFAULT true,
  push_marketplace     boolean DEFAULT true,
  in_app_enabled       boolean DEFAULT true,
  browser_push         boolean DEFAULT true,
  updated_at           timestamptz DEFAULT now()
);
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS onesignal_external_id text;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_likes            boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_comments         boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_follows          boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_reposts          boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_mentions         boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_reactions        boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_calls            boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_livestreams      boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS push_marketplace      boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS in_app_enabled        boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS browser_push          boolean DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_notif_prefs_onesignal ON public.notification_preferences(onesignal_player_id) WHERE onesignal_player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notif_prefs_onesignal_ext ON public.notification_preferences(onesignal_external_id) WHERE onesignal_external_id IS NOT NULL;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "notif_prefs_own" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Push notifications log
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  body        text,
  icon        text,
  url         text,
  provider    text DEFAULT 'onesignal' CHECK (provider IN ('onesignal','fcm','apns','web')),
  external_id text,
  status      text DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','cancelled')),
  sent_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "push_notifs_insert" ON public.push_notifications FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "push_notifs_select" ON public.push_notifications FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 7 — GROUP CHAT
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.group_rooms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  emoji        text DEFAULT '👥',
  avatar_url   text,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public    boolean DEFAULT true,
  member_count int DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE public.group_rooms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "group_rooms_select" ON public.group_rooms FOR SELECT USING (is_public = true);          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "group_rooms_insert" ON public.group_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "group_rooms_update" ON public.group_rooms FOR UPDATE USING (auth.uid() = created_by);    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('group_rooms');

CREATE TABLE IF NOT EXISTS public.group_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   uuid REFERENCES public.group_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role      text DEFAULT 'member' CHECK (role IN ('admin','moderator','member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS group_members_room_idx ON public.group_members(room_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON public.group_members(user_id);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "group_members_select" ON public.group_members FOR SELECT USING (true);                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE USING (auth.uid() = user_id);  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.group_messages (
  id         bigserial PRIMARY KEY,
  room_id    uuid REFERENCES public.group_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    text,
  type       text DEFAULT 'text' CHECK (type IN ('text','image','video','file')),
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_messages_room_idx ON public.group_messages(room_id, created_at DESC);
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "group_messages_select" ON public.group_messages FOR SELECT USING (NOT is_deleted);       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "group_messages_insert" ON public.group_messages FOR INSERT WITH CHECK (auth.uid() = sender_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "group_messages_delete" ON public.group_messages FOR DELETE USING (auth.uid() = sender_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anonymous/Spin Chats
CREATE TABLE IF NOT EXISTS public.anonymous_chats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active  boolean DEFAULT true,
  revealed   boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  ended_at   timestamptz
);
ALTER TABLE public.anonymous_chats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "anon_chats_own" ON public.anonymous_chats FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 8 — VIDEO CALLS (LiveKit)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.video_calls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id         text,
  livekit_room    text,
  livekit_token   text,
  room_type       text DEFAULT 'call',
  participants    jsonb DEFAULT '[]',
  call_type       text DEFAULT 'video' CHECK (call_type IN ('video','audio','spin_video','spin_audio')),
  status          text DEFAULT 'ringing' CHECK (status IN ('ringing','active','ended','missed','rejected')),
  recording_url   text,
  started_at      timestamptz,
  ended_at        timestamptz,
  duration_s      int,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS livekit_room  text;
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS livekit_token text;
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS room_type     text DEFAULT 'call';
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS participants  jsonb DEFAULT '[]';
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS ended_at      timestamptz;
CREATE INDEX IF NOT EXISTS idx_video_calls_livekit_room ON public.video_calls(livekit_room) WHERE livekit_room IS NOT NULL;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "video_calls_own" ON public.video_calls FOR ALL USING (auth.uid() = caller_id OR auth.uid() = callee_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Call participants
CREATE TABLE IF NOT EXISTS public.call_participants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id             uuid REFERENCES public.video_calls(id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  livekit_identity    text,
  livekit_sid         text,
  is_muted            boolean DEFAULT false,
  camera_on           boolean DEFAULT true,
  is_screen_sharing   boolean DEFAULT false,
  connection_quality  text,
  joined_at           timestamptz DEFAULT now(),
  left_at             timestamptz
);
ALTER TABLE public.call_participants ADD COLUMN IF NOT EXISTS livekit_identity   text;
ALTER TABLE public.call_participants ADD COLUMN IF NOT EXISTS livekit_sid        text;
ALTER TABLE public.call_participants ADD COLUMN IF NOT EXISTS is_muted           boolean DEFAULT false;
ALTER TABLE public.call_participants ADD COLUMN IF NOT EXISTS camera_on          boolean DEFAULT true;
ALTER TABLE public.call_participants ADD COLUMN IF NOT EXISTS is_screen_sharing  boolean DEFAULT false;
ALTER TABLE public.call_participants ADD COLUMN IF NOT EXISTS connection_quality text;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;
DO $ BEGIN CREATE POLICY "call_participants_own" ON public.call_participants FOR ALL USING (auth.uid()::text = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 9 — REPORTS & SAFETY
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason      text NOT NULL,
  details     text,
  status      text DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','dismissed')),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "user_reports_insert"     ON public.user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_reports_select_own" ON public.user_reports FOR SELECT USING (auth.uid() = reporter_id);     EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "blocks_insert" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "blocks_select" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "blocks_delete" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text CHECK (target_type IN ('post','message','profile','stream','comment')),
  target_id   text,
  reason      text NOT NULL,
  details     text,
  status      text DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_note  text,
  reviewed_by uuid,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status, created_at DESC);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "reports_insert" ON public.reports FOR SELECT USING (auth.uid() = reporter_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "reports_select" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('reports');

CREATE TABLE IF NOT EXISTS public.safety_rules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  body       text,
  category   text DEFAULT 'general',
  active     boolean DEFAULT true,
  order_num  int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.safety_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "safety_rules_select" ON public.safety_rules FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "safety_rules_manage" ON public.safety_rules FOR ALL USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 10 — MARKETPLACE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title              text NOT NULL,
  description        text,
  price              numeric(12,2) NOT NULL,
  original_price     numeric(12,2),
  currency           text DEFAULT 'USD',
  category           text,
  condition          text DEFAULT 'new' CHECK (condition IN ('new','like_new','good','fair','poor')),
  location           text,
  country            text,
  image_url          text,
  images             text[],
  emoji              text,
  stock_qty          int DEFAULT 1,
  sold_count         int DEFAULT 0,
  views_count        int DEFAULT 0,
  is_active          boolean DEFAULT true,
  is_verified        boolean DEFAULT false,
  is_featured        boolean DEFAULT false,
  moderation_status  text DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected')),
  badge              text,
  tags               text[],
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';
CREATE INDEX IF NOT EXISTS marketplace_category_idx    ON public.marketplace_items(category, is_active);
CREATE INDEX IF NOT EXISTS marketplace_seller_idx      ON public.marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS marketplace_featured_idx    ON public.marketplace_items(is_featured, created_at DESC) WHERE is_active;
CREATE INDEX IF NOT EXISTS marketplace_moderation_idx  ON public.marketplace_items(moderation_status);
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "market_select_active" ON public.marketplace_items FOR SELECT USING (is_active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "market_insert_own"    ON public.marketplace_items FOR INSERT WITH CHECK (auth.uid() = seller_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "market_update_own"    ON public.marketplace_items FOR UPDATE USING (auth.uid() = seller_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "market_delete_own"    ON public.marketplace_items FOR DELETE USING (auth.uid() = seller_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('marketplace_items');

CREATE TABLE IF NOT EXISTS public.wishlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    uuid REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "wishlist_own" ON public.wishlist FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    uuid REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
  quantity   int DEFAULT 1,
  total_usd  numeric(12,2),
  status     text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','refunded')),
  notes      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_buyer_idx  ON public.marketplace_orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_seller_idx ON public.marketplace_orders(seller_id, created_at DESC);
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "orders_select_own" ON public.marketplace_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "orders_insert_own" ON public.marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "orders_update_own" ON public.marketplace_orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('marketplace_orders');

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 11 — SMARTZTV / STREAMING
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.streams (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title             text NOT NULL,
  description       text,
  category          text,
  thumbnail_url     text,
  stream_url        text,
  emoji             text DEFAULT '📺',
  is_live           boolean DEFAULT false,
  is_featured       boolean DEFAULT false,
  viewer_count      int DEFAULT 0,
  peak_viewers      int DEFAULT 0,
  like_count        int DEFAULT 0,
  gift_count        int DEFAULT 0,
  moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('pending','approved','rejected')),
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.streams ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';
CREATE INDEX IF NOT EXISTS streams_live_idx     ON public.streams(is_live, created_at DESC);
CREATE INDEX IF NOT EXISTS streams_category_idx ON public.streams(category);
CREATE INDEX IF NOT EXISTS streams_creator_idx  ON public.streams(creator_id);
CREATE INDEX IF NOT EXISTS streams_moderation_idx ON public.streams(moderation_status);
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "streams_select_all" ON public.streams FOR SELECT USING (true);              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "streams_insert_own" ON public.streams FOR INSERT WITH CHECK (auth.uid() = creator_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "streams_update_own" ON public.streams FOR UPDATE USING (auth.uid() = creator_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('streams');

CREATE TABLE IF NOT EXISTS public.stream_comments (
  id         bigserial PRIMARY KEY,
  stream_id  uuid REFERENCES public.streams(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stream_comments_stream_idx ON public.stream_comments(stream_id, created_at DESC);
ALTER TABLE public.stream_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "stream_comments_select" ON public.stream_comments FOR SELECT USING (NOT is_deleted); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stream_comments_insert" ON public.stream_comments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stream_comments_delete" ON public.stream_comments FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.stream_gifts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id  uuid REFERENCES public.streams(id) ON DELETE CASCADE,
  sender_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_type  text NOT NULL,
  gift_emoji text,
  coins_cost int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stream_gifts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "stream_gifts_insert" ON public.stream_gifts FOR INSERT WITH CHECK (auth.uid() = sender_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stream_gifts_select" ON public.stream_gifts FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.stream_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text,
  room_id    text,
  token_type text DEFAULT 'livestream',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stream_tokens ADD COLUMN IF NOT EXISTS room_id     text;
ALTER TABLE public.stream_tokens ADD COLUMN IF NOT EXISTS token_type  text DEFAULT 'livestream';
-- Safe unique constraint add
DO $$ BEGIN
  ALTER TABLE public.stream_tokens ADD CONSTRAINT stream_tokens_user_room_unique UNIQUE (user_id, room_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.stream_tokens ADD CONSTRAINT stream_tokens_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_stream_tokens_room_id ON public.stream_tokens(room_id) WHERE room_id IS NOT NULL;
ALTER TABLE public.stream_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "stream_tokens_own" ON public.stream_tokens FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 12 — SMARTZRIDE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.drivers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  phone        text,
  email        text,
  vehicle_type text DEFAULT 'standard' CHECK (vehicle_type IN ('standard','comfort','xl','moto')),
  vehicle_name text,
  plate_number text,
  emoji        text DEFAULT '👨🏿',
  avatar_url   text,
  rating       numeric(3,2) DEFAULT 5.0,
  total_trips  int DEFAULT 0,
  is_online    boolean DEFAULT false,
  is_verified  boolean DEFAULT false,
  lat          numeric(10,7),
  lng          numeric(10,7),
  city         text,
  country      text DEFAULT 'Liberia',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drivers_online_idx ON public.drivers(is_online, is_verified);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "drivers_select_all" ON public.drivers FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "drivers_insert_own" ON public.drivers FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "drivers_update_own" ON public.drivers FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('drivers');

CREATE TABLE IF NOT EXISTS public.ride_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id    uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  pickup_addr  text NOT NULL,
  dropoff_addr text NOT NULL,
  pickup_lat   numeric(10,7),
  pickup_lng   numeric(10,7),
  dropoff_lat  numeric(10,7),
  dropoff_lng  numeric(10,7),
  ride_type    text DEFAULT 'standard',
  fare_usd     numeric(8,2),
  distance_km  numeric(6,2),
  duration_min int,
  status       text DEFAULT 'requested' CHECK (status IN ('requested','searching','matched','riding','completed','cancelled')),
  rating       int CHECK (rating BETWEEN 1 AND 5),
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ride_requests_rider_idx  ON public.ride_requests(rider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ride_requests_status_idx ON public.ride_requests(status);
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "rides_select_own" ON public.ride_requests FOR SELECT USING (auth.uid() = rider_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "rides_insert_own" ON public.ride_requests FOR INSERT WITH CHECK (auth.uid() = rider_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "rides_update_own" ON public.ride_requests FOR UPDATE USING (auth.uid() = rider_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('ride_requests');

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 13 — PAYMENTS & SUBSCRIPTIONS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  price_usd   numeric(8,2) DEFAULT 0,
  price_month numeric(8,2) DEFAULT 0,
  badge       text,
  features    text[],
  sort_order  int DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
INSERT INTO public.subscription_plans(id, name, price_usd, price_month, sort_order, badge, features) VALUES
  ('free',    'Free',    0,     0,     1, NULL,  ARRAY['Browse profiles','Basic chat','Social feed']),
  ('premium', 'Premium', 9.99,  9.99,  2, '💕', ARRAY['Unlimited swipes','See who liked you','Priority matching','No ads']),
  ('vip',     'VIP',     24.99, 24.99, 3, '👑', ARRAY['All Premium','Live streaming','Marketplace seller','Ride priority','VIP badge'])
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "plans_select_all" ON public.subscription_plans FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id     text REFERENCES public.subscription_plans(id),
  status      text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','pending')),
  is_active   boolean DEFAULT true,
  started_at  timestamptz DEFAULT now(),
  expires_at  timestamptz,
  payment_ref text,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subs_user_idx ON public.user_subscriptions(user_id, is_active);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "subs_select_own" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "subs_insert_own" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "subs_update_own" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('user_subscriptions');

CREATE TABLE IF NOT EXISTS public.mobile_money_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider       text NOT NULL CHECK (provider IN ('mtn','orange','other')),
  phone_number   text,
  amount_usd     numeric(10,2) NOT NULL,
  amount_local   numeric(12,2),
  currency_local text DEFAULT 'LRD',
  transaction_id text UNIQUE,
  plan_id        text,
  status         text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','refunded')),
  notes          text,
  verified_by    uuid,
  verified_at    timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_idx   ON public.mobile_money_payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.mobile_money_payments(status);
ALTER TABLE public.mobile_money_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "payments_insert_own" ON public.mobile_money_payments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "payments_select_own" ON public.mobile_money_payments FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('mobile_money_payments');

CREATE TABLE IF NOT EXISTS public.invoices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd  numeric(10,2),
  description text,
  status      text DEFAULT 'pending' CHECK (status IN ('pending','paid','void')),
  paid_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "invoices_select_own" ON public.invoices FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payment trigger: auto-activate subscription when confirmed
CREATE OR REPLACE FUNCTION public.expire_old_mobile_payments()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.mobile_money_payments
  SET status = 'rejected'
  WHERE status = 'pending' AND created_at < now() - INTERVAL '15 minutes';
END $$;

CREATE OR REPLACE FUNCTION public.activate_subscription_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, is_active, started_at, expires_at, payment_ref)
    VALUES (NEW.user_id, COALESCE(NEW.plan_id, 'premium'), 'active', true, now(), now() + INTERVAL '30 days', NEW.transaction_id)
    ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET subscription_tier = COALESCE(NEW.plan_id, 'premium') WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, data)
    VALUES (NEW.user_id, 'payment', '🎉 Subscription Activated!',
      'Your ' || initcap(COALESCE(NEW.plan_id, 'Premium')) || ' plan is now active.',
      '💳', jsonb_build_object('plan', NEW.plan_id, 'payment_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_payment_verified ON public.mobile_money_payments;
CREATE TRIGGER on_payment_verified
  AFTER UPDATE ON public.mobile_money_payments
  FOR EACH ROW EXECUTE FUNCTION public.activate_subscription_on_payment();

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 14 — CONTENT & ADMIN
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name  text,
  author_role  text,
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  excerpt      text,
  content      text,
  image_url    text,
  category     text DEFAULT 'General',
  tags         text[],
  featured     boolean DEFAULT false,
  status       text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  views_count  int DEFAULT 0,
  likes_count  int DEFAULT 0,
  read_time    text DEFAULT '5 min read',
  published_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author_role text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS image_url   text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS featured    boolean DEFAULT false;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS likes_count int DEFAULT 0;
CREATE INDEX IF NOT EXISTS blog_posts_status_idx   ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx     ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_featured_idx ON public.blog_posts(featured) WHERE status = 'published';
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "blog_select_published" ON public.blog_posts FOR SELECT USING (status = 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "blog_insert_auth"      ON public.blog_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "blog_update_auth"      ON public.blog_posts FOR UPDATE USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "blog_delete_auth"      ON public.blog_posts FOR DELETE USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('blog_posts');

CREATE TABLE IF NOT EXISTS public.team_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  role          text NOT NULL,
  bio           text,
  photo_url     text,
  emoji         text,
  country       text,
  organization  text,
  skills        text[],
  linkedin_url  text,
  twitter_url   text,
  joined_year   text,
  display_order int DEFAULT 0,
  is_active     boolean DEFAULT true,
  is_advisor    boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_members_order_idx ON public.team_members(display_order) WHERE is_active;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "team_select_active" ON public.team_members FOR SELECT USING (is_active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.team_members(full_name, role, bio, country, skills, display_order, is_advisor)
VALUES (
  'Shedrick K. Nungehn',
  'Founder & CEO',
  'Visionary entrepreneur and founder of SmartzConnect — Africa''s #1 social and dating platform. Born and raised in Liberia, Shedrick built SmartzConnect to connect Africans across the world through technology, love, and community.',
  'Liberia 🇱🇷',
  ARRAY['Leadership','Product Vision','Strategy','Technology','African Markets'],
  1, false
) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  advertiser  text,
  type        text DEFAULT 'banner' CHECK (type IN ('banner','video','sponsored','popup')),
  budget_usd  numeric(10,2) DEFAULT 0,
  spent_usd   numeric(10,2) DEFAULT 0,
  impressions int DEFAULT 0,
  clicks      int DEFAULT 0,
  ctr         numeric(5,4) DEFAULT 0,
  status      text DEFAULT 'pending' CHECK (status IN ('active','paused','pending','ended','rejected')),
  placement   text,
  image_url   text,
  target_url  text,
  target_demo jsonb,
  start_date  date,
  end_date    date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ads_select_active" ON public.ad_campaigns FOR SELECT USING (status = 'active'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ads_insert_auth"   ON public.ad_campaigns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('ad_campaigns');

CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  body            text NOT NULL,
  emoji           text DEFAULT '📢',
  target_segment  text DEFAULT 'all',
  target_country  text,
  target_plan     text,
  recipient_count int DEFAULT 0,
  sent_by         uuid REFERENCES auth.users(id),
  sent_at         timestamptz DEFAULT now()
);
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "broadcasts_insert_auth" ON public.broadcast_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "broadcasts_select_auth" ON public.broadcast_messages FOR SELECT USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.feature_permissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text UNIQUE NOT NULL,
  free_allowed boolean DEFAULT true,
  premium_req  boolean DEFAULT false,
  vip_req      boolean DEFAULT false,
  description  text,
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "feature_perms_select" ON public.feature_permissions FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "feature_perms_manage" ON public.feature_permissions FOR ALL USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
INSERT INTO public.feature_permissions(feature_name, free_allowed, premium_req, vip_req, description) VALUES
  ('discover_swipe',    true,  false, false, 'Basic swipe/discover'),
  ('unlimited_swipes',  false, true,  false, 'Remove daily swipe limit'),
  ('see_who_liked_you', false, true,  false, 'See incoming likes'),
  ('live_streaming',    false, false, true,  'Start a live stream'),
  ('marketplace_sell',  false, true,  false, 'List items in marketplace'),
  ('boost_profile',     false, true,  false, 'Boost profile visibility'),
  ('super_like',        false, true,  false, 'Send super likes'),
  ('read_receipts',     true,  false, false, 'See message read status'),
  ('vip_badge',         false, false, true,  'VIP verification badge')
ON CONFLICT (feature_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  target     text,
  target_id  text,
  metadata   jsonb,
  ip_addr    inet,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx    ON public.audit_logs(user_id);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "audit_insert_auth" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "audit_select_own"  ON public.audit_logs FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 15 — WORLDSTAGE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.worldstage_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  category     text NOT NULL,
  prize        text,
  date_range   text,
  location     text,
  participants int DEFAULT 0,
  status       text DEFAULT 'upcoming' CHECK (status IN ('open','upcoming','ended')),
  emoji        text DEFAULT '🌍',
  color        text DEFAULT 'from-pink-500 to-purple-600',
  description  text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ws_events_status_idx   ON public.worldstage_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS ws_events_category_idx ON public.worldstage_events(category);
ALTER TABLE public.worldstage_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ws_events_select_all" ON public.worldstage_events FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ws_events_manage"     ON public.worldstage_events FOR ALL USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SELECT public.apply_updated_at('worldstage_events');

INSERT INTO public.worldstage_events(id, title, category, prize, date_range, location, participants, status, emoji, color, description) VALUES
  ('a1000000-0000-0000-0000-000000000001','Africa Music Clash 2026','Music','$5,000 + Recording Deal','Jan 15 – Feb 28','Lagos, NG + Online',1240,'open','🎵','from-pink-500 to-purple-600','Open to all African artists. Upload a 60s original track.'),
  ('a1000000-0000-0000-0000-000000000002','SmartzTV Live Battle','Live Streaming','$3,000 + VIP Badge','Feb 1 – Mar 15','Online',876,'open','📺','from-purple-500 to-blue-600','Grow the most viewers in 45 days. Top 3 win.'),
  ('a1000000-0000-0000-0000-000000000003','Pan-African Fashion Week','Fashion','$2,500 + Brand Deal','Mar 1 – Apr 30','Accra, GH + Online',632,'upcoming','👗','from-yellow-500 to-orange-600','Submit your best 3-piece Afrocentric collection.'),
  ('a1000000-0000-0000-0000-000000000004','Tech Innovators Challenge','Tech','$10,000 Grant','Apr 15 – Jun 30','Nairobi, KE + Online',421,'upcoming','💡','from-blue-500 to-cyan-600','Build a solution for an African community problem.'),
  ('a1000000-0000-0000-0000-000000000005','Comedy Kings & Queens','Comedy','$1,500 + Promo Package','Dec 1–31 2025','Online',2100,'ended','😂','from-green-500 to-teal-600','Best 2-minute stand-up skit wins.'),
  ('a1000000-0000-0000-0000-000000000006','Afro Dance Championship','Dance','$4,000 + Tour Invite','May 1 – Jul 15','Online + Abidjan, CI',550,'upcoming','💃','from-red-500 to-pink-600','Solo, duo, or crew. Any Afro-fusion style.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.worldstage_leaderboard (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text NOT NULL,
  country       text NOT NULL,
  country_flag  text DEFAULT '🌍',
  category      text NOT NULL,
  points        int DEFAULT 0,
  avatar_emoji  text DEFAULT '🧑🏿',
  event_count   int DEFAULT 0,
  wins          int DEFAULT 0,
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ws_lb_points_idx ON public.worldstage_leaderboard(points DESC);
CREATE INDEX IF NOT EXISTS ws_lb_cat_idx    ON public.worldstage_leaderboard(category);
ALTER TABLE public.worldstage_leaderboard ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ws_lb_select_all"  ON public.worldstage_leaderboard FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ws_lb_update_own"  ON public.worldstage_leaderboard FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ws_lb_insert_auth" ON public.worldstage_leaderboard FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.worldstage_leaderboard(id, display_name, country, country_flag, category, points, avatar_emoji, event_count, wins) VALUES
  ('b1000000-0000-0000-0000-000000000001','Amara D.','Nigeria','🇳🇬','Music',9840,'👩🏿',12,4),
  ('b1000000-0000-0000-0000-000000000002','Kofi M.','Ghana','🇬🇭','Tech',9200,'👨🏿',8,3),
  ('b1000000-0000-0000-0000-000000000003','Zara T.','Liberia','🇱🇷','Live Streaming',8750,'👩🏾',10,2),
  ('b1000000-0000-0000-0000-000000000004','Moussa K.','Côte d''Ivoire','🇨🇮','Dance',7600,'👨🏾',7,2),
  ('b1000000-0000-0000-0000-000000000005','Sade A.','South Africa','🇿🇦','Fashion',7100,'👩🏽',9,1),
  ('b1000000-0000-0000-0000-000000000006','Emmanuel O.','Kenya','🇰🇪','Comedy',6900,'👨🏿',6,2),
  ('b1000000-0000-0000-0000-000000000007','Fatima B.','Senegal','🇸🇳','Music',6400,'👩🏿',5,1),
  ('b1000000-0000-0000-0000-000000000008','Chidi E.','Nigeria','🇳🇬','Tech',5800,'👨🏿',4,1),
  ('b1000000-0000-0000-0000-000000000009','Lina M.','Ethiopia','🇪🇹','Dance',5200,'👩🏿',6,0),
  ('b1000000-0000-0000-0000-000000000010','Kwame A.','Ghana','🇬🇭','Live Streaming',4900,'👨🏾',5,1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.worldstage_spotlights (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     text NOT NULL,
  country          text NOT NULL,
  country_flag     text DEFAULT '🌍',
  category         text NOT NULL,
  followers_label  text DEFAULT '0 Followers',
  quote            text,
  avatar_emoji     text DEFAULT '⭐',
  wins             int DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ws_spot_wins_idx ON public.worldstage_spotlights(wins DESC);
ALTER TABLE public.worldstage_spotlights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ws_spot_select_all" ON public.worldstage_spotlights FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ws_spot_manage"     ON public.worldstage_spotlights FOR ALL USING (auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.worldstage_spotlights(id, display_name, country, country_flag, category, followers_label, quote, avatar_emoji, wins) VALUES
  ('c1000000-0000-0000-0000-000000000001','Amara D.','Nigeria','🇳🇬','Music','12.4K Followers','Africa''s sound will conquer the world. Keep creating.','👑',4),
  ('c1000000-0000-0000-0000-000000000002','Kofi M.','Ghana','🇬🇭','Tech','8.1K Followers','Build solutions for Africa, by Africans.','🔥',3),
  ('c1000000-0000-0000-0000-000000000003','Zara T.','Liberia','🇱🇷','Live Streaming','9.7K Followers','Stream your story. The world is watching.','⭐',2)
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 16 — STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('user-uploads',      'user-uploads',      true,  52428800, NULL),
    ('posts',             'posts',              true,  52428800, NULL),
    ('marketplace',       'marketplace',        true,  52428800, NULL),
    ('stream-thumbnails', 'stream-thumbnails',  true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
    ('voice-notes',       'voice-notes',        false, 10485760, ARRAY['audio/webm','audio/ogg','audio/mpeg','audio/mp4']),
    ('documents',         'documents',          false, 104857600, NULL)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Storage policies
DO $$ BEGIN CREATE POLICY "user_uploads_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_uploads_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'user-uploads'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_uploads_own_update"  ON storage.objects FOR UPDATE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_uploads_own_delete"  ON storage.objects FOR DELETE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_auth_insert"        ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_public_read"        ON storage.objects FOR SELECT USING (bucket_id = 'posts'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "marketplace_auth_insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace' AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "marketplace_public_read"  ON storage.objects FOR SELECT USING (bucket_id = 'marketplace'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 17 — REALTIME PUBLICATION
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;               EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;                EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;                  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_comments;        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;                EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_money_payments;  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.swipes;                 EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.worldstage_leaderboard; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;             EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;         EXCEPTION WHEN others THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 18 — VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS columns
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
