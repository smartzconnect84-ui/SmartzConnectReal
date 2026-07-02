-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect — Complete Supabase Schema                                ║
-- ║  Single source of truth for the entire database.                         ║
-- ║  FULLY IDEMPOTENT — safe to run multiple times.                          ║
-- ║  Run in: Supabase Dashboard → SQL Editor → Paste → Run                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";  -- for fuzzy search

-- ── Helper: updated_at trigger function ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── Helper: apply updated_at trigger ─────────────────────────────────────────
create or replace function public.apply_updated_at(tbl text) returns void language plpgsql as $$
begin
  execute format('
    create trigger trg_updated_at before update on public.%I
    for each row execute procedure public.set_updated_at()', tbl);
exception when duplicate_object then null;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 1 — CORE USER TABLES                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique,
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
  is_verified       boolean default false,
  is_vip            boolean default false,
  is_premium        boolean default false,
  is_online         boolean default false,
  last_seen         timestamptz,
  push_token        text,
  language_pref     text default 'en',
  subscription_tier text default 'free' check (subscription_tier in ('free','premium','vip')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists profiles_country_idx  on public.profiles(country);
create index if not exists profiles_online_idx   on public.profiles(is_online, last_seen desc);
alter table public.profiles enable row level security;
do $$ begin create policy "profiles_select_all"  on public.profiles for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "profiles_insert_own"  on public.profiles for insert with check (auth.uid() = id); exception when duplicate_object then null; end $$;
do $$ begin create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('profiles');

-- ── Auto-create profile on sign-up ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now(), now()
  ) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── App Users (extended user data for admin panel) ────────────────────────────
create table if not exists public.users (
  id                bigserial primary key,
  auth_id           uuid unique references auth.users(id) on delete cascade,
  email             text unique not null,
  full_name         text,
  country           text,
  phone             text,
  subscription_tier text default 'free',
  is_active         boolean default true,
  is_banned         boolean default false,
  is_verified       boolean default false,
  ban_reason        text,
  last_login        timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index if not exists users_email_idx   on public.users(email);
create index if not exists users_active_idx  on public.users(is_active, is_banned);
alter table public.users enable row level security;
do $$ begin create policy "users_select_own"   on public.users for select using (auth.uid() = auth_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "users_update_own"   on public.users for update using (auth.uid() = auth_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('users');

-- Sync users table on new signup
create or replace function public.handle_new_user_extended()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users(auth_id, email, full_name, created_at, updated_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), now(), now())
  on conflict (auth_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_extended on auth.users;
create trigger on_auth_user_created_extended
  after insert on auth.users
  for each row execute procedure public.handle_new_user_extended();

-- ── Admin Users ───────────────────────────────────────────────────────────────
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid references auth.users(id) on delete cascade,
  email      text unique not null,
  full_name  text,
  role       text default 'moderator' check (role in ('superadmin','admin','moderator','support')),
  status     text default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.admin_users enable row level security;
do $$ begin create policy "admin_users_select_self" on public.admin_users for select using (auth.uid() = auth_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('admin_users');

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 2 — SOCIAL & MESSAGING                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Posts (Feed) ──────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id             bigserial primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  content        text,
  image_url      text,
  video_url      text,
  location       text,
  type           text default 'text' check (type in ('text','image','video','link','story')),
  likes_count    int default 0,
  comments_count int default 0,
  shares_count   int default 0,
  is_deleted     boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists posts_user_idx    on public.posts(user_id);
create index if not exists posts_feed_idx    on public.posts(created_at desc) where not is_deleted;
alter table public.posts enable row level security;
do $$ begin create policy "posts_select_public" on public.posts for select using (not is_deleted); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_insert_own"    on public.posts for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_update_own"    on public.posts for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_delete_own"    on public.posts for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('posts');

-- ── Post Likes ────────────────────────────────────────────────────────────────
create table if not exists public.post_likes (
  id         bigserial primary key,
  post_id    bigint references public.posts(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);
alter table public.post_likes enable row level security;
do $$ begin create policy "post_likes_select" on public.post_likes for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "post_likes_insert" on public.post_likes for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "post_likes_delete" on public.post_likes for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── Messages (Direct Chat) ────────────────────────────────────────────────────
create table if not exists public.messages (
  id          bigserial primary key,
  sender_id   uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content     text,
  type        text default 'text' check (type in ('text','image','voice','emoji','file','gif')),
  reaction    text,
  read        boolean default false,
  delivered   boolean default false,
  created_at  timestamptz default now()
);
create index if not exists messages_conversation_idx on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists messages_receiver_idx     on public.messages(receiver_id, read);
alter table public.messages enable row level security;
do $$ begin create policy "messages_select_own"   on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "messages_insert_own"   on public.messages for insert with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "messages_update_own"   on public.messages for update using (auth.uid() = sender_id or auth.uid() = receiver_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "messages_delete_own"   on public.messages for delete using (auth.uid() = sender_id); exception when duplicate_object then null; end $$;

-- ── Notifications ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  type       text default 'system' check (type in ('match','like','message','group','system','promo','spin','call','payment')),
  title      text not null,
  body       text,
  emoji      text default '🔔',
  action_url text,
  data       jsonb,
  read       boolean default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read, created_at desc);
alter table public.notifications enable row level security;
do $$ begin create policy "notifications_select_own"  on public.notifications for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "notifications_insert_any"  on public.notifications for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "notifications_update_own"  on public.notifications for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "notifications_delete_own"  on public.notifications for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── Matches ───────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid references auth.users(id) on delete cascade not null,
  user2_id    uuid references auth.users(id) on delete cascade not null,
  status      text default 'accepted' check (status in ('pending','accepted','rejected','blocked')),
  liked_by_1  boolean default false,
  liked_by_2  boolean default false,
  matched_at  timestamptz default now(),
  created_at  timestamptz default now(),
  unique(user1_id, user2_id)
);
create index if not exists matches_user1_idx on public.matches(user1_id, status);
create index if not exists matches_user2_idx on public.matches(user2_id, status);
alter table public.matches enable row level security;
do $$ begin create policy "matches_select_own"   on public.matches for select using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "matches_insert_own"   on public.matches for insert with check (auth.uid() = user1_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "matches_update_own"   on public.matches for update using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;

-- ── Anonymous / Spin Chats ────────────────────────────────────────────────────
create table if not exists public.anonymous_chats (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid references auth.users(id) on delete cascade,
  user2_id    uuid references auth.users(id) on delete cascade,
  is_active   boolean default true,
  revealed    boolean default false,
  started_at  timestamptz default now(),
  ended_at    timestamptz
);
alter table public.anonymous_chats enable row level security;
do $$ begin create policy "anon_chats_own" on public.anonymous_chats for all using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;

-- ── Video Calls ───────────────────────────────────────────────────────────────
create table if not exists public.video_calls (
  id          uuid primary key default gen_random_uuid(),
  caller_id   uuid references auth.users(id) on delete cascade,
  callee_id   uuid references auth.users(id) on delete cascade,
  room_id     text,
  call_type   text default 'video' check (call_type in ('video','audio','spin_video','spin_audio')),
  status      text default 'ringing' check (status in ('ringing','active','ended','missed','rejected')),
  started_at  timestamptz,
  ended_at    timestamptz,
  duration_s  int,
  created_at  timestamptz default now()
);
create index if not exists video_calls_parties_idx on public.video_calls(caller_id, callee_id, created_at desc);
alter table public.video_calls enable row level security;
do $$ begin create policy "video_calls_own" on public.video_calls for all using (auth.uid() = caller_id or auth.uid() = callee_id); exception when duplicate_object then null; end $$;

-- ── User Reports ──────────────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reported_id uuid references auth.users(id) on delete cascade not null,
  reason      text not null,
  details     text,
  status      text default 'open' check (status in ('open','reviewed','resolved','dismissed')),
  created_at  timestamptz default now()
);
alter table public.user_reports enable row level security;
do $$ begin create policy "user_reports_insert" on public.user_reports for insert with check (auth.uid() = reporter_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "user_reports_select_own" on public.user_reports for select using (auth.uid() = reporter_id); exception when duplicate_object then null; end $$;

-- ── User Blocks ───────────────────────────────────────────────────────────────
create table if not exists public.user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid references auth.users(id) on delete cascade not null,
  blocked_id  uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;
do $$ begin create policy "blocks_insert" on public.user_blocks for insert with check (auth.uid() = blocker_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "blocks_select" on public.user_blocks for select using (auth.uid() = blocker_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "blocks_delete" on public.user_blocks for delete using (auth.uid() = blocker_id); exception when duplicate_object then null; end $$;

-- ── Content Reports (admin panel uses 'reports' table) ────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text check (target_type in ('post','message','profile','stream','comment')),
  target_id   text,
  reason      text not null,
  details     text,
  status      text default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  admin_note  text,
  reviewed_by uuid,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists reports_status_idx on public.reports(status, created_at desc);
alter table public.reports enable row level security;
do $$ begin create policy "reports_insert_auth" on public.reports for insert with check (auth.uid() = reporter_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "reports_select_own"  on public.reports for select using (auth.uid() = reporter_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('reports');

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 3 — MARKETPLACE                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Marketplace Items ─────────────────────────────────────────────────────────
create table if not exists public.marketplace_items (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  description    text,
  price          numeric(12,2) not null,
  original_price numeric(12,2),
  currency       text default 'USD',
  category       text,
  condition      text default 'new' check (condition in ('new','like_new','good','fair','poor')),
  location       text,
  country        text,
  image_url      text,
  images         text[],
  emoji          text,
  stock_qty      int default 1,
  sold_count     int default 0,
  views_count    int default 0,
  is_active      boolean default true,
  is_verified    boolean default false,
  is_featured    boolean default false,
  badge          text,
  tags           text[],
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists marketplace_category_idx on public.marketplace_items(category, is_active);
create index if not exists marketplace_seller_idx   on public.marketplace_items(seller_id);
create index if not exists marketplace_featured_idx on public.marketplace_items(is_featured, created_at desc) where is_active;
alter table public.marketplace_items enable row level security;
do $$ begin create policy "market_select_active"  on public.marketplace_items for select using (is_active = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "market_insert_own"     on public.marketplace_items for insert with check (auth.uid() = seller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "market_update_own"     on public.marketplace_items for update using (auth.uid() = seller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "market_delete_own"     on public.marketplace_items for delete using (auth.uid() = seller_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('marketplace_items');

-- ── Wishlist ──────────────────────────────────────────────────────────────────
create table if not exists public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  item_id    uuid references public.marketplace_items(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);
alter table public.wishlist enable row level security;
do $$ begin create policy "wishlist_own" on public.wishlist for all using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 4 — SMARTZTV / STREAMING                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Streams ───────────────────────────────────────────────────────────────────
create table if not exists public.streams (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  description   text,
  category      text,
  thumbnail_url text,
  stream_url    text,
  emoji         text default '📺',
  is_live       boolean default false,
  is_featured   boolean default false,
  viewer_count  int default 0,
  peak_viewers  int default 0,
  like_count    int default 0,
  gift_count    int default 0,
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists streams_live_idx      on public.streams(is_live, created_at desc);
create index if not exists streams_category_idx  on public.streams(category);
create index if not exists streams_creator_idx   on public.streams(creator_id);
alter table public.streams enable row level security;
do $$ begin create policy "streams_select_all"  on public.streams for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "streams_insert_own"  on public.streams for insert with check (auth.uid() = creator_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "streams_update_own"  on public.streams for update using (auth.uid() = creator_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('streams');

-- ── Stream Comments ───────────────────────────────────────────────────────────
create table if not exists public.stream_comments (
  id         bigserial primary key,
  stream_id  uuid references public.streams(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  content    text not null,
  is_deleted boolean default false,
  created_at timestamptz default now()
);
create index if not exists stream_comments_stream_idx on public.stream_comments(stream_id, created_at desc);
alter table public.stream_comments enable row level security;
do $$ begin create policy "stream_comments_select" on public.stream_comments for select using (not is_deleted); exception when duplicate_object then null; end $$;
do $$ begin create policy "stream_comments_insert" on public.stream_comments for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "stream_comments_delete" on public.stream_comments for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── Stream Gifts ──────────────────────────────────────────────────────────────
create table if not exists public.stream_gifts (
  id          uuid primary key default gen_random_uuid(),
  stream_id   uuid references public.streams(id) on delete cascade,
  sender_id   uuid references auth.users(id) on delete cascade,
  gift_type   text not null,
  gift_emoji  text,
  coins_cost  int default 0,
  created_at  timestamptz default now()
);
alter table public.stream_gifts enable row level security;
do $$ begin create policy "stream_gifts_insert" on public.stream_gifts for insert with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "stream_gifts_select" on public.stream_gifts for select using (true); exception when duplicate_object then null; end $$;

-- ── Stream Tokens (LiveKit / Stream.io) ──────────────────────────────────────
create table if not exists public.stream_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  token      text,
  room_id    text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, room_id)
);
alter table public.stream_tokens enable row level security;
do $$ begin create policy "stream_tokens_own" on public.stream_tokens for all using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 5 — SMARTZRIDE                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Drivers ───────────────────────────────────────────────────────────────────
create table if not exists public.drivers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text,
  email        text,
  vehicle_type text default 'standard' check (vehicle_type in ('standard','comfort','xl','moto')),
  vehicle_name text,
  plate_number text,
  emoji        text default '👨🏿',
  avatar_url   text,
  rating       numeric(3,2) default 5.0,
  total_trips  int default 0,
  is_online    boolean default false,
  is_verified  boolean default false,
  lat          numeric(10,7),
  lng          numeric(10,7),
  city         text,
  country      text default 'Liberia',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists drivers_online_idx on public.drivers(is_online, is_verified);
alter table public.drivers enable row level security;
do $$ begin create policy "drivers_select_all"  on public.drivers for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "drivers_insert_own"  on public.drivers for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "drivers_update_own"  on public.drivers for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('drivers');

-- ── Ride Requests ─────────────────────────────────────────────────────────────
create table if not exists public.ride_requests (
  id           uuid primary key default gen_random_uuid(),
  rider_id     uuid references auth.users(id) on delete cascade not null,
  driver_id    uuid references public.drivers(id) on delete set null,
  pickup_addr  text not null,
  dropoff_addr text not null,
  pickup_lat   numeric(10,7),
  pickup_lng   numeric(10,7),
  dropoff_lat  numeric(10,7),
  dropoff_lng  numeric(10,7),
  ride_type    text default 'standard',
  fare_usd     numeric(8,2),
  distance_km  numeric(6,2),
  duration_min int,
  status       text default 'requested' check (status in ('requested','searching','matched','riding','completed','cancelled')),
  rating       int check (rating between 1 and 5),
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists ride_requests_rider_idx  on public.ride_requests(rider_id, created_at desc);
create index if not exists ride_requests_status_idx on public.ride_requests(status);
alter table public.ride_requests enable row level security;
do $$ begin create policy "rides_select_own"  on public.ride_requests for select using (auth.uid() = rider_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "rides_insert_own"  on public.ride_requests for insert with check (auth.uid() = rider_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "rides_update_own"  on public.ride_requests for update using (auth.uid() = rider_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('ride_requests');

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 6 — PAYMENTS & SUBSCRIPTIONS                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Subscription Plans ────────────────────────────────────────────────────────
create table if not exists public.subscription_plans (
  id           text primary key,  -- 'free','premium','vip'
  name         text not null,
  price_usd    numeric(8,2) default 0,
  price_month  numeric(8,2) default 0,
  features     text[],
  sort_order   int default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
);
insert into public.subscription_plans(id, name, price_usd, price_month, sort_order, features) values
  ('free',    'Free',    0,     0,     1, ARRAY['Browse profiles','Basic chat','Social feed']),
  ('premium', 'Premium', 9.99,  9.99,  2, ARRAY['Unlimited swipes','See who liked you','Priority matching','No ads']),
  ('vip',     'VIP',     24.99, 24.99, 3, ARRAY['All Premium','Live streaming','Marketplace seller','Ride priority','VIP badge'])
on conflict (id) do nothing;
alter table public.subscription_plans enable row level security;
do $$ begin create policy "plans_select_all" on public.subscription_plans for select using (true); exception when duplicate_object then null; end $$;

-- ── User Subscriptions ────────────────────────────────────────────────────────
create table if not exists public.user_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  plan_id       text references public.subscription_plans(id),
  status        text default 'active' check (status in ('active','cancelled','expired','pending')),
  is_active     boolean default true,
  started_at    timestamptz default now(),
  expires_at    timestamptz,
  payment_ref   text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists subs_user_idx on public.user_subscriptions(user_id, is_active);
alter table public.user_subscriptions enable row level security;
do $$ begin create policy "subs_select_own"  on public.user_subscriptions for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "subs_insert_own"  on public.user_subscriptions for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "subs_update_own"  on public.user_subscriptions for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('user_subscriptions');

-- ── Mobile Money Payments ─────────────────────────────────────────────────────
create table if not exists public.mobile_money_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('mtn','orange','other')),
  phone_number    text,
  amount_usd      numeric(10,2) not null,
  amount_local    numeric(12,2),
  currency_local  text default 'LRD',
  transaction_id  text unique,
  plan_id         text,
  status          text default 'pending' check (status in ('pending','confirmed','rejected','refunded')),
  notes           text,
  verified_by     uuid,
  verified_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists payments_user_idx   on public.mobile_money_payments(user_id, created_at desc);
create index if not exists payments_status_idx on public.mobile_money_payments(status);
alter table public.mobile_money_payments enable row level security;
do $$ begin create policy "payments_insert_own"  on public.mobile_money_payments for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "payments_select_own"  on public.mobile_money_payments for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('mobile_money_payments');

-- ── Invoices ──────────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  amount_usd  numeric(10,2),
  description text,
  status      text default 'pending' check (status in ('pending','paid','void')),
  paid_at     timestamptz,
  created_at  timestamptz default now()
);
alter table public.invoices enable row level security;
do $$ begin create policy "invoices_select_own" on public.invoices for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 7 — CONTENT & ADMIN                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Blog Posts ────────────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references auth.users(id) on delete set null,
  title        text not null,
  slug         text unique,
  excerpt      text,
  content      text,
  cover_url    text,
  category     text,
  tags         text[],
  status       text default 'draft' check (status in ('draft','published','archived')),
  views_count  int default 0,
  read_time    int default 5,
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists blog_posts_status_idx on public.blog_posts(status, published_at desc);
alter table public.blog_posts enable row level security;
do $$ begin create policy "blog_select_published"  on public.blog_posts for select using (status = 'published'); exception when duplicate_object then null; end $$;
do $$ begin create policy "blog_insert_auth"       on public.blog_posts for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "blog_update_own"        on public.blog_posts for update using (auth.uid() = author_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('blog_posts');

-- ── Team Members ──────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  role        text not null,
  bio         text,
  avatar_url  text,
  emoji       text,
  linkedin    text,
  twitter     text,
  order_num   int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);
alter table public.team_members enable row level security;
do $$ begin create policy "team_select_active" on public.team_members for select using (is_active = true); exception when duplicate_object then null; end $$;

-- ── Ad Campaigns ──────────────────────────────────────────────────────────────
create table if not exists public.ad_campaigns (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  advertiser   text,
  type         text default 'banner' check (type in ('banner','video','sponsored','popup')),
  budget_usd   numeric(10,2) default 0,
  spent_usd    numeric(10,2) default 0,
  impressions  int default 0,
  clicks       int default 0,
  ctr          numeric(5,4) default 0,
  status       text default 'pending' check (status in ('active','paused','pending','ended','rejected')),
  placement    text,
  image_url    text,
  target_url   text,
  target_demo  jsonb,
  start_date   date,
  end_date     date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.ad_campaigns enable row level security;
do $$ begin create policy "ads_select_active" on public.ad_campaigns for select using (status = 'active'); exception when duplicate_object then null; end $$;
do $$ begin create policy "ads_insert_auth"   on public.ad_campaigns for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
select public.apply_updated_at('ad_campaigns');

-- ── Broadcast Messages ────────────────────────────────────────────────────────
create table if not exists public.broadcast_messages (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  body            text not null,
  emoji           text default '📢',
  target_segment  text default 'all',
  target_country  text,
  target_plan     text,
  recipient_count int default 0,
  sent_by         uuid references auth.users(id),
  sent_at         timestamptz default now()
);
alter table public.broadcast_messages enable row level security;
do $$ begin create policy "broadcasts_insert_auth" on public.broadcast_messages for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "broadcasts_select_auth" on public.broadcast_messages for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- ── Safety Rules ──────────────────────────────────────────────────────────────
create table if not exists public.safety_rules (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  category   text default 'general',
  active     boolean default true,
  order_num  int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.safety_rules enable row level security;
do $$ begin create policy "safety_rules_select" on public.safety_rules for select using (active = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "safety_rules_manage" on public.safety_rules for all using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- ── Feature Permissions ───────────────────────────────────────────────────────
create table if not exists public.feature_permissions (
  id           uuid primary key default gen_random_uuid(),
  feature_name text unique not null,
  free_allowed boolean default true,
  premium_req  boolean default false,
  vip_req      boolean default false,
  description  text,
  updated_at   timestamptz default now()
);
alter table public.feature_permissions enable row level security;
do $$ begin create policy "feature_perms_select" on public.feature_permissions for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "feature_perms_manage" on public.feature_permissions for all using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- Insert default feature permissions
insert into public.feature_permissions(feature_name, free_allowed, premium_req, vip_req, description) values
  ('discover_swipe',      true,  false, false, 'Basic swipe/discover'),
  ('unlimited_swipes',    false, true,  false, 'Remove daily swipe limit'),
  ('see_who_liked_you',   false, true,  false, 'See incoming likes'),
  ('live_streaming',      false, false, true,  'Start a live stream'),
  ('marketplace_sell',    false, true,  false, 'List items in marketplace'),
  ('boost_profile',       false, true,  false, 'Boost profile visibility'),
  ('super_like',          false, true,  false, 'Send super likes'),
  ('read_receipts',       true,  false, false, 'See message read status'),
  ('vip_badge',           false, false, true,  'VIP verification badge')
on conflict (feature_name) do nothing;

-- ── Audit Logs ────────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  target     text,
  target_id  text,
  metadata   jsonb,
  ip_addr    inet,
  created_at timestamptz default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_user_idx    on public.audit_logs(user_id);
alter table public.audit_logs enable row level security;
do $$ begin create policy "audit_insert_auth" on public.audit_logs for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "audit_select_own"  on public.audit_logs for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── Push Notifications ────────────────────────────────────────────────────────
create table if not exists public.push_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  icon        text,
  url         text,
  provider    text default 'onesignal' check (provider in ('onesignal','fcm','apns','web')),
  external_id text,
  status      text default 'queued' check (status in ('queued','sent','failed','cancelled')),
  sent_at     timestamptz,
  created_at  timestamptz default now()
);
alter table public.push_notifications enable row level security;
do $$ begin create policy "push_notifs_insert" on public.push_notifications for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "push_notifs_select" on public.push_notifications for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 7B — SWIPES & WORLDSTAGE                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Swipes (Discover / Dating) ────────────────────────────────────────────────
create table if not exists public.swipes (
  id          uuid primary key default gen_random_uuid(),
  swiper_id   uuid references auth.users(id) on delete cascade not null,
  swiped_id   uuid references auth.users(id) on delete cascade,
  swiped_name text,
  action      text not null check (action in ('like','pass','super_like')),
  created_at  timestamptz default now(),
  unique(swiper_id, swiped_id)
);
create index if not exists swipes_swiper_idx on public.swipes(swiper_id, created_at desc);
create index if not exists swipes_action_idx on public.swipes(swiper_id, action);
alter table public.swipes enable row level security;
do $$ begin create policy "swipes_select_own"  on public.swipes for select using (auth.uid() = swiper_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "swipes_insert_own"  on public.swipes for insert with check (auth.uid() = swiper_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "swipes_delete_own"  on public.swipes for delete using (auth.uid() = swiper_id); exception when duplicate_object then null; end $$;

-- ── WorldStage Events ─────────────────────────────────────────────────────────
create table if not exists public.worldstage_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null,
  prize        text,
  date_range   text,
  location     text,
  participants int default 0,
  status       text default 'upcoming' check (status in ('open','upcoming','ended')),
  emoji        text default '🌍',
  color        text default 'from-pink-500 to-purple-600',
  description  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists ws_events_status_idx   on public.worldstage_events(status, created_at desc);
create index if not exists ws_events_category_idx on public.worldstage_events(category);
alter table public.worldstage_events enable row level security;
do $$ begin create policy "ws_events_select_all" on public.worldstage_events for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_events_manage"     on public.worldstage_events for all using (auth.uid() is not null); exception when duplicate_object then null; end $$;
select public.apply_updated_at('worldstage_events');

insert into public.worldstage_events(id, title, category, prize, date_range, location, participants, status, emoji, color, description) values
  ('a1000000-0000-0000-0000-000000000001', 'Africa Music Clash 2026',   'Music',          '$5,000 + Recording Deal', 'Jan 15 – Feb 28', 'Lagos, NG + Online',   1240, 'open',     '🎵', 'from-pink-500 to-purple-600',  'Open to all African artists. Upload a 60s original track.'),
  ('a1000000-0000-0000-0000-000000000002', 'SmartzTV Live Battle',      'Live Streaming', '$3,000 + VIP Badge',      'Feb 1 – Mar 15',  'Online',               876,  'open',     '📺', 'from-purple-500 to-blue-600',  'Grow the most viewers in 45 days. Top 3 win.'),
  ('a1000000-0000-0000-0000-000000000003', 'Pan-African Fashion Week',  'Fashion',        '$2,500 + Brand Deal',     'Mar 1 – Apr 30',  'Accra, GH + Online',   632,  'upcoming', '👗', 'from-yellow-500 to-orange-600','Submit your best 3-piece Afrocentric collection.'),
  ('a1000000-0000-0000-0000-000000000004', 'Tech Innovators Challenge', 'Tech',           '$10,000 Grant',           'Apr 15 – Jun 30', 'Nairobi, KE + Online', 421,  'upcoming', '💡', 'from-blue-500 to-cyan-600',    'Build a solution for an African community problem.'),
  ('a1000000-0000-0000-0000-000000000005', 'Comedy Kings & Queens',     'Comedy',         '$1,500 + Promo Package',  'Dec 1–31 2025',   'Online',               2100, 'ended',    '😂', 'from-green-500 to-teal-600',   'Best 2-minute stand-up skit wins.'),
  ('a1000000-0000-0000-0000-000000000006', 'Afro Dance Championship',   'Dance',          '$4,000 + Tour Invite',    'May 1 – Jul 15',  'Online + Abidjan, CI', 550,  'upcoming', '💃', 'from-red-500 to-pink-600',     'Solo, duo, or crew. Any Afro-fusion style.')
on conflict (id) do nothing;

-- ── WorldStage Leaderboard ────────────────────────────────────────────────────
create table if not exists public.worldstage_leaderboard (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  display_name  text not null,
  country       text not null,
  country_flag  text default '🌍',
  category      text not null,
  points        int default 0,
  avatar_emoji  text default '🧑🏿',
  event_count   int default 0,
  wins          int default 0,
  updated_at    timestamptz default now()
);
create index if not exists ws_lb_points_idx on public.worldstage_leaderboard(points desc);
create index if not exists ws_lb_cat_idx    on public.worldstage_leaderboard(category);
alter table public.worldstage_leaderboard enable row level security;
do $$ begin create policy "ws_lb_select_all"  on public.worldstage_leaderboard for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_lb_update_own"  on public.worldstage_leaderboard for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_lb_insert_auth" on public.worldstage_leaderboard for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;

insert into public.worldstage_leaderboard(id, display_name, country, country_flag, category, points, avatar_emoji, event_count, wins) values
  ('b1000000-0000-0000-0000-000000000001', 'Amara D.',     'Nigeria',        '🇳🇬', 'Music',          9840, '👩🏿', 12, 4),
  ('b1000000-0000-0000-0000-000000000002', 'Kofi M.',      'Ghana',          '🇬🇭', 'Tech',           9200, '👨🏿', 8,  3),
  ('b1000000-0000-0000-0000-000000000003', 'Zara T.',      'Liberia',        '🇱🇷', 'Live Streaming', 8750, '👩🏾', 10, 2),
  ('b1000000-0000-0000-0000-000000000004', 'Moussa K.',    'Côte d''Ivoire', '🇨🇮', 'Dance',          7600, '👨🏾', 7,  2),
  ('b1000000-0000-0000-0000-000000000005', 'Sade A.',      'South Africa',   '🇿🇦', 'Fashion',        7100, '👩🏽', 9,  1),
  ('b1000000-0000-0000-0000-000000000006', 'Emmanuel O.',  'Kenya',          '🇰🇪', 'Comedy',         6900, '👨🏿', 6,  2),
  ('b1000000-0000-0000-0000-000000000007', 'Fatima B.',    'Senegal',        '🇸🇳', 'Music',          6400, '👩🏿', 5,  1),
  ('b1000000-0000-0000-0000-000000000008', 'Chidi E.',     'Nigeria',        '🇳🇬', 'Tech',           5800, '👨🏿', 4,  1),
  ('b1000000-0000-0000-0000-000000000009', 'Lina M.',      'Ethiopia',       '🇪🇹', 'Dance',          5200, '👩🏿', 6,  0),
  ('b1000000-0000-0000-0000-000000000010', 'Kwame A.',     'Ghana',          '🇬🇭', 'Live Streaming', 4900, '👨🏾', 5,  1)
on conflict (id) do nothing;

-- ── WorldStage Spotlights ─────────────────────────────────────────────────────
create table if not exists public.worldstage_spotlights (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  display_name     text not null,
  country          text not null,
  country_flag     text default '🌍',
  category         text not null,
  followers_label  text default '0 Followers',
  quote            text,
  avatar_emoji     text default '⭐',
  wins             int default 0,
  created_at       timestamptz default now()
);
create index if not exists ws_spot_wins_idx on public.worldstage_spotlights(wins desc);
alter table public.worldstage_spotlights enable row level security;
do $$ begin create policy "ws_spot_select_all" on public.worldstage_spotlights for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_spot_manage"     on public.worldstage_spotlights for all using (auth.uid() is not null); exception when duplicate_object then null; end $$;

insert into public.worldstage_spotlights(id, display_name, country, country_flag, category, followers_label, quote, avatar_emoji, wins) values
  ('c1000000-0000-0000-0000-000000000001', 'Amara D.', 'Nigeria', '🇳🇬', 'Music',         '12.4K Followers', 'Africa''s sound will conquer the world. Keep creating.',  '👑', 4),
  ('c1000000-0000-0000-0000-000000000002', 'Kofi M.',  'Ghana',   '🇬🇭', 'Tech',          '8.1K Followers',  'Build solutions for Africa, by Africans.',              '🔥', 3),
  ('c1000000-0000-0000-0000-000000000003', 'Zara T.',  'Liberia', '🇱🇷', 'Live Streaming','9.7K Followers',  'Stream your story. The world is watching.',             '⭐', 2)
on conflict (id) do nothing;

-- ── Fix stream_tokens: add user-only unique for upsert without room_id ────────
do $$ begin
  alter table public.stream_tokens add constraint stream_tokens_user_id_unique unique (user_id);
exception when duplicate_object then null; when others then null; end $$;

-- ── Realtime for new tables ───────────────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table public.swipes; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.worldstage_leaderboard; exception when others then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 8 — STORAGE POLICIES                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- NOTE: Buckets must be created in Supabase Dashboard → Storage → New Bucket
-- Buckets to create: user-uploads, posts, marketplace, stream-thumbnails
-- Then run these SQL policies:

do $$ begin
  insert into storage.buckets(id, name, public) values
    ('user-uploads',       'user-uploads',       true),
    ('posts',              'posts',               true),
    ('marketplace',        'marketplace',         true),
    ('stream-thumbnails',  'stream-thumbnails',   true)
  on conflict (id) do nothing;
exception when others then null; end $$;

do $$ begin
  create policy "user_uploads_auth_insert" on storage.objects for insert with check (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "user_uploads_public_read" on storage.objects for select using (bucket_id = 'user-uploads');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "user_uploads_own_update" on storage.objects for update using (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "user_uploads_own_delete" on storage.objects for delete using (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "posts_auth_insert" on storage.objects for insert with check (bucket_id = 'posts' and auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "posts_public_read" on storage.objects for select using (bucket_id = 'posts');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "marketplace_auth_insert" on storage.objects for insert with check (bucket_id = 'marketplace' and auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "marketplace_public_read" on storage.objects for select using (bucket_id = 'marketplace');
exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 9 — REALTIME PUBLICATION                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

do $$ begin alter publication supabase_realtime add table public.messages;          exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications;     exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.matches;           exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.video_calls;       exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.posts;             exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.stream_comments;   exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.streams;           exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.ride_requests;     exception when others then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 10 — VERIFICATION QUERY                                         ║
-- ║  Run after applying schema to confirm everything is set up correctly.    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

select
  t.table_name,
  (select count(*) from information_schema.columns c where c.table_name = t.table_name and c.table_schema = 'public') as col_count,
  obj_description(pgc.oid, 'pg_class') as description
from information_schema.tables t
left join pg_class pgc on pgc.relname = t.table_name
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
order by t.table_name;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  REALTIME-ENABLED TABLES                                                 ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  messages          │ Live chat (INSERT, UPDATE, DELETE)                  ║
-- ║  notifications     │ Live alerts (INSERT, UPDATE, DELETE)                ║
-- ║  matches           │ New match events (INSERT, UPDATE)                   ║
-- ║  video_calls       │ Call signaling (INSERT, UPDATE)                     ║
-- ║  posts             │ Live feed (INSERT, UPDATE, DELETE)                  ║
-- ║  stream_comments   │ Live chat comments (INSERT, DELETE)                 ║
-- ║  streams           │ Live viewer counts / status (UPDATE)                ║
-- ║  ride_requests     │ Ride status updates (INSERT, UPDATE)                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
