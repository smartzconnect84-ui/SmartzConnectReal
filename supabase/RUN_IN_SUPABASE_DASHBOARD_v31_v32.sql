-- ══════════════════════════════════════════════════════════════════════════════
-- schema_v31_subscription_plans_seed.sql
-- Canonical subscription plan data — run once to seed / re-seed the
-- subscription_plans table so the public PricingPage, in-app Subscriptions,
-- and AdminSubscriptions all draw from the same source of truth.
-- Safe to re-run: uses ON CONFLICT DO UPDATE (upsert).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Ensure table exists with the expected shape ────────────────────────────
create table if not exists public.subscription_plans (
  id          text        primary key,           -- 'free' | 'premium' | 'vip'
  name        text        not null,
  price_usd   numeric(6,2) not null default 0,
  badge       text,
  tagline     text,
  emoji       text        not null default '✨',
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  features    jsonb       not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 2. Upsert canonical plan rows ────────────────────────────────────────────

-- FREE
insert into public.subscription_plans
  (id, name, price_usd, badge, tagline, emoji, sort_order, is_active, features)
values (
  'free',
  'Free',
  0.00,
  null,
  'Get the full SmartzConnect ecosystem — forever free to start',
  '🆓',
  1,
  true,
  '[
    {"text": "Access all 8 super-products",            "included": true},
    {"text": "SmartzDating — 10 swipes/day",           "included": true},
    {"text": "SmartzSocial — post, follow & feed",     "included": true},
    {"text": "SmartzRide — book rides",                "included": true},
    {"text": "SmartzMarket — browse & buy",            "included": true},
    {"text": "SmartzTV — watch only",                  "included": true},
    {"text": "World Chat & group rooms (join only)",   "included": true},
    {"text": "Basic search & discovery",               "included": true},
    {"text": "Standard notifications",                 "included": true},
    {"text": "Unlimited swipes",                       "included": false},
    {"text": "Voice & video calls",                    "included": false},
    {"text": "Go Live broadcasts",                     "included": false}
  ]'::jsonb
)
on conflict (id) do update set
  name       = excluded.name,
  price_usd  = excluded.price_usd,
  badge      = excluded.badge,
  tagline    = excluded.tagline,
  emoji      = excluded.emoji,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  features   = excluded.features,
  updated_at = now();

-- PREMIUM
insert into public.subscription_plans
  (id, name, price_usd, badge, tagline, emoji, sort_order, is_active, features)
values (
  'premium',
  'Premium',
  5.00,
  'MOST POPULAR',
  'For active creators, daters and shoppers who want more',
  '⚡',
  2,
  true,
  '[
    {"text": "Everything in Free",                          "included": true,  "highlight": true},
    {"text": "Unlimited swipes & matches",                  "included": true,  "highlight": true},
    {"text": "See who liked your profile",                  "included": true},
    {"text": "Priority discovery — 3× visibility boost",   "included": true},
    {"text": "Voice & video calls (LiveKit)",               "included": true},
    {"text": "Go Live on SmartzTV",                        "included": true},
    {"text": "Post stories — photo, video & text",         "included": true},
    {"text": "Voice notes, read receipts & typing",        "included": true},
    {"text": "Create private group chats",                 "included": true},
    {"text": "Marketplace seller account",                 "included": true},
    {"text": "Ad-free experience",                         "included": true},
    {"text": "Advanced match filters",                     "included": true},
    {"text": "SmartzDelivery sender access",               "included": true},
    {"text": "Verified badge ✓",                           "included": false},
    {"text": "Creator revenue share",                      "included": false},
    {"text": "Advanced analytics dashboard",               "included": false}
  ]'::jsonb
)
on conflict (id) do update set
  name       = excluded.name,
  price_usd  = excluded.price_usd,
  badge      = excluded.badge,
  tagline    = excluded.tagline,
  emoji      = excluded.emoji,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  features   = excluded.features,
  updated_at = now();

-- VIP
insert into public.subscription_plans
  (id, name, price_usd, badge, tagline, emoji, sort_order, is_active, features)
values (
  'vip',
  'VIP',
  10.00,
  'FULLY UNLIMITED',
  'For vendors, drivers, broadcasters and businesses',
  '👑',
  3,
  true,
  '[
    {"text": "Everything in Premium",                       "included": true,  "highlight": true},
    {"text": "Verified badge ✓ on profile",                 "included": true,  "highlight": true},
    {"text": "Top of Discover always — 5× boost",          "included": true,  "highlight": true},
    {"text": "Super Likes (10/day)",                        "included": true},
    {"text": "Creator revenue share",                      "included": true},
    {"text": "Advanced analytics dashboard",               "included": true},
    {"text": "Exclusive VIP dating pool",                  "included": true},
    {"text": "WorldStage performer access",                "included": true},
    {"text": "Dedicated VIP support 24/7",                 "included": true},
    {"text": "Priority ride & delivery booking",           "included": true},
    {"text": "Custom profile frame & badge",               "included": true},
    {"text": "In-app wallet credits monthly",              "included": true},
    {"text": "20% SmartzAds discount",                     "included": true},
    {"text": "Early access to new features",               "included": true}
  ]'::jsonb
)
on conflict (id) do update set
  name       = excluded.name,
  price_usd  = excluded.price_usd,
  badge      = excluded.badge,
  tagline    = excluded.tagline,
  emoji      = excluded.emoji,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  features   = excluded.features,
  updated_at = now();

-- ── 3. Remove any stale / legacy plan rows ────────────────────────────────────
-- Deletes rows whose id is not one of the three canonical slugs.
-- This clears out any accidental 'plus', 'pro', 'elite', 'connect', etc.
delete from public.subscription_plans
where id not in ('free', 'premium', 'vip');

-- ── 4. Enable RLS if not already ─────────────────────────────────────────────
alter table public.subscription_plans enable row level security;

-- Public read — anyone can see active plans
drop policy if exists "Public read subscription_plans" on public.subscription_plans;
create policy "Public read subscription_plans"
  on public.subscription_plans for select
  using (is_active = true);

-- Admins can manage plans (checks admin_users table via SECURITY DEFINER helper)
drop policy if exists "Admins manage subscription_plans" on public.subscription_plans;
create policy "Admins manage subscription_plans"
  on public.subscription_plans for all
  using (
    exists (
      select 1 from public.admin_users
      where profile_id = auth.uid()
    )
  );

-- ── 5. Helpful view for quick plan lookup ─────────────────────────────────────
create or replace view public.v_subscription_plans as
  select
    id,
    name,
    price_usd,
    round(price_usd * 0.8, 2) as price_usd_yearly,
    badge,
    tagline,
    emoji,
    sort_order,
    features
  from public.subscription_plans
  where is_active = true
  order by sort_order;

grant select on public.v_subscription_plans to anon, authenticated;

-- ── 6. Trigger: keep updated_at current ──────────────────────────────────────
create or replace function public.touch_subscription_plans()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_subscription_plans on public.subscription_plans;
create trigger trg_touch_subscription_plans
  before update on public.subscription_plans
  for each row execute function public.touch_subscription_plans();
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
