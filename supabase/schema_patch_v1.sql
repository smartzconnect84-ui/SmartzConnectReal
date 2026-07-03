-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect — Schema Patch v1                                         ║
-- ║  Adds missing columns to align older tables with current app column names ║
-- ║  All statements are idempotent (IF NOT EXISTS / exception swallowing)    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── users: add is_active (older table uses is_banned only) ───────────────────
alter table public.users add column if not exists is_active boolean default true;
alter table public.users add column if not exists auth_id_ref uuid; -- backup ref

-- ── matches: add user1_id/user2_id as aliases to user_a/user_b ───────────────
alter table public.matches add column if not exists user1_id uuid;
alter table public.matches add column if not exists user2_id uuid;
update public.matches set user1_id = user_a, user2_id = user_b where user1_id is null;
do $$ begin
  alter table public.matches add constraint matches_user1_fk foreign key (user1_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.matches add constraint matches_user2_fk foreign key (user2_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- ── posts: add user_id alias for author_id + is_deleted ──────────────────────
alter table public.posts add column if not exists user_id uuid;
alter table public.posts add column if not exists is_deleted boolean default false;
update public.posts set user_id = author_id where user_id is null;

-- ── post_comments: add user_id alias for author_id + is_deleted ──────────────
alter table public.post_comments add column if not exists user_id uuid;
alter table public.post_comments add column if not exists is_deleted boolean default false;
update public.post_comments set user_id = author_id where user_id is null;

-- ── stories: add user_id alias for author_id ─────────────────────────────────
alter table public.stories add column if not exists user_id uuid;
update public.stories set user_id = author_id where user_id is null;

-- ── anonymous_chats: add user1_id/user2_id ───────────────────────────────────
alter table public.anonymous_chats add column if not exists user1_id uuid;
alter table public.anonymous_chats add column if not exists user2_id uuid;
update public.anonymous_chats set user1_id = user_id where user1_id is null;

-- ── group_rooms: add is_public + created_by alias for creator_id ─────────────
alter table public.group_rooms add column if not exists is_public boolean default true;
alter table public.group_rooms add column if not exists created_by uuid;
alter table public.group_rooms add column if not exists description text;
alter table public.group_rooms add column if not exists avatar_url text;
alter table public.group_rooms add column if not exists member_count int default 0;
alter table public.group_rooms add column if not exists updated_at timestamptz default now();
update public.group_rooms set created_by = creator_id where created_by is null;

-- ── group_messages: add is_deleted ───────────────────────────────────────────
alter table public.group_messages add column if not exists is_deleted boolean default false;

-- ── drivers: add user_id + is_online ─────────────────────────────────────────
alter table public.drivers add column if not exists user_id uuid;
alter table public.drivers add column if not exists is_online boolean default false;
alter table public.drivers add column if not exists updated_at timestamptz default now();

-- ── subscription_plans: add price_month alias ────────────────────────────────
alter table public.subscription_plans add column if not exists price_month numeric default 0;
update public.subscription_plans set price_month = price_usd where price_month = 0;

-- ── feature_permissions: add feature_name alias for feature_key ──────────────
alter table public.feature_permissions add column if not exists feature_name text;
update public.feature_permissions set feature_name = feature_key where feature_name is null;

-- ── worldstage_leaderboard: add country_flag ─────────────────────────────────
alter table public.worldstage_leaderboard add column if not exists country_flag text default '🌍';
alter table public.worldstage_leaderboard add column if not exists avatar_url text;

-- ── worldstage_spotlights: add country_flag ──────────────────────────────────
alter table public.worldstage_spotlights add column if not exists country_flag text default '🌍';
alter table public.worldstage_spotlights add column if not exists avatar_url text;

-- ── platform_files: add user_id alias for uploaded_by ────────────────────────
alter table public.platform_files add column if not exists user_id uuid;
update public.platform_files set user_id = uploaded_by where user_id is null;

-- ── Re-apply RLS policies that failed due to missing columns ─────────────────

-- matches
do $$ begin create policy "matches_select_own" on public.matches for select using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "matches_insert_own" on public.matches for insert with check (auth.uid() = user1_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "matches_update_own" on public.matches for update using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;

-- posts
do $$ begin create policy "posts_select_public" on public.posts for select using (not is_deleted); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_insert_own"    on public.posts for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_update_own"    on public.posts for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_delete_own"    on public.posts for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- post_comments
do $$ begin create policy "post_comments_select" on public.post_comments for select using (not is_deleted); exception when duplicate_object then null; end $$;
do $$ begin create policy "post_comments_insert" on public.post_comments for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "post_comments_delete" on public.post_comments for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- stories
do $$ begin create policy "stories_insert_own" on public.stories for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "stories_delete_own" on public.stories for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- anonymous_chats
do $$ begin create policy "anon_chats_own" on public.anonymous_chats for all using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;

-- group_rooms
do $$ begin create policy "group_rooms_select_public" on public.group_rooms for select using (is_public = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_rooms_insert_auth"   on public.group_rooms for insert with check (auth.uid() = created_by); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_rooms_update_own"    on public.group_rooms for update using (auth.uid() = created_by); exception when duplicate_object then null; end $$;

-- group_messages
do $$ begin create policy "group_messages_select" on public.group_messages for select using (not is_deleted); exception when duplicate_object then null; end $$;

-- drivers
do $$ begin create policy "drivers_insert_own" on public.drivers for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "drivers_update_own" on public.drivers for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- platform_files
do $$ begin create policy "files_select_own" on public.platform_files for select using (auth.uid() = user_id or is_public); exception when duplicate_object then null; end $$;
do $$ begin create policy "files_insert_own" on public.platform_files for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "files_delete_own" on public.platform_files for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── Final table summary ───────────────────────────────────────────────────────
select table_name, count(*) as columns
from information_schema.columns
where table_schema = 'public'
group by table_name
order by table_name;
