-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect Supabase Schema v3 — Production Ready                    ║
-- ║  Safe to run multiple times (fully idempotent).                          ║
-- ║  Run in: Supabase Dashboard → SQL Editor → Paste → Run                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Helper: drop a policy if it exists before recreating it ─────────────────
-- (Supabase does not support CREATE POLICY IF NOT EXISTS)

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique,
  full_name         text,
  avatar_url        text,
  cover_url         text,
  bio               text,
  location          text,
  country           text,
  age               int,
  gender            text,
  occupation        text,
  education         text,
  relationship_goal text,
  languages         text[],
  interests         text[],
  height_cm         int,
  is_verified       boolean default false,
  is_vip            boolean default false,
  is_premium        boolean default false,
  is_online         boolean default false,
  last_seen         timestamptz,
  push_token        text,
  language_pref     text default 'en',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.profiles enable row level security;

do $$ begin
  create policy "Public profiles viewable" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id          bigserial primary key,
  sender_id   uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  content     text,
  type        text default 'text' check (type in ('text','image','voice','emoji','file')),
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists messages_sender_idx   on public.messages(sender_id);
create index if not exists messages_receiver_idx on public.messages(receiver_id);
create index if not exists messages_created_idx  on public.messages(created_at desc);

alter table public.messages enable row level security;

do $$ begin
  create policy "Users read own messages" on public.messages
    for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users send messages" on public.messages
    for insert with check (auth.uid() = sender_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users delete own messages" on public.messages
    for delete using (auth.uid() = sender_id);
exception when duplicate_object then null; end $$;

-- ── Matches ───────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id         uuid primary key default uuid_generate_v4(),
  user_a     uuid references auth.users(id) on delete cascade,
  user_b     uuid references auth.users(id) on delete cascade,
  status     text default 'pending' check (status in ('pending','accepted','rejected')),
  liked_by_a boolean default false,
  liked_by_b boolean default false,
  created_at timestamptz default now(),
  unique(user_a, user_b)
);

alter table public.matches enable row level security;

do $$ begin
  create policy "Users view own matches" on public.matches
    for select using (auth.uid() = user_a or auth.uid() = user_b);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users create matches" on public.matches
    for insert with check (auth.uid() = user_a);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users update own matches" on public.matches
    for update using (auth.uid() = user_a or auth.uid() = user_b);
exception when duplicate_object then null; end $$;

-- ── Team Members ──────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  id            uuid primary key default uuid_generate_v4(),
  full_name     text not null,
  role          text not null,
  photo_url     text,
  country       text,
  bio           text,
  skills        text[],
  linkedin_url  text,
  twitter_url   text,
  joined_year   text,
  is_advisor    boolean default false,
  is_active     boolean default true,
  display_order int default 0,
  organization  text,
  created_at    timestamptz default now()
);

alter table public.team_members enable row level security;

do $$ begin
  create policy "Team members public read" on public.team_members for select using (true);
exception when duplicate_object then null; end $$;

insert into public.team_members (full_name, role, photo_url, country, bio, skills, is_active, display_order)
values (
  'Shedrick K. Nungehn',
  'Founder & CEO',
  '/ceo-shedrick.jpg',
  'Liberia',
  'Visionary entrepreneur and founder of SmartzConnect — Africa''s #1 social and dating platform.',
  array['Leadership','Product Vision','Strategy','Technology','African Markets'],
  true,
  0
) on conflict do nothing;

-- ── Blog Posts ────────────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text unique,
  excerpt      text,
  content      text,
  author_name  text,
  author_role  text,
  image_url    text,
  category     text,
  tags         text[],
  status       text default 'draft' check (status in ('draft','published','archived')),
  featured     boolean default false,
  views_count  int default 0,
  likes_count  int default 0,
  read_time    text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.blog_posts enable row level security;

do $$ begin
  create policy "Published posts public read" on public.blog_posts
    for select using (status = 'published');
exception when duplicate_object then null; end $$;

