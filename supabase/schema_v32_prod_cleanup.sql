-- ============================================================
-- schema_v32_prod_cleanup.sql
-- Production cleanup:
--   1. Add posts.is_deleted column (was missing, referenced everywhere)
--   2. Ensure index exists for filtered queries
--   3. Remove obvious test / demo data rows
-- ============================================================

-- ── 1. posts.is_deleted ──────────────────────────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Back-fill any NULLs that snuck in before the NOT NULL constraint
UPDATE public.posts SET is_deleted = false WHERE is_deleted IS NULL;

-- Partial index used by FeedPage, SavedPostsPage queries
CREATE INDEX IF NOT EXISTS idx_posts_active
  ON public.posts (created_at DESC)
  WHERE NOT is_deleted;

-- ── 2. RLS — make sure post SELECT policies respect is_deleted ──
-- (safe to re-run; DROP IF EXISTS first so we can recreate cleanly)
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (NOT is_deleted);

DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
CREATE POLICY "Users can view their own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

-- ── 3. Remove test / demo accounts and their content ─────────
-- Cascade order: content first, then profiles/users

-- Posts by test accounts
DELETE FROM public.posts
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email ILIKE 'test@%'
       OR email ILIKE 'demo@%'
       OR email ILIKE '%@example.com'
       OR email ILIKE '%@test.com'
       OR email ILIKE '%@mailinator.com'
       OR email ILIKE '%@yopmail.com'
  );

-- Stories by test accounts
DELETE FROM public.stories
  WHERE user_id IN (
    SELECT id FROM public.profiles
    WHERE email ILIKE 'test@%'
       OR email ILIKE 'demo@%'
       OR email ILIKE '%@example.com'
       OR email ILIKE '%@test.com'
       OR email ILIKE '%@mailinator.com'
       OR email ILIKE '%@yopmail.com'
  );

-- The test profiles themselves
DELETE FROM public.profiles
  WHERE email ILIKE 'test@%'
     OR email ILIKE 'demo@%'
     OR email ILIKE '%@example.com'
     OR email ILIKE '%@test.com'
     OR email ILIKE '%@mailinator.com'
     OR email ILIKE '%@yopmail.com';

-- Posts with no content and no media that are older than 48 h (orphaned drafts)
DELETE FROM public.posts
  WHERE (content IS NULL OR trim(content) = '')
    AND (media_url IS NULL OR trim(media_url) = '')
    AND created_at < NOW() - INTERVAL '48 hours';

-- ── 4. Confirm ───────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM public.posts WHERE NOT is_deleted)  AS active_posts,
  (SELECT COUNT(*) FROM public.posts WHERE is_deleted)      AS deleted_posts,
  (SELECT COUNT(*) FROM public.profiles)                    AS total_profiles;
