-- ============================================================
--  SmartzTV Mux columns patch — safe to re-run (IF NOT EXISTS)
--  Adds Mux broadcast columns to the existing tv_channels table
-- ============================================================

-- 1. Add missing columns to tv_channels
alter table tv_channels add column if not exists slug               text unique;
alter table tv_channels add column if not exists logo_url           text;
alter table tv_channels add column if not exists cover_url          text;
alter table tv_channels add column if not exists mux_stream_id      text;
alter table tv_channels add column if not exists mux_playback_id    text;
alter table tv_channels add column if not exists stream_key         text;
alter table tv_channels add column if not exists rtmp_url           text;
alter table tv_channels add column if not exists playback_url       text;
alter table tv_channels add column if not exists stream_status      text not null default 'idle';
alter table tv_channels add column if not exists is_active          boolean not null default false;
alter table tv_channels add column if not exists is_featured        boolean not null default false;
alter table tv_channels add column if not exists display_order      int not null default 0;
alter table tv_channels add column if not exists current_program    text;
alter table tv_channels add column if not exists viewer_count       int not null default 0;

-- 2. Index for public channel listing
create index if not exists idx_tv_channels_active
  on tv_channels (is_active, is_featured, display_order);

-- 3. Re-create public view (no sensitive columns)
drop view if exists tv_channels_public;
create view tv_channels_public as
  select
    id, created_at, name, slug, logo_url, cover_url, description,
    category, mux_playback_id, playback_url, stream_status,
    is_active, is_featured, display_order, current_program, viewer_count
  from tv_channels
  where is_active = true;

-- 4. Fix RLS policies that reference is_active
drop policy if exists "anon_read_channels"    on tv_channels;
drop policy if exists "public_read_schedules" on tv_schedules;

-- Public: any role can read active channels (sensitive cols hidden via view)
create policy "anon_read_channels" on tv_channels
  for select using (is_active = true);

-- Schedules: public can read schedules for active channels
create policy "public_read_schedules" on tv_schedules
  for select using (
    exists (select 1 from tv_channels where id = channel_id and is_active = true)
  );
