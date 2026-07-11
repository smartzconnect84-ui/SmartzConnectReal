-- ═══════════════════════════════════════════════════════════════════════════
-- Schema v19 — Social engagement: profile views, story views/reactions/
-- comments, and notification-type + banner-speed support.
-- Idempotent — safe to run multiple times. Run this in the Supabase SQL
-- Editor (Project → SQL Editor → New query → paste → Run).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Profile views ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_views (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_views_viewed_idx ON public.profile_views(viewed_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_idx ON public.profile_views(viewer_id, created_at DESC);
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "profile_views_select_related" ON public.profile_views FOR SELECT USING (auth.uid() = viewer_id OR auth.uid() = viewed_user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profile_views_insert_own"     ON public.profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT ON public.profile_views TO authenticated;

-- ── 2. Story views ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS story_views_story_idx  ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS story_views_viewer_idx ON public.story_views(viewer_id);
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "story_views_select_related" ON public.story_views FOR SELECT USING (
  auth.uid() = viewer_id OR auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_id)
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_views_insert_own" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT ON public.story_views TO authenticated;

-- ── 3. Story reactions (one emoji reaction per viewer per story — upsertable) ─
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS story_reactions_story_idx ON public.story_reactions(story_id);
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "story_reactions_select_related" ON public.story_reactions FOR SELECT USING (
  auth.uid() = viewer_id OR auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_id)
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_reactions_insert_own" ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_reactions_update_own" ON public.story_reactions FOR UPDATE USING (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_reactions_delete_own" ON public.story_reactions FOR DELETE USING (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_reactions TO authenticated;

-- ── 4. Story comments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS story_comments_story_idx ON public.story_comments(story_id, created_at DESC);
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "story_comments_select_related" ON public.story_comments FOR SELECT USING (
  auth.uid() = viewer_id OR auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_id)
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_comments_insert_own" ON public.story_comments FOR INSERT WITH CHECK (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "story_comments_delete_own" ON public.story_comments FOR DELETE USING (auth.uid() = viewer_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT, DELETE ON public.story_comments TO authenticated;

-- ── 5. Widen notifications.type check constraint ────────────────────────────
-- Different schema revisions have shipped different allow-lists over time;
-- this replaces whichever check is currently live with a superset so new
-- engagement notification types never get rejected by a stale constraint.
DO $$
DECLARE
  con text;
BEGIN
  SELECT con.conname INTO con
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'notifications' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%type%';
  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', con);
  END IF;
END $$;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'match','like','message','group','system','promo','spin','call','payment',
    'comment','reaction','marketplace','ride',
    'profile_view','story_view','story_reaction','story_comment'
  )
);

-- ── 6. Announcement banner scroll speed (admin-configurable) ───────────────
-- Stores the marquee's animation duration in seconds. Default is 20% faster
-- than the previous hardcoded 26.6s (26.6 * 0.8 = 21.28s).
INSERT INTO public.platform_settings (key, value)
VALUES ('banner_speed_seconds', '21.28')
ON CONFLICT (key) DO NOTHING;

-- ── Done ─────────────────────────────────────────────────────────────────────
-- Safe to re-run. All statements above are guarded with IF NOT EXISTS,
-- ON CONFLICT DO NOTHING, or duplicate_object exception handling.
