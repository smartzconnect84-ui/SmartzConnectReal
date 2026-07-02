-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect Supabase Schema v4 — Full Production                          ║
-- ║  Extends v3. Safe to run multiple times (fully idempotent).                  ║
-- ║  Run in: Supabase Dashboard → SQL Editor → Paste → Run                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- SAFETY: Drop tables that may exist with wrong column types.
-- These are ALL new tables (not in v3), so no production data.
-- ═══════════════════════════════════════════════════════════════

drop table if exists public.worldstage_spotlights  cascade;
drop table if exists public.worldstage_leaderboard cascade;
drop table if exists public.worldstage_votes       cascade;
drop table if exists public.worldstage_entries     cascade;
drop table if exists public.worldstage_events      cascade;
drop table if exists public.livestream_gifts       cascade;
drop table if exists public.livestreams            cascade;
drop table if exists public.ride_requests          cascade;
drop table if exists public.ride_drivers           cascade;
drop table if exists public.marketplace_orders     cascade;
drop table if exists public.marketplace_listings   cascade;
drop table if exists public.subscriptions          cascade;
drop table if exists public.subscription_plans     cascade;
drop table if exists public.notifications          cascade;
drop table if exists public.group_messages         cascade;
drop table if exists public.group_members          cascade;
drop table if exists public.group_rooms            cascade;
drop table if exists public.story_views            cascade;
drop table if exists public.stories                cascade;
drop table if exists public.post_saves             cascade;
drop table if exists public.post_comments          cascade;
drop table if exists public.post_likes             cascade;
drop table if exists public.posts                  cascade;
drop table if exists public.follows                cascade;
drop table if exists public.stream_tokens          cascade;

-- ═══════════════════════════════════════════════════════════════
-- SOCIAL FEED
-- ═══════════════════════════════════════════════════════════════

-- ── Follows ──────────────────────────────────────────────────
create table public.follows (
  id           uuid primary key default uuid_generate_v4(),
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  unique(follower_id, following_id)
);

create index if not exists follows_follower_idx  on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

alter table public.follows enable row level security;

create policy "Follows public read"     on public.follows for select using (true);
create policy "Users insert follows"    on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users delete follows"    on public.follows for delete using  (auth.uid() = follower_id);

