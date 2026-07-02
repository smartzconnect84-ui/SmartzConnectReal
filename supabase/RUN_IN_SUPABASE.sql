-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect — MASTER SUPABASE SCHEMA (v2 — fully audited)             ║
-- ║  Run in: Supabase Dashboard → SQL Editor → Paste → Run                  ║
-- ║  FULLY IDEMPOTENT — safe to run multiple times                           ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  Covers all features used by the app — column names match code exactly  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ── Helper: updated_at trigger ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.apply_updated_at(tbl text) returns void language plpgsql as $$
begin
  execute format('
    create trigger trg_%I_updated_at before update on public.%I
    for each row execute procedure public.set_updated_at()', tbl, tbl);
exception when duplicate_object then null;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 1 — CORE USER TABLES                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Profiles (auth users — dating/social profile) ────────────────────────────
-- Columns match: DiscoverPage, ProfilePage, database.types.ts
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
  role              text default 'user' check (role in ('user','admin','ceo')),
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

-- ── App Users (admin panel) ────────────────────────────────────────────────────
-- Columns match: AdminUsers.tsx, AdminDashboard.tsx, AdminReports.tsx
-- AdminUsers queries: email, full_name, role, email_verified, subscription_tier,
--                     is_banned, is_verified, created_at, country
-- AdminDashboard queries: email, full_name, country, subscription_tier, is_active
create table if not exists public.users (
  id                bigserial primary key,
  auth_id           uuid unique references auth.users(id) on delete cascade,
  email             text unique not null,
  full_name         text,
  country           text,
  phone             text,
  role              text default 'user' check (role in ('user','admin','superadmin','moderator','support')),
  subscription_tier text default 'free',
  email_verified    boolean default false,
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

-- Auto-create users row on sign-up
create or replace function public.handle_new_user_extended()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users(auth_id, email, full_name, created_at, updated_at)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    now(), now())
  on conflict (auth_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_extended on auth.users;
create trigger on_auth_user_created_extended
  after insert on auth.users
  for each row execute procedure public.handle_new_user_extended();

-- ── Admin Users ───────────────────────────────────────────────────────────────
-- Matches AdminCEO.tsx query: id, full_name, email, role, status
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid references auth.users(id) on delete cascade,
  email      text unique not null,
  full_name  text,
  role       text default 'moderator' check (role in ('superadmin','admin','moderator','support')),
  status     text default 'active'    check (status in ('active','inactive','suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.admin_users enable row level security;
do $$ begin create policy "admin_users_select_self" on public.admin_users for select using (auth.uid() = auth_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('admin_users');

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 2 — DATING / SWIPE FEATURE                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Likes (swipes) — matches database.types.ts ────────────────────────────────
create table if not exists public.likes (
  id            uuid primary key default gen_random_uuid(),
  liker_id      uuid references auth.users(id) on delete cascade not null,
  liked_id      uuid references auth.users(id) on delete cascade not null,
  is_super_like boolean default false,
  created_at    timestamptz default now(),
  unique(liker_id, liked_id)
);
create index if not exists likes_liker_idx on public.likes(liker_id);
create index if not exists likes_liked_idx on public.likes(liked_id);
alter table public.likes enable row level security;
do $$ begin create policy "likes_insert_own"  on public.likes for insert with check (auth.uid() = liker_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "likes_select_own"  on public.likes for select using (auth.uid() = liker_id or auth.uid() = liked_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "likes_delete_own"  on public.likes for delete using (auth.uid() = liker_id); exception when duplicate_object then null; end $$;

-- ── Matches ───────────────────────────────────────────────────────────────────
-- Columns match: MatchesPage.tsx, database.types.ts (includes is_active)
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid references auth.users(id) on delete cascade not null,
  user2_id    uuid references auth.users(id) on delete cascade not null,
  status      text default 'accepted' check (status in ('pending','accepted','rejected','blocked')),
  is_active   boolean default true,
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

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 3 — SOCIAL FEED & MESSAGING                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Posts — column "type" (not "post_type") ───────────────────────────────────
-- AdminContent.tsx uses: type, content, image_url, video_url, likes_count,
--                        comments_count, is_deleted
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
create index if not exists posts_user_idx  on public.posts(user_id);
create index if not exists posts_feed_idx  on public.posts(created_at desc) where not is_deleted;
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
-- ChatPage filters: receiver_id=eq.${user.id}
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
do $$ begin create policy "messages_select_own"  on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "messages_insert_own"  on public.messages for insert with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "messages_update_own"  on public.messages for update using (auth.uid() = sender_id or auth.uid() = receiver_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "messages_delete_own"  on public.messages for delete using (auth.uid() = sender_id); exception when duplicate_object then null; end $$;

-- ── Notifications ─────────────────────────────────────────────────────────────
-- NotificationsPage: markAllRead, deleteNotif, markRead persist to Supabase
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

-- ── Anonymous / Spin Chats ────────────────────────────────────────────────────
create table if not exists public.anonymous_chats (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid references auth.users(id) on delete cascade,
  user2_id   uuid references auth.users(id) on delete cascade,
  is_active  boolean default true,
  revealed   boolean default false,
  started_at timestamptz default now(),
  ended_at   timestamptz
);
alter table public.anonymous_chats enable row level security;
do $$ begin create policy "anon_chats_own" on public.anonymous_chats for all using (auth.uid() = user1_id or auth.uid() = user2_id); exception when duplicate_object then null; end $$;

-- ── Video Calls ───────────────────────────────────────────────────────────────
create table if not exists public.video_calls (
  id         uuid primary key default gen_random_uuid(),
  caller_id  uuid references auth.users(id) on delete cascade,
  callee_id  uuid references auth.users(id) on delete cascade,
  room_id    text,
  call_type  text default 'video' check (call_type in ('video','audio','spin_video','spin_audio')),
  status     text default 'ringing' check (status in ('ringing','active','ended','missed','rejected')),
  started_at timestamptz,
  ended_at   timestamptz,
  duration_s int,
  created_at timestamptz default now()
);
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
do $$ begin create policy "user_reports_insert"     on public.user_reports for insert with check (auth.uid() = reporter_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "user_reports_select_own" on public.user_reports for select using (auth.uid() = reporter_id); exception when duplicate_object then null; end $$;

-- ── User Blocks ───────────────────────────────────────────────────────────────
create table if not exists public.user_blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users(id) on delete cascade not null,
  blocked_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;
do $$ begin create policy "blocks_insert" on public.user_blocks for insert with check (auth.uid() = blocker_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "blocks_select" on public.user_blocks for select using (auth.uid() = blocker_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "blocks_delete" on public.user_blocks for delete using (auth.uid() = blocker_id); exception when duplicate_object then null; end $$;

-- ── Content Reports — AdminReports.tsx ───────────────────────────────────────
-- AdminReports queries: status, admin_note, updated_at
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

-- ── Group Rooms ───────────────────────────────────────────────────────────────
create table if not exists public.group_rooms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  emoji        text default '👥',
  avatar_url   text,
  created_by   uuid references auth.users(id) on delete set null,
  is_public    boolean default true,
  member_count int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.group_rooms enable row level security;
do $$ begin create policy "group_rooms_select_public" on public.group_rooms for select using (is_public = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_rooms_insert_auth"   on public.group_rooms for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_rooms_update_own"    on public.group_rooms for update using (auth.uid() = created_by); exception when duplicate_object then null; end $$;
select public.apply_updated_at('group_rooms');

-- ── Group Members ─────────────────────────────────────────────────────────────
create table if not exists public.group_members (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid references public.group_rooms(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  role      text default 'member' check (role in ('admin','moderator','member')),
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);
create index if not exists group_members_room_idx on public.group_members(room_id);
create index if not exists group_members_user_idx on public.group_members(user_id);
alter table public.group_members enable row level security;
do $$ begin create policy "group_members_select" on public.group_members for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_members_insert" on public.group_members for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_members_delete" on public.group_members for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── Group Messages ────────────────────────────────────────────────────────────
create table if not exists public.group_messages (
  id         bigserial primary key,
  room_id    uuid references public.group_rooms(id) on delete cascade not null,
  sender_id  uuid references auth.users(id) on delete cascade not null,
  content    text,
  type       text default 'text' check (type in ('text','image','video','file')),
  is_deleted boolean default false,
  created_at timestamptz default now()
);
create index if not exists group_messages_room_idx on public.group_messages(room_id, created_at desc);
alter table public.group_messages enable row level security;
do $$ begin create policy "group_messages_select" on public.group_messages for select using (not is_deleted); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_messages_insert" on public.group_messages for insert with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "group_messages_delete" on public.group_messages for delete using (auth.uid() = sender_id); exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 4 — MARKETPLACE                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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
do $$ begin create policy "market_select_active" on public.marketplace_items for select using (is_active = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "market_insert_own"    on public.marketplace_items for insert with check (auth.uid() = seller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "market_update_own"    on public.marketplace_items for update using (auth.uid() = seller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "market_delete_own"    on public.marketplace_items for delete using (auth.uid() = seller_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('marketplace_items');

create table if not exists public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  item_id    uuid references public.marketplace_items(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);
alter table public.wishlist enable row level security;
do $$ begin create policy "wishlist_own" on public.wishlist for all using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

create table if not exists public.marketplace_orders (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid references auth.users(id) on delete cascade,
  seller_id  uuid references auth.users(id) on delete cascade,
  item_id    uuid references public.marketplace_items(id) on delete set null,
  quantity   int default 1,
  total_usd  numeric(12,2),
  status     text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled','refunded')),
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists orders_buyer_idx  on public.marketplace_orders(buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.marketplace_orders(seller_id, created_at desc);
alter table public.marketplace_orders enable row level security;
do $$ begin create policy "orders_select_own"  on public.marketplace_orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "orders_insert_own"  on public.marketplace_orders for insert with check (auth.uid() = buyer_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "orders_update_own"  on public.marketplace_orders for update using (auth.uid() = buyer_id or auth.uid() = seller_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('marketplace_orders');

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 5 — SMARTZTV / STREAMING                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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
create index if not exists streams_live_idx     on public.streams(is_live, created_at desc);
create index if not exists streams_category_idx on public.streams(category);
create index if not exists streams_creator_idx  on public.streams(creator_id);
alter table public.streams enable row level security;
do $$ begin create policy "streams_select_all" on public.streams for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "streams_insert_own" on public.streams for insert with check (auth.uid() = creator_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "streams_update_own" on public.streams for update using (auth.uid() = creator_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('streams');

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

create table if not exists public.stream_gifts (
  id         uuid primary key default gen_random_uuid(),
  stream_id  uuid references public.streams(id) on delete cascade,
  sender_id  uuid references auth.users(id) on delete cascade,
  gift_type  text not null,
  gift_emoji text,
  coins_cost int default 0,
  created_at timestamptz default now()
);
alter table public.stream_gifts enable row level security;
do $$ begin create policy "stream_gifts_insert" on public.stream_gifts for insert with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "stream_gifts_select" on public.stream_gifts for select using (true); exception when duplicate_object then null; end $$;

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
-- ║  SECTION 6 — SMARTZRIDE                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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
-- ║  SECTION 7 — PAYMENTS & SUBSCRIPTIONS                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Columns match: AdminSubscriptions.tsx (is_active, badge)
create table if not exists public.subscription_plans (
  id          text primary key,
  name        text not null,
  price_usd   numeric(8,2) default 0,
  price_month numeric(8,2) default 0,
  badge       text,
  features    text[],
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);
insert into public.subscription_plans(id, name, price_usd, price_month, sort_order, badge, features) values
  ('free',    'Free',    0,     0,     1, null,     ARRAY['Browse profiles','Basic chat','Social feed']),
  ('premium', 'Premium', 9.99,  9.99,  2, '💕',    ARRAY['Unlimited swipes','See who liked you','Priority matching','No ads']),
  ('vip',     'VIP',     24.99, 24.99, 3, '👑',    ARRAY['All Premium','Live streaming','Marketplace seller','Ride priority','VIP badge'])
on conflict (id) do nothing;
alter table public.subscription_plans enable row level security;
do $$ begin create policy "plans_select_all" on public.subscription_plans for select using (true); exception when duplicate_object then null; end $$;

-- Columns match: AdminSubscriptions.tsx (is_active, status, expires_at, payment_ref, notes)
create table if not exists public.user_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  plan_id     text references public.subscription_plans(id),
  status      text default 'active' check (status in ('active','cancelled','expired','pending')),
  is_active   boolean default true,
  started_at  timestamptz default now(),
  expires_at  timestamptz,
  payment_ref text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists subs_user_idx on public.user_subscriptions(user_id, is_active);
alter table public.user_subscriptions enable row level security;
do $$ begin create policy "subs_select_own"  on public.user_subscriptions for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "subs_insert_own"  on public.user_subscriptions for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "subs_update_own"  on public.user_subscriptions for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('user_subscriptions');

create table if not exists public.mobile_money_payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  provider       text not null check (provider in ('mtn','orange','other')),
  phone_number   text,
  amount_usd     numeric(10,2) not null,
  amount_local   numeric(12,2),
  currency_local text default 'LRD',
  transaction_id text unique,
  plan_id        text,
  status         text default 'pending' check (status in ('pending','confirmed','rejected','refunded')),
  notes          text,
  verified_by    uuid,
  verified_at    timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists payments_user_idx   on public.mobile_money_payments(user_id, created_at desc);
create index if not exists payments_status_idx on public.mobile_money_payments(status);
alter table public.mobile_money_payments enable row level security;
do $$ begin create policy "payments_insert_own"  on public.mobile_money_payments for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "payments_select_own"  on public.mobile_money_payments for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
select public.apply_updated_at('mobile_money_payments');

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
-- ║  SECTION 8 — CONTENT & ADMIN                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- blog_posts — columns match BlogPage.tsx query exactly:
--   id, title, slug, excerpt, content, image_url, category, featured,
--   author_name, author_role, read_time (text), tags, views_count,
--   likes_count, status, published_at, created_at
create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references auth.users(id) on delete set null,
  author_name  text,
  author_role  text,
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  content      text,
  image_url    text,
  category     text default 'General',
  tags         text[],
  featured     boolean default false,
  status       text default 'draft' check (status in ('draft','published','archived')),
  views_count  int default 0,
  likes_count  int default 0,
  read_time    text default '5 min read',
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists blog_posts_status_idx    on public.blog_posts(status, published_at desc);
create index if not exists blog_posts_slug_idx      on public.blog_posts(slug);
create index if not exists blog_posts_featured_idx  on public.blog_posts(featured) where status = 'published';
alter table public.blog_posts enable row level security;
do $$ begin create policy "blog_select_published" on public.blog_posts for select using (status = 'published'); exception when duplicate_object then null; end $$;
do $$ begin create policy "blog_insert_auth"      on public.blog_posts for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "blog_update_auth"      on public.blog_posts for update using (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "blog_delete_auth"      on public.blog_posts for delete using (auth.uid() is not null); exception when duplicate_object then null; end $$;
select public.apply_updated_at('blog_posts');

-- Patch existing blog_posts tables (safe to run on already-created tables)
do $$ begin alter table public.blog_posts add column if not exists author_name  text;            exception when others then null; end $$;
do $$ begin alter table public.blog_posts add column if not exists author_role  text;            exception when others then null; end $$;
do $$ begin alter table public.blog_posts add column if not exists image_url    text;            exception when others then null; end $$;
do $$ begin alter table public.blog_posts add column if not exists featured     boolean default false; exception when others then null; end $$;
do $$ begin alter table public.blog_posts add column if not exists likes_count  int default 0;  exception when others then null; end $$;
do $$ begin alter table public.blog_posts alter column read_time type text using read_time::text; exception when others then null; end $$;

-- ── Team Members — columns match TeamPage.tsx query exactly ──────────────────
-- TeamPage queries: full_name, role, photo_url, country, bio, skills,
--                   linkedin_url, twitter_url, joined_year, is_advisor,
--                   organization, is_active (filter), display_order (sort)
create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  role          text not null,
  bio           text,
  photo_url     text,
  emoji         text,
  country       text,
  organization  text,
  skills        text[],
  linkedin_url  text,
  twitter_url   text,
  joined_year   text,
  display_order int default 0,
  is_active     boolean default true,
  is_advisor    boolean default false,
  created_at    timestamptz default now()
);
create index if not exists team_members_order_idx on public.team_members(display_order) where is_active;
alter table public.team_members enable row level security;
do $$ begin create policy "team_select_active" on public.team_members for select using (is_active = true); exception when duplicate_object then null; end $$;

-- Sample team member (update or delete as needed)
insert into public.team_members(full_name, role, bio, country, skills, display_order, is_advisor)
values (
  'Shedrick K. Nungehn',
  'Founder & CEO',
  'Visionary entrepreneur and founder of SmartzConnect — Africa''s #1 social and dating platform. Born and raised in Liberia, Shedrick built SmartzConnect to connect Africans across the world through technology, love, and community.',
  'Liberia 🇱🇷',
  ARRAY['Leadership','Product Vision','Strategy','Technology','African Markets'],
  1,
  false
) on conflict do nothing;

-- ── Ad Campaigns — AdminAds.tsx ───────────────────────────────────────────────
create table if not exists public.ad_campaigns (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  advertiser  text,
  type        text default 'banner' check (type in ('banner','video','sponsored','popup')),
  budget_usd  numeric(10,2) default 0,
  spent_usd   numeric(10,2) default 0,
  impressions int default 0,
  clicks      int default 0,
  ctr         numeric(5,4) default 0,
  status      text default 'pending' check (status in ('active','paused','pending','ended','rejected')),
  placement   text,
  image_url   text,
  target_url  text,
  target_demo jsonb,
  start_date  date,
  end_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.ad_campaigns enable row level security;
do $$ begin create policy "ads_select_active" on public.ad_campaigns for select using (status = 'active'); exception when duplicate_object then null; end $$;
do $$ begin create policy "ads_insert_auth"   on public.ad_campaigns for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
select public.apply_updated_at('ad_campaigns');

-- ── Broadcast Messages — AdminBroadcasts.tsx ─────────────────────────────────
create table if not exists public.broadcast_messages (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text not null,
  emoji          text default '📢',
  target_segment text default 'all',
  target_country text,
  target_plan    text,
  recipient_count int default 0,
  sent_by        uuid references auth.users(id),
  sent_at        timestamptz default now()
);
alter table public.broadcast_messages enable row level security;
do $$ begin create policy "broadcasts_insert_auth" on public.broadcast_messages for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "broadcasts_select_auth" on public.broadcast_messages for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- ── Safety Rules — AdminSafety.tsx: order_num, active ────────────────────────
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

-- ── Feature Permissions — AdminSafety.tsx ────────────────────────────────────
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
insert into public.feature_permissions(feature_name, free_allowed, premium_req, vip_req, description) values
  ('discover_swipe',    true,  false, false, 'Basic swipe/discover'),
  ('unlimited_swipes',  false, true,  false, 'Remove daily swipe limit'),
  ('see_who_liked_you', false, true,  false, 'See incoming likes'),
  ('live_streaming',    false, false, true,  'Start a live stream'),
  ('marketplace_sell',  false, true,  false, 'List items in marketplace'),
  ('boost_profile',     false, true,  false, 'Boost profile visibility'),
  ('super_like',        false, true,  false, 'Send super likes'),
  ('read_receipts',     true,  false, false, 'See message read status'),
  ('vip_badge',         false, false, true,  'VIP verification badge')
on conflict (feature_name) do nothing;

-- ── Audit Logs — AdminDashboard.tsx ──────────────────────────────────────────
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

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 9 — PUSH NOTIFICATIONS                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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
-- ║  SECTION 10 — STORAGE BUCKETS                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

do $$ begin
  insert into storage.buckets(id, name, public) values
    ('user-uploads',      'user-uploads',      true),
    ('posts',             'posts',              true),
    ('marketplace',       'marketplace',        true),
    ('stream-thumbnails', 'stream-thumbnails',  true)
  on conflict (id) do nothing;
exception when others then null; end $$;

do $$ begin create policy "user_uploads_auth_insert" on storage.objects for insert with check (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]); exception when duplicate_object then null; end $$;
do $$ begin create policy "user_uploads_public_read" on storage.objects for select using (bucket_id = 'user-uploads'); exception when duplicate_object then null; end $$;
do $$ begin create policy "user_uploads_own_update"  on storage.objects for update using (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]); exception when duplicate_object then null; end $$;
do $$ begin create policy "user_uploads_own_delete"  on storage.objects for delete using (bucket_id = 'user-uploads' and auth.uid()::text = (storage.foldername(name))[1]); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_auth_insert"        on storage.objects for insert with check (bucket_id = 'posts' and auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "posts_public_read"        on storage.objects for select using (bucket_id = 'posts'); exception when duplicate_object then null; end $$;
do $$ begin create policy "marketplace_auth_insert"  on storage.objects for insert with check (bucket_id = 'marketplace' and auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "marketplace_public_read"  on storage.objects for select using (bucket_id = 'marketplace'); exception when duplicate_object then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 11 — REALTIME PUBLICATION                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

do $$ begin alter publication supabase_realtime add table public.messages;              exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications;         exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.matches;               exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.video_calls;           exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.posts;                 exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.stream_comments;       exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.streams;               exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.ride_requests;         exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.mobile_money_payments; exception when others then null; end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 12 — PAYMENT TRIGGER FUNCTIONS                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create or replace function public.expire_old_mobile_payments()
returns void language plpgsql security definer as $$
begin
  update public.mobile_money_payments
  set status = 'rejected'
  where status = 'pending'
    and created_at < now() - interval '15 minutes';
end $$;

create or replace function public.activate_subscription_on_payment()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'confirmed' and old.status = 'pending' then
    insert into public.user_subscriptions (user_id, plan_id, status, is_active, started_at, expires_at, payment_ref)
    values (
      new.user_id,
      coalesce(new.plan_id, 'premium'),
      'active', true, now(), now() + interval '30 days',
      new.transaction_id
    ) on conflict do nothing;

    update public.profiles
    set subscription_tier = coalesce(new.plan_id, 'premium')
    where id = new.user_id;

    insert into public.notifications (user_id, type, title, body, emoji, data)
    values (
      new.user_id, 'payment',
      '🎉 Subscription Activated!',
      'Your ' || initcap(coalesce(new.plan_id, 'Premium')) || ' plan is now active. Enjoy your features!',
      '💳',
      jsonb_build_object('plan', new.plan_id, 'payment_id', new.id)
    );
  end if;
  return new;
end $$;

drop trigger if exists on_payment_verified on public.mobile_money_payments;
create trigger on_payment_verified
  after update on public.mobile_money_payments
  for each row execute function public.activate_subscription_on_payment();

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SECTION 13 — VERIFICATION (run after to confirm setup)                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

select
  table_name,
  (select count(*) from information_schema.columns c
   where c.table_name = t.table_name and c.table_schema = 'public') as columns
from information_schema.tables t
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;