-- ── Ad Campaigns ──────────────────────────────────────────────────────────────
create table if not exists public.ad_campaigns (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  advertiser   text,
  type         text default 'banner' check (type in ('banner','video','sponsored')),
  budget_usd   numeric(10,2) default 0,
  spent_usd    numeric(10,2) default 0,
  impressions  int default 0,
  clicks       int default 0,
  status       text default 'pending' check (status in ('active','paused','pending','ended')),
  placement    text,
  image_url    text,
  start_date   date,
  end_date     date,
  created_at   timestamptz default now()
);

alter table public.ad_campaigns enable row level security;

-- ── User Reports ──────────────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id               uuid primary key default uuid_generate_v4(),
  reporter_id      uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason           text not null,
  details          text,
  status           text default 'pending' check (status in ('pending','reviewed','dismissed','actioned')),
  admin_notes      text,
  created_at       timestamptz default now()
);

alter table public.user_reports enable row level security;

do $$ begin
  create policy "Users create reports" on public.user_reports
    for insert with check (auth.uid() = reporter_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users read own reports" on public.user_reports
    for select using (auth.uid() = reporter_id);
exception when duplicate_object then null; end $$;

-- ── User Blocks ───────────────────────────────────────────────────────────────
create table if not exists public.user_blocks (
  id              uuid primary key default uuid_generate_v4(),
  blocker_id      uuid references auth.users(id) on delete cascade,
  blocked_user_id uuid references auth.users(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(blocker_id, blocked_user_id)
);

alter table public.user_blocks enable row level security;

do $$ begin
  create policy "Users manage own blocks" on public.user_blocks
    using (auth.uid() = blocker_id)
    with check (auth.uid() = blocker_id);
exception when duplicate_object then null; end $$;

-- ── Invoices ──────────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade,
  plan           text not null,
  amount_usd     numeric(10,2),
  currency       text default 'USD',
  payment_method text,
  transaction_id text,
  status         text default 'pending' check (status in ('pending','paid','failed','refunded')),
  issued_at      timestamptz default now(),
  paid_at        timestamptz
);

alter table public.invoices enable row level security;

do $$ begin
  create policy "Users read own invoices" on public.invoices
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Video Calls ───────────────────────────────────────────────────────────────
create table if not exists public.video_calls (
  id           uuid primary key default uuid_generate_v4(),
  caller_id    uuid references auth.users(id),
  callee_id    uuid references auth.users(id),
  jitsi_room   text not null,
  call_type    text default 'video' check (call_type in ('video','audio')),
  status       text default 'ringing' check (status in ('ringing','active','ended','missed','declined')),
  started_at   timestamptz,
  ended_at     timestamptz,
  duration_sec int,
  created_at   timestamptz default now()
);

alter table public.video_calls enable row level security;

do $$ begin
  create policy "Participants view calls" on public.video_calls
    for select using (auth.uid() = caller_id or auth.uid() = callee_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Callers create calls" on public.video_calls
    for insert with check (auth.uid() = caller_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Participants update calls" on public.video_calls
    for update using (auth.uid() = caller_id or auth.uid() = callee_id);
exception when duplicate_object then null; end $$;

-- ── Anonymous Chats ───────────────────────────────────────────────────────────
create table if not exists public.anonymous_chats (
  id            uuid primary key default uuid_generate_v4(),
  session_token text unique not null default gen_random_uuid()::text,
  user_id       uuid references auth.users(id),
  matched_with  uuid references auth.users(id),
  status        text default 'active' check (status in ('active','ended')),
  created_at    timestamptz default now()
);

alter table public.anonymous_chats enable row level security;

-- ── Push Notifications ────────────────────────────────────────────────────────
create table if not exists public.push_notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  data       jsonb,
  sent       boolean default false,
  read       boolean default false,
  created_at timestamptz default now()
);

alter table public.push_notifications enable row level security;

do $$ begin
  create policy "Users read own notifications" on public.push_notifications
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Storage Bucket ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Authenticated users upload" on storage.objects
    for insert with check (bucket_id = 'user-uploads' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read user uploads" on storage.objects
    for select using (bucket_id = 'user-uploads');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users delete own uploads" on storage.objects
    for delete using (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;

-- ── Enable Realtime ───────────────────────────────────────────────────────────
-- Run these in the Supabase Dashboard → Database → Replication tab
-- or uncomment here if you have permissions:
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.video_calls;
-- alter publication supabase_realtime add table public.matches;
