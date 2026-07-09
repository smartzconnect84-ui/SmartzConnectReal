-- ════════════════════════════════════════════════════════════════════════════
-- SmartzConnect v10: Realtime, Posts, Stories, Chat — Full Fix
-- Safe to run multiple times (fully idempotent)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Missing column: livestreams.moderation_status ────────────────────────
ALTER TABLE public.livestreams
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- ─── 2. Missing columns on notifications ─────────────────────────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS emoji       TEXT DEFAULT '🔔',
  ADD COLUMN IF NOT EXISTS action_url  TEXT,
  ADD COLUMN IF NOT EXISTS from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Back-fill from_user_id from actor_id
UPDATE public.notifications
  SET from_user_id = actor_id
WHERE from_user_id IS NULL AND actor_id IS NOT NULL;

-- ─── 3. Drop & recreate notifications type constraint (add all used types) ───
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN ('match','like','comment','follow','message','group','system',
             'promo','spin','call','gift','story','post','verification',
             'subscription','report','announcement')
  );

-- ─── 4. Stories: extra columns for UI ────────────────────────────────────────
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS font_style   TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true;

-- ─── 5. Posts: ensure defaults and backward-compat column ─────────────────────
ALTER TABLE public.posts
  ALTER COLUMN likes_count    SET DEFAULT 0,
  ALTER COLUMN comments_count SET DEFAULT 0,
  ALTER COLUMN saves_count    SET DEFAULT 0,
  ALTER COLUMN reposts_count  SET DEFAULT 0,
  ALTER COLUMN views_count    SET DEFAULT 0,
  ALTER COLUMN shares_count   SET DEFAULT 0;

-- image_url alias (many older queries use it; media_urls array is primary)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ─── 6. world_chat_messages: add missing columns code references ──────────────
ALTER TABLE public.world_chat_messages
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_to   UUID REFERENCES public.world_chat_messages(id) ON DELETE SET NULL;

-- ─── 7. Realtime publication: add all tables needed by the app ───────────────
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;                  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;                EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;             EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_saves;             EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_shares;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;               EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;         EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_chats;        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notifications;     EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;                EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;                EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;               EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.livestreams;            EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.world_chat_messages;    EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_money_payments;  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.worldstage_leaderboard; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;          EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.swipes;                 EXCEPTION WHEN others THEN NULL; END $$;

-- ─── 8. RLS: posts ────────────────────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select_all"  ON public.posts;
DROP POLICY IF EXISTS "posts_insert_own"  ON public.posts;
DROP POLICY IF EXISTS "posts_update_own"  ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own"  ON public.posts;

CREATE POLICY "posts_select_all" ON public.posts
  FOR SELECT TO anon, authenticated
  USING (COALESCE(is_deleted, false) = false);

CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = COALESCE(author_id, user_id));

CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = COALESCE(author_id, user_id));

CREATE POLICY "posts_delete_own" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = COALESCE(author_id, user_id));

-- ─── 9. RLS: stories ──────────────────────────────────────────────────────────
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stories_select"       ON public.stories;
DROP POLICY IF EXISTS "stories_insert_own"   ON public.stories;
DROP POLICY IF EXISTS "stories_update_own"   ON public.stories;
DROP POLICY IF EXISTS "stories_delete_own"   ON public.stories;

CREATE POLICY "stories_select" ON public.stories
  FOR SELECT TO anon, authenticated
  USING (expires_at > NOW() OR expires_at IS NULL);

CREATE POLICY "stories_insert_own" ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = COALESCE(author_id, user_id));

CREATE POLICY "stories_delete_own" ON public.stories
  FOR DELETE TO authenticated
  USING (auth.uid() = COALESCE(author_id, user_id));

-- ─── 10. RLS: story_views ─────────────────────────────────────────────────────
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_views_select" ON public.story_views;
DROP POLICY IF EXISTS "story_views_insert" ON public.story_views;

CREATE POLICY "story_views_select" ON public.story_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "story_views_insert" ON public.story_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Upsert so repeated views don't error
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_views_unique ON public.story_views(story_id, viewer_id);

-- ─── 11. RLS: post_likes ─────────────────────────────────────────────────────
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_likes_select" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_insert" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_delete" ON public.post_likes;

CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_unique ON public.post_likes(post_id, user_id);

-- ─── 12. RLS: post_saves ─────────────────────────────────────────────────────
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_saves_select" ON public.post_saves;
DROP POLICY IF EXISTS "post_saves_insert" ON public.post_saves;
DROP POLICY IF EXISTS "post_saves_delete" ON public.post_saves;