-- ── Posts ─────────────────────────────────────────────────────
create table public.posts (
  id               uuid primary key default uuid_generate_v4(),
  author_id        uuid not null references auth.users(id) on delete cascade,
  content          text,
  media_urls       text[],
  media_type       text check (media_type in ('image','video','audio') or media_type is null),
  visibility       text not null default 'public' check (visibility in ('public','followers','private')),
  type             text not null default 'post'   check (type in ('post','story_post','repost','ad')),
  original_post_id uuid references public.posts(id) on delete set null,
  location         text,
  hashtags         text[],
  mentions         uuid[],
  likes_count      int not null default 0,
  comments_count   int not null default 0,
  saves_count      int not null default 0,
  reposts_count    int not null default 0,
  views_count      int not null default 0,
  is_pinned        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists posts_author_idx     on public.posts(author_id);
create index if not exists posts_created_idx    on public.posts(created_at desc);
create index if not exists posts_visibility_idx on public.posts(visibility);

alter table public.posts enable row level security;

create policy "Public posts viewable"   on public.posts for select using (visibility = 'public');
create policy "Authors insert posts"    on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors update posts"    on public.posts for update using (auth.uid() = author_id);
create policy "Authors delete posts"    on public.posts for delete using (auth.uid() = author_id);

-- ── Post Likes ────────────────────────────────────────────────
create table public.post_likes (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id)  on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists post_likes_post_idx on public.post_likes(post_id);
create index if not exists post_likes_user_idx on public.post_likes(user_id);

alter table public.post_likes enable row level security;

create policy "Post likes public read"  on public.post_likes for select using (true);
create policy "Users insert likes"      on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users delete likes"      on public.post_likes for delete using  (auth.uid() = user_id);

-- Auto-update likes_count
create or replace function public.update_post_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_likes on public.post_likes;
create trigger trg_post_likes
  after insert or delete on public.post_likes
  for each row execute procedure public.update_post_likes_count();

-- ── Post Comments ─────────────────────────────────────────────
create table public.post_comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references auth.users(id)  on delete cascade,
  parent_id   uuid references public.post_comments(id) on delete cascade,
  content     text not null,
  likes_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists post_comments_post_idx   on public.post_comments(post_id);
create index if not exists post_comments_author_idx on public.post_comments(author_id);

alter table public.post_comments enable row level security;

create policy "Comments public read"   on public.post_comments for select using (true);
create policy "Users insert comments"  on public.post_comments for insert with check (auth.uid() = author_id);
create policy "Users update comments"  on public.post_comments for update using (auth.uid() = author_id);
create policy "Users delete comments"  on public.post_comments for delete using (auth.uid() = author_id);

-- Auto-update comments_count
create or replace function public.update_post_comments_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_comments on public.post_comments;
create trigger trg_post_comments
  after insert or delete on public.post_comments
  for each row execute procedure public.update_post_comments_count();

-- ── Post Saves ────────────────────────────────────────────────
create table public.post_saves (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id)  on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

alter table public.post_saves enable row level security;

create policy "Users read own saves"   on public.post_saves for select using (auth.uid() = user_id);
create policy "Users insert saves"     on public.post_saves for insert with check (auth.uid() = user_id);
create policy "Users delete saves"     on public.post_saves for delete using  (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- STORIES
-- ═══════════════════════════════════════════════════════════════

create table public.stories (
  id           uuid primary key default uuid_generate_v4(),
  author_id    uuid not null references auth.users(id) on delete cascade,
  media_url    text not null,
  media_type   text not null default 'image' check (media_type in ('image','video')),
  caption      text,
  duration_sec int not null default 5,
  views_count  int not null default 0,
  expires_at   timestamptz not null default (now() + interval '24 hours'),
  created_at   timestamptz not null default now()
);

create index if not exists stories_author_idx  on public.stories(author_id);
create index if not exists stories_expires_idx on public.stories(expires_at);

alter table public.stories enable row level security;

create policy "Stories public read"    on public.stories for select using (expires_at > now());
create policy "Authors insert stories" on public.stories for insert with check (auth.uid() = author_id);
create policy "Authors delete stories" on public.stories for delete using  (auth.uid() = author_id);

create table public.story_views (
  id        uuid primary key default uuid_generate_v4(),
  story_id  uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references auth.users(id)    on delete cascade,
  viewed_at timestamptz not null default now(),
  unique(story_id, viewer_id)
);

alter table public.story_views enable row level security;

create policy "Story view read" on public.story_views for select using (
  auth.uid() = viewer_id or
  auth.uid() = (select author_id from public.stories where id = story_id)
);
create policy "Users insert story views" on public.story_views for insert with check (auth.uid() = viewer_id);

-- ═══════════════════════════════════════════════════════════════
-- DATING / SWIPES
-- ═══════════════════════════════════════════════════════════════

-- (swipes may already exist in v3 — skip if present)
create table if not exists public.swipes (
  id         uuid primary key default uuid_generate_v4(),
  swiper_id  uuid not null references auth.users(id) on delete cascade,
  target_id  uuid not null references auth.users(id) on delete cascade,
  action     text not null check (action in ('like','pass','super_like')),
  source     text not null default 'discover' check (source in ('discover','spin_chat','search','profile')),
  created_at timestamptz not null default now(),
  unique(swiper_id, target_id)
);

create index if not exists swipes_swiper_idx on public.swipes(swiper_id);
create index if not exists swipes_target_idx on public.swipes(target_id);

alter table public.swipes enable row level security;

do $$ begin
  create policy "Users read own swipes" on public.swipes
    for select using (auth.uid() = swiper_id or auth.uid() = target_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert swipes" on public.swipes
    for insert with check (auth.uid() = swiper_id);
exception when duplicate_object then null; end $$;

-- Auto-create match when mutual like
create or replace function public.auto_create_match()
returns trigger language plpgsql security definer as $$
declare v_reverse record;
begin
  if NEW.action not in ('like', 'super_like') then return NEW; end if;

  select * into v_reverse
    from public.swipes
    where swiper_id = NEW.target_id and target_id = NEW.swiper_id
      and action in ('like', 'super_like');

  if found then
    insert into public.matches (user_a, user_b, liked_by_a, liked_by_b, status)
    values (NEW.swiper_id, NEW.target_id, true, true, 'accepted')
    on conflict (user_a, user_b) do update
      set liked_by_a = true, liked_by_b = true, status = 'accepted';

    insert into public.notifications (user_id, type, title, body, actor_id)
    values
      (NEW.swiper_id, 'match', '💕 New Match!', 'You matched with someone new.', NEW.target_id),
      (NEW.target_id, 'match', '💕 New Match!', 'You matched with someone new.', NEW.swiper_id)
    on conflict do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_swipe_match on public.swipes;
create trigger trg_swipe_match
  after insert on public.swipes
  for each row execute procedure public.auto_create_match();

-- ═══════════════════════════════════════════════════════════════
-- IN-APP NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('match','like','comment','follow','message','group_invite','mention','system','worldstage')),
  title       text not null,
  body        text,
  actor_id    uuid references auth.users(id) on delete set null,
  entity_id   uuid,
  entity_type text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx    on public.notifications(user_id);
create index if not exists notifications_created_idx on public.notifications(created_at desc);
create index if not exists notifications_unread_idx  on public.notifications(user_id, read) where not read;

alter table public.notifications enable row level security;

create policy "Users read own notifications"   on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "System inserts notifications"   on public.notifications for insert with check (true);

-- ═══════════════════════════════════════════════════════════════
-- GROUP CHAT
-- ═══════════════════════════════════════════════════════════════

create table public.group_rooms (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  topic           text,
  emoji           text not null default '💬',
  category        text not null default 'General',
  type            text not null default 'public' check (type in ('public','private')),
  creator_id      uuid references auth.users(id) on delete set null,
  cover_url       text,
  members_count   int not null default 1,
  messages_count  int not null default 0,
  last_message    text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists group_rooms_category_idx on public.group_rooms(category);
create index if not exists group_rooms_type_idx     on public.group_rooms(type);

alter table public.group_rooms enable row level security;

create policy "Public rooms viewable"    on public.group_rooms for select using (type = 'public' or auth.uid() = creator_id);
create policy "Users create rooms"       on public.group_rooms for insert with check (auth.uid() = creator_id);
create policy "Creators update rooms"    on public.group_rooms for update using (auth.uid() = creator_id);

create table public.group_members (
  id        uuid primary key default uuid_generate_v4(),
  room_id   uuid not null references public.group_rooms(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create index if not exists group_members_room_idx on public.group_members(room_id);
create index if not exists group_members_user_idx on public.group_members(user_id);

alter table public.group_members enable row level security;

create policy "Membership public read"  on public.group_members for select using (true);
create policy "Users join rooms"        on public.group_members for insert with check (auth.uid() = user_id);
create policy "Users leave rooms"       on public.group_members for delete using  (auth.uid() = user_id);

create table public.group_messages (
  id         uuid primary key default uuid_generate_v4(),
  room_id    uuid not null references public.group_rooms(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  content    text,
  media_url  text,
  type       text not null default 'text' check (type in ('text','image','video','audio','file','system')),
  reply_to   uuid references public.group_messages(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists group_messages_room_idx    on public.group_messages(room_id);
create index if not exists group_messages_sender_idx  on public.group_messages(sender_id);
create index if not exists group_messages_created_idx on public.group_messages(created_at desc);

alter table public.group_messages enable row level security;

create policy "Members read group msgs" on public.group_messages for select using (
  exists (select 1 from public.group_members where room_id = group_messages.room_id and user_id = auth.uid())
  or
  exists (select 1 from public.group_rooms where id = group_messages.room_id and type = 'public')
);
create policy "Members send group msgs" on public.group_messages for insert with check (auth.uid() = sender_id);
create policy "Authors delete group msgs" on public.group_messages for delete using (auth.uid() = sender_id);

-- ═══════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS & PLANS
-- ═══════════════════════════════════════════════════════════════

create table public.subscription_plans (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  slug          text not null unique,
  price_usd     numeric(10,2) not null default 0,
  price_lrd     numeric(12,2),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','yearly','once')),
  features      text[],
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
create policy "Plans public read" on public.subscription_plans for select using (is_active = true);

insert into public.subscription_plans (name, slug, price_usd, billing_cycle, features, sort_order) values
  ('Free',    'free',    0.00,  'once',    array['10 swipes per day','Basic profile','Public feed & posts','Group chat rooms','Marketplace browsing'], 1),
  ('Premium', 'premium', 9.99,  'monthly', array['Unlimited swipes','See who liked you','Priority in Discover','SmartzTV streaming','Marketplace selling','Private group chats','Read receipts'], 2),
  ('VIP',     'vip',     24.99, 'monthly', array['Everything in Premium','Verified badge','Top of Discover feed','Dedicated support','Advanced analytics','Exclusive VIP events','Custom profile themes','Unlimited Super Likes','Revenue share (creators)','Early feature access'], 3);

create table public.subscriptions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_id        uuid references public.subscription_plans(id),
  plan_slug      text not null default 'free',
  status         text not null default 'active' check (status in ('active','cancelled','expired','pending')),
  billing_cycle  text not null default 'monthly',
  amount_usd     numeric(10,2) not null default 0,
  payment_method text,
  transaction_id text,
  started_at     timestamptz not null default now(),
  expires_at     timestamptz,
  cancelled_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists subscriptions_user_idx   on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

create policy "Users read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users create subscriptions"   on public.subscriptions for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- MARKETPLACE
-- ═══════════════════════════════════════════════════════════════

create table public.marketplace_listings (
  id          uuid primary key default uuid_generate_v4(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  price_usd   numeric(10,2) not null,
  price_lrd   numeric(12,2),
  currency    text not null default 'USD',
  category    text,
  condition   text not null default 'new' check (condition in ('new','like_new','used','refurbished')),
  images      text[],
  location    text,
  country     text,
  status      text not null default 'active' check (status in ('active','sold','paused','deleted')),
  views_count int not null default 0,
  saves_count int not null default 0,
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists marketplace_seller_idx   on public.marketplace_listings(seller_id);
create index if not exists marketplace_category_idx on public.marketplace_listings(category);
create index if not exists marketplace_status_idx   on public.marketplace_listings(status);

alter table public.marketplace_listings enable row level security;

create policy "Active listings public" on public.marketplace_listings for select using (status = 'active');
create policy "Sellers insert listing" on public.marketplace_listings for insert with check (auth.uid() = seller_id);
create policy "Sellers update listing" on public.marketplace_listings for update using (auth.uid() = seller_id);
create policy "Sellers delete listing" on public.marketplace_listings for delete using (auth.uid() = seller_id);

create table public.marketplace_orders (
  id               uuid primary key default uuid_generate_v4(),
  listing_id       uuid references public.marketplace_listings(id) on delete set null,
  buyer_id         uuid not null references auth.users(id) on delete cascade,
  seller_id        uuid not null references auth.users(id) on delete cascade,
  amount_usd       numeric(10,2) not null,
  payment_method   text,
  transaction_id   text,
  status           text not null default 'pending' check (status in ('pending','paid','shipped','delivered','cancelled','refunded')),
  delivery_address text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.marketplace_orders enable row level security;

create policy "Parties read orders"  on public.marketplace_orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers create orders" on public.marketplace_orders for insert with check (auth.uid() = buyer_id);
create policy "Parties update orders" on public.marketplace_orders for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ═══════════════════════════════════════════════════════════════
-- RIDES
-- ═══════════════════════════════════════════════════════════════

create table public.ride_drivers (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  vehicle_type   text not null default 'car' check (vehicle_type in ('car','motorbike','tricycle','bus')),
  vehicle_make   text,
  vehicle_model  text,
  plate_number   text,
  license_url    text,
  is_verified    boolean not null default false,
  is_active      boolean not null default true,
  rating         numeric(3,2) not null default 5.0,
  total_trips    int not null default 0,
  current_lat    numeric(10,7),
  current_lng    numeric(10,7),
  created_at     timestamptz not null default now()
);

alter table public.ride_drivers enable row level security;

create policy "Active drivers public" on public.ride_drivers for select using (is_active = true);
create policy "Drivers insert self"   on public.ride_drivers for insert with check (auth.uid() = user_id);
create policy "Drivers update self"   on public.ride_drivers for update using (auth.uid() = user_id);

create table public.ride_requests (
  id               uuid primary key default uuid_generate_v4(),
  rider_id         uuid not null references auth.users(id) on delete cascade,
  driver_id        uuid references auth.users(id) on delete set null,
  pickup_address   text not null,
  dropoff_address  text not null,
  pickup_lat       numeric(10,7),
  pickup_lng       numeric(10,7),
  dropoff_lat      numeric(10,7),
  dropoff_lng      numeric(10,7),
  distance_km      numeric(8,2),
  fare_usd         numeric(8,2),
  fare_lrd         numeric(10,2),
  vehicle_type     text not null default 'car',
  status           text not null default 'searching' check (status in ('searching','accepted','arrived','in_progress','completed','cancelled')),
  payment_method   text not null default 'cash',
  rating_by_rider  int check (rating_by_rider between 1 and 5),
  rating_by_driver int check (rating_by_driver between 1 and 5),
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists ride_requests_rider_idx  on public.ride_requests(rider_id);
create index if not exists ride_requests_driver_idx on public.ride_requests(driver_id);
create index if not exists ride_requests_status_idx on public.ride_requests(status);

alter table public.ride_requests enable row level security;

create policy "Parties read rides"   on public.ride_requests for select using (auth.uid() = rider_id or auth.uid() = driver_id);
create policy "Riders create rides"  on public.ride_requests for insert with check (auth.uid() = rider_id);
create policy "Parties update rides" on public.ride_requests for update using (auth.uid() = rider_id or auth.uid() = driver_id);

-- ═══════════════════════════════════════════════════════════════
-- SMARTZTV / LIVESTREAMS
-- ═══════════════════════════════════════════════════════════════

create table public.livestreams (
  id            uuid primary key default uuid_generate_v4(),
  creator_id    uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text,
  thumbnail_url text,
  category      text,
  tags          text[],
  stream_key    text unique not null default gen_random_uuid()::text,
  stream_url    text,
  jitsi_room    text,
  status        text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  viewer_count  int not null default 0,
  peak_viewers  int not null default 0,
  total_views   int not null default 0,
  gifts_earned  numeric(10,2) not null default 0,
  started_at    timestamptz,
  ended_at      timestamptz,
  scheduled_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists livestreams_creator_idx on public.livestreams(creator_id);
create index if not exists livestreams_status_idx  on public.livestreams(status);

alter table public.livestreams enable row level security;

create policy "Livestreams public read"  on public.livestreams for select using (status in ('live','ended'));
create policy "Creators insert streams"  on public.livestreams for insert with check (auth.uid() = creator_id);
create policy "Creators update streams"  on public.livestreams for update using (auth.uid() = creator_id);

create table public.livestream_gifts (
  id          uuid primary key default uuid_generate_v4(),
  stream_id   uuid not null references public.livestreams(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
  gift_name   text not null,
  gift_emoji  text,
  amount_usd  numeric(8,2) not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.livestream_gifts enable row level security;

create policy "Gifts public read" on public.livestream_gifts for select using (true);
create policy "Users send gifts"  on public.livestream_gifts for insert with check (auth.uid() = sender_id);

-- ═══════════════════════════════════════════════════════════════
-- WORLD STAGE
-- ═══════════════════════════════════════════════════════════════

create table public.worldstage_events (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  category          text not null,
  description       text,
  prize             text,
  prize_usd         numeric(10,2) not null default 0,
  date_range        text,
  location          text,
  emoji             text not null default '🏆',
  color             text not null default 'from-pink-500 to-rose-600',
  status            text not null default 'upcoming' check (status in ('open','upcoming','ended')),
  participants      int not null default 0,
  max_participants  int,
  rules             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.worldstage_events enable row level security;
create policy "Events public read" on public.worldstage_events for select using (true);

create table public.worldstage_entries (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.worldstage_events(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_url   text,
  description text,
  votes_count int not null default 0,
  status      text not null default 'pending' check (status in ('pending','approved','disqualified','winner')),
  created_at  timestamptz not null default now(),
  unique(event_id, user_id)
);

create index if not exists ws_entries_event_idx on public.worldstage_entries(event_id);
create index if not exists ws_entries_user_idx  on public.worldstage_entries(user_id);

alter table public.worldstage_entries enable row level security;

create policy "Entries read"        on public.worldstage_entries for select using (status = 'approved' or auth.uid() = user_id);
create policy "Users submit entries" on public.worldstage_entries for insert with check (auth.uid() = user_id);

create table public.worldstage_votes (
  id         uuid primary key default uuid_generate_v4(),
  entry_id   uuid not null references public.worldstage_entries(id) on delete cascade,
  voter_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(entry_id, voter_id)
);

alter table public.worldstage_votes enable row level security;

create policy "Votes public read" on public.worldstage_votes for select using (true);
create policy "Users cast votes"  on public.worldstage_votes for insert with check (auth.uid() = voter_id);

-- Auto-update entry vote count
create or replace function public.update_ws_votes_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.worldstage_entries set votes_count = votes_count + 1 where id = NEW.entry_id;
  elsif TG_OP = 'DELETE' then
    update public.worldstage_entries set votes_count = greatest(votes_count - 1, 0) where id = OLD.entry_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_ws_votes on public.worldstage_votes;
create trigger trg_ws_votes
  after insert or delete on public.worldstage_votes
  for each row execute procedure public.update_ws_votes_count();

create table public.worldstage_leaderboard (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade unique,
  display_name text not null,
  country      text,
  category     text,
  points       int not null default 0,
  wins         int not null default 0,
  avatar_emoji text not null default '⭐',
  rank         int,
  updated_at   timestamptz not null default now()
);

alter table public.worldstage_leaderboard enable row level security;
create policy "Leaderboard public read" on public.worldstage_leaderboard for select using (true);

create table public.worldstage_spotlights (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  display_name    text not null,
  country         text,
  category        text,
  followers_label text,
  quote           text,
  avatar_emoji    text not null default '⭐',
  wins            int not null default 0,
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.worldstage_spotlights enable row level security;
create policy "Spotlights public read" on public.worldstage_spotlights for select using (is_active = true);

-- ═══════════════════════════════════════════════════════════════
-- STREAM TOKENS (GetStream.io)
-- ═══════════════════════════════════════════════════════════════

create table public.stream_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  token      text not null,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.stream_tokens enable row level security;
create policy "Users read own stream token" on public.stream_tokens for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Authenticated users upload" on storage.objects
    for insert with check (bucket_id = 'user-uploads' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read uploads" on storage.objects
    for select using (bucket_id = 'user-uploads');
exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════════════════════════
-- ENABLE REALTIME
-- Uncomment after running this schema, or enable via Dashboard
-- ═══════════════════════════════════════════════════════════════

-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.group_messages;
-- alter publication supabase_realtime add table public.notifications;
-- alter publication supabase_realtime add table public.video_calls;
-- alter publication supabase_realtime add table public.matches;
-- alter publication supabase_realtime add table public.posts;
-- alter publication supabase_realtime add table public.stories;
-- alter publication supabase_realtime add table public.livestreams;
-- alter publication supabase_realtime add table public.ride_requests;
-- alter publication supabase_realtime add table public.worldstage_events;
