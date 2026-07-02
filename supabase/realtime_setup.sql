-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect — Supabase Realtime Setup                                 ║
-- ║  Uses Postgres Changes (NOT Broadcast triggers).                          ║
-- ║  Safe to run multiple times (fully idempotent).                           ║
-- ║  Run in: Supabase Dashboard → SQL Editor → Paste → Run                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Ensure all realtime-relevant tables exist
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Posts (Feed) ──────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  content      text,
  image_url    text,
  video_url    text,
  type         text default 'text' check (type in ('text','image','video','link')),
  likes_count  int default 0,
  comments_count int default 0,
  shares_count int default 0,
  is_deleted   boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists posts_user_idx     on public.posts(user_id);
create index if not exists posts_created_idx  on public.posts(created_at desc);

alter table public.posts enable row level security;

do $$ begin
  create policy "posts_select_all" on public.posts
    for select using (is_deleted = false);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "posts_insert_own" on public.posts
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "posts_update_own" on public.posts
    for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "posts_delete_own" on public.posts
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Notifications ──────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text default 'system'
              check (type in ('match','like','message','group','system','promo','spin','call')),
  title       text not null,
  body        text,
  emoji       text default '🔔',
  action_url  text,
  data        jsonb,
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists notifications_user_idx     on public.notifications(user_id);
create index if not exists notifications_read_idx     on public.notifications(user_id, read);
create index if not exists notifications_created_idx  on public.notifications(created_at desc);

alter table public.notifications enable row level security;

do $$ begin
  create policy "notifications_select_own" on public.notifications
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications_insert_service" on public.notifications
    for insert with check (true);  -- edge functions use service role; restrict further if needed
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications_update_own" on public.notifications
    for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notifications_delete_own" on public.notifications
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Messages ──────────────────────────────────────────────────────────────────
-- (created in schema_v3.sql; add missing indexes/policies here if needed)
create table if not exists public.messages (
  id          bigserial primary key,
  sender_id   uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  content     text,
  type        text default 'text' check (type in ('text','image','voice','emoji','file')),
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists messages_sender_idx      on public.messages(sender_id);
create index if not exists messages_receiver_idx    on public.messages(receiver_id);
create index if not exists messages_conversation_idx on public.messages(sender_id, receiver_id);
create index if not exists messages_created_idx     on public.messages(created_at desc);

alter table public.messages enable row level security;

do $$ begin
  create policy "messages_select_participants" on public.messages
    for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "messages_insert_sender" on public.messages
    for insert with check (auth.uid() = sender_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "messages_update_receiver" on public.messages
    for update using (auth.uid() = receiver_id or auth.uid() = sender_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "messages_delete_own" on public.messages
    for delete using (auth.uid() = sender_id);
exception when duplicate_object then null; end $$;

-- ── Matches ───────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  user1_id     uuid references auth.users(id) on delete cascade,
  user2_id     uuid references auth.users(id) on delete cascade,
  user_a       uuid,  -- alias used in some queries
  user_b       uuid,  -- alias used in some queries
  status       text default 'accepted' check (status in ('pending','accepted','rejected')),
  liked_by_a   boolean default false,
  liked_by_b   boolean default false,
  matched_at   timestamptz default now(),
  created_at   timestamptz default now(),
  unique(user1_id, user2_id)
);

create index if not exists matches_user1_idx    on public.matches(user1_id);
create index if not exists matches_user2_idx    on public.matches(user2_id);
create index if not exists matches_created_idx  on public.matches(created_at desc);

alter table public.matches enable row level security;

do $$ begin
  create policy "matches_select_participants" on public.matches
    for select using (auth.uid() = user1_id or auth.uid() = user2_id
                   or auth.uid() = user_a    or auth.uid() = user_b);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "matches_insert_own" on public.matches
    for insert with check (auth.uid() = user1_id or auth.uid() = user_a);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "matches_update_participants" on public.matches
    for update using (auth.uid() = user1_id or auth.uid() = user2_id
                   or auth.uid() = user_a    or auth.uid() = user_b);
exception when duplicate_object then null; end $$;

-- ── Video Calls ───────────────────────────────────────────────────────────────
-- (created in schema_v3.sql; already has RLS — just ensure realtime below)

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Enable Postgres Changes Realtime
-- Each table is added to supabase_realtime publication.
-- Wrapped in DO blocks so re-runs don't fail.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.video_calls;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when others then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Verify realtime publication (read-only check)
-- After running, this should list all 5 tables above.
-- ─────────────────────────────────────────────────────────────────────────────
select
  schemaname,
  tablename,
  pubname
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: No broadcast triggers were found in the codebase.
-- AdminBroadcasts writes to the broadcast_messages table (standard INSERT)
-- and is NOT a Supabase Realtime broadcast — no cleanup needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  REALTIME-ENABLED TABLES REPORT                                          ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  Table          │ Events              │ Used By                           ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  messages       │ INSERT,UPDATE,DELETE │ ChatPage (live chat)              ║
-- ║  notifications  │ INSERT,UPDATE,DELETE │ NotificationsPage (live alerts)   ║
-- ║  matches        │ INSERT,UPDATE        │ MatchesPage (new match alerts)    ║
-- ║  video_calls    │ INSERT,UPDATE        │ LiveKit call state                ║
-- ║  posts          │ INSERT,UPDATE,DELETE │ FeedPage (live feed)              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