CREATE POLICY "post_saves_select" ON public.post_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "post_saves_insert" ON public.post_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_saves_delete" ON public.post_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_saves_unique ON public.post_saves(post_id, user_id);

-- ─── 13. RLS: post_comments ──────────────────────────────────────────────────
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_comments_select" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_insert" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_delete" ON public.post_comments;

CREATE POLICY "post_comments_select" ON public.post_comments
  FOR SELECT TO anon, authenticated
  USING (COALESCE(is_deleted, false) = false);
CREATE POLICY "post_comments_insert" ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "post_comments_delete" ON public.post_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ─── 14. RLS: notifications ──────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own"    ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_any"    ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"    ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own"    ON public.notifications;

CREATE POLICY "notifications_select_own"   ON public.notifications FOR SELECT TO authenticated   USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_any"   ON public.notifications FOR INSERT WITH CHECK (true); -- edge fn + triggers
CREATE POLICY "notifications_update_own"   ON public.notifications FOR UPDATE TO authenticated   USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own"   ON public.notifications FOR DELETE TO authenticated   USING (auth.uid() = user_id);

-- ─── 15. RLS: world_chat_messages ────────────────────────────────────────────
ALTER TABLE public.world_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "world_chat_select" ON public.world_chat_messages;
DROP POLICY IF EXISTS "world_chat_insert" ON public.world_chat_messages;
DROP POLICY IF EXISTS "world_chat_delete" ON public.world_chat_messages;

CREATE POLICY "world_chat_select" ON public.world_chat_messages FOR SELECT TO anon, authenticated
  USING (COALESCE(is_deleted, false) = false);
CREATE POLICY "world_chat_insert" ON public.world_chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "world_chat_delete" ON public.world_chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── 16. RLS: messages (1-to-1 direct messages via Supabase) ─────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;

CREATE POLICY "messages_select_own" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);
CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- ─── 17. Performance indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_created_desc      ON public.posts(created_at DESC) WHERE COALESCE(is_deleted, false) = false;
CREATE INDEX IF NOT EXISTS idx_posts_author_id         ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_expires    ON public.stories(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_author_expires  ON public.stories(author_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id      ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post    ON public.post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_post    ON public.post_saves(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id   ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_user_unread      ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_chat_created      ON public.world_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_notifs_to          ON public.call_notifications(to_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_livestreams_status      ON public.livestreams(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower        ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following       ON public.follows(following_id);

-- ─── 18. Auto-sync post counts via triggers ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = COALESCE(likes_count,0)+1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0,COALESCE(likes_count,0)-1) WHERE id = OLD.post_id;
  END IF; RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_sync_post_likes ON public.post_likes;
CREATE TRIGGER trg_sync_post_likes AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = COALESCE(comments_count,0)+1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0,COALESCE(comments_count,0)-1) WHERE id = OLD.post_id;
  END IF; RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_sync_post_comments ON public.post_comments;
CREATE TRIGGER trg_sync_post_comments AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

CREATE OR REPLACE FUNCTION public.sync_post_saves_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET saves_count = COALESCE(saves_count,0)+1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET saves_count = GREATEST(0,COALESCE(saves_count,0)-1) WHERE id = OLD.post_id;
  END IF; RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_sync_post_saves ON public.post_saves;
CREATE TRIGGER trg_sync_post_saves AFTER INSERT OR DELETE ON public.post_saves
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_saves_count();

CREATE OR REPLACE FUNCTION public.sync_story_views_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.stories SET views_count = COALESCE(views_count,0)+1 WHERE id = NEW.story_id;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_sync_story_views ON public.story_views;
CREATE TRIGGER trg_sync_story_views AFTER INSERT ON public.story_views
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_views_count();

-- ─── 19. Storage buckets for posts, stories ───────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES
    ('posts',   'posts',   true, 52428800),
    ('stories', 'stories', true, 52428800)
  ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$ BEGIN
  CREATE POLICY "posts_auth_insert"   ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "posts_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'posts');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "stories_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "stories_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 20. Verification query ───────────────────────────────────────────────────
SELECT
  pt.tablename,
  pgt.rowsecurity AS rls_enabled
FROM pg_publication_tables pt
JOIN pg_tables pgt ON pgt.tablename = pt.tablename AND pgt.schemaname = 'public'
WHERE pt.pubname = 'supabase_realtime' AND pt.schemaname = 'public'
ORDER BY pt.tablename;
