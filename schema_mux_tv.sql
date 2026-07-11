-- ============================================================
--  SmartzTV Cloud Broadcast — Mux-based TV Channel Schema
--  Run this in Supabase SQL editor
-- ============================================================

-- ── TV Channels ──────────────────────────────────────────────
create table if not exists tv_channels (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Identity
  name                text not null,
  slug                text unique,
  logo_url            text,
  cover_url           text,
  description         text,
  category            text not null default 'General',

  -- Mux stream credentials (admin-only — add RLS policy below)
  mux_stream_id       text,
  mux_playback_id     text,
  stream_key          text,          -- RTMP stream key
  rtmp_url            text,          -- RTMP ingest URL

  -- Public playback
  playback_url        text,          -- HLS .m3u8 URL

  -- Status
  stream_status       text not null default 'idle',   -- idle | active | disconnected
  is_active           boolean not null default false,
  is_featured         boolean not null default false,
  display_order       int not null default 0,

  -- Current programme
  current_program     text,
  viewer_count        int not null default 0
);

-- ── TV Schedules ─────────────────────────────────────────────
create table if not exists tv_schedules (
  id                  uuid primary key default gen_random_uuid(),
  channel_id          uuid not null references tv_channels(id) on delete cascade,
  title               text not null,
  description         text,
  thumbnail_url       text,
  category            text,
  starts_at           timestamptz not null,
  ends_at             timestamptz,
  is_recurring        boolean not null default false,
  recurrence          text,   -- 'daily' | 'weekly'
  created_at          timestamptz not null default now()
);

-- ── Channel Favourites ────────────────────────────────────────
create table if not exists tv_channel_favorites (
  user_id             uuid not null references profiles(id) on delete cascade,
  channel_id          uuid not null references tv_channels(id) on delete cascade,
  created_at          timestamptz not null default now(),
  primary key (user_id, channel_id)
);

-- ── Analytics (daily roll-up) ─────────────────────────────────
create table if not exists tv_channel_analytics (
  id                        uuid primary key default gen_random_uuid(),
  channel_id                uuid not null references tv_channels(id) on delete cascade,
  date                      date not null default current_date,
  peak_viewers              int not null default 0,
  total_watch_minutes       int not null default 0,
  stream_duration_minutes   int not null default 0,
  created_at                timestamptz not null default now(),
  unique (channel_id, date)
);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_tv_channels_active   on tv_channels (is_active, is_featured, display_order);
create index if not exists idx_tv_schedules_channel on tv_schedules (channel_id, starts_at);
create index if not exists idx_tv_analytics_channel on tv_channel_analytics (channel_id, date desc);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists tv_channels_updated_at on tv_channels;
create trigger tv_channels_updated_at
  before update on tv_channels
  for each row execute function touch_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
-- Enable row-level security
alter table tv_channels          enable row level security;
alter table tv_schedules         enable row level security;
alter table tv_channel_favorites enable row level security;
alter table tv_channel_analytics enable row level security;

-- Public: can see active channels (but NOT stream_key / rtmp_url)
-- We expose a view that hides sensitive columns for anon/user roles
drop view if exists tv_channels_public;
create view tv_channels_public as
  select id, created_at, name, slug, logo_url, cover_url, description,
         category, mux_playback_id, playback_url, stream_status,
         is_active, is_featured, display_order, current_program, viewer_count
  from tv_channels
  where is_active = true;

-- Full table read/write for authenticated admins only (check admin_users table)
drop policy if exists "admins_all_channels"    on tv_channels;
drop policy if exists "anon_read_channels"     on tv_channels;
drop policy if exists "admins_all_schedules"   on tv_schedules;
drop policy if exists "public_read_schedules"  on tv_schedules;
drop policy if exists "own_favorites"          on tv_channel_favorites;
drop policy if exists "admins_all_analytics"   on tv_channel_analytics;

-- tv_channels: admins full access
create policy "admins_all_channels" on tv_channels
  for all using (
    exists (select 1 from admin_users where id = auth.uid())
  );

-- tv_channels: authenticated/anon can read non-sensitive columns
-- (use the tv_channels_public view for public display)
create policy "anon_read_channels" on tv_channels
  for select using (is_active = true);

-- tv_schedules: admins full access
create policy "admins_all_schedules" on tv_schedules
  for all using (
    exists (select 1 from admin_users where id = auth.uid())
  );

-- tv_schedules: public can read
create policy "public_read_schedules" on tv_schedules
  for select using (
    exists (select 1 from tv_channels where id = channel_id and is_active = true)
  );

-- favorites: users manage their own
create policy "own_favorites" on tv_channel_favorites
  for all using (user_id = auth.uid());

-- analytics: admins only
create policy "admins_all_analytics" on tv_channel_analytics
  for all using (
    exists (select 1 from admin_users where id = auth.uid())
  );
