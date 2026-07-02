-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SmartzConnect — Schema v4 Addendum                                      ║
-- ║  Run this AFTER schema_complete.sql if already deployed.                 ║
-- ║  FULLY IDEMPOTENT — safe to run multiple times.                          ║
-- ║  Run in: Supabase Dashboard → SQL Editor → Paste → Run                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Helper (safe re-include) ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.apply_updated_at(tbl text) returns void language plpgsql as $$
begin
  execute format('
    create trigger trg_updated_at before update on public.%I
    for each row execute procedure public.set_updated_at()', tbl);
exception when duplicate_object then null;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  NEW: Swipes (Discover / Dating)                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  NEW: WorldStage Module                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

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
create index if not exists ws_events_status_idx    on public.worldstage_events(status, created_at desc);
create index if not exists ws_events_category_idx  on public.worldstage_events(category);
alter table public.worldstage_events enable row level security;
do $$ begin create policy "ws_events_select_all"  on public.worldstage_events for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_events_manage"      on public.worldstage_events for all using (auth.uid() is not null); exception when duplicate_object then null; end $$;
select public.apply_updated_at('worldstage_events');

-- Seed sample events (idempotent)
insert into public.worldstage_events(id, title, category, prize, date_range, location, participants, status, emoji, color, description) values
  ('a1000000-0000-0000-0000-000000000001', 'Africa Music Clash 2026',    'Music',          '$5,000 + Recording Deal', 'Jan 15 – Feb 28',  'Lagos, NG + Online',   1240, 'open',     '🎵', 'from-pink-500 to-purple-600',  'Open to all African artists. Upload a 60s original track.'),
  ('a1000000-0000-0000-0000-000000000002', 'SmartzTV Live Battle',       'Live Streaming', '$3,000 + VIP Badge',      'Feb 1 – Mar 15',   'Online',               876,  'open',     '📺', 'from-purple-500 to-blue-600',  'Grow the most viewers in 45 days. Top 3 win.'),
  ('a1000000-0000-0000-0000-000000000003', 'Pan-African Fashion Week',   'Fashion',        '$2,500 + Brand Deal',     'Mar 1 – Apr 30',   'Accra, GH + Online',   632,  'upcoming', '👗', 'from-yellow-500 to-orange-600','Submit your best 3-piece Afrocentric collection.'),
  ('a1000000-0000-0000-0000-000000000004', 'Tech Innovators Challenge',  'Tech',           '$10,000 Grant',           'Apr 15 – Jun 30',  'Nairobi, KE + Online', 421,  'upcoming', '💡', 'from-blue-500 to-cyan-600',    'Build a solution for an African community problem.'),
  ('a1000000-0000-0000-0000-000000000005', 'Comedy Kings & Queens',      'Comedy',         '$1,500 + Promo Package',  'Dec 1–31 2025',    'Online',               2100, 'ended',    '😂', 'from-green-500 to-teal-600',   'Best 2-minute stand-up skit wins.'),
  ('a1000000-0000-0000-0000-000000000006', 'Afro Dance Championship',    'Dance',          '$4,000 + Tour Invite',    'May 1 – Jul 15',   'Online + Abidjan, CI', 550,  'upcoming', '💃', 'from-red-500 to-pink-600',     'Solo, duo, or crew. Any Afro-fusion style.')
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
create index if not exists ws_lb_points_idx   on public.worldstage_leaderboard(points desc);
create index if not exists ws_lb_cat_idx      on public.worldstage_leaderboard(category);
alter table public.worldstage_leaderboard enable row level security;
do $$ begin create policy "ws_lb_select_all"  on public.worldstage_leaderboard for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_lb_update_own"  on public.worldstage_leaderboard for update using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_lb_insert_auth" on public.worldstage_leaderboard for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- Seed leaderboard (idempotent)
insert into public.worldstage_leaderboard(id, display_name, country, country_flag, category, points, avatar_emoji, event_count, wins) values
  ('b1000000-0000-0000-0000-000000000001', 'Amara D.',     'Nigeria',     '🇳🇬', 'Music',         9840, '👩🏿', 12, 4),
  ('b1000000-0000-0000-0000-000000000002', 'Kofi M.',      'Ghana',       '🇬🇭', 'Tech',          9200, '👨🏿', 8,  3),
  ('b1000000-0000-0000-0000-000000000003', 'Zara T.',      'Liberia',     '🇱🇷', 'Live Streaming',8750, '👩🏾', 10, 2),
  ('b1000000-0000-0000-0000-000000000004', 'Moussa K.',    'Côte d''Ivoire','🇨🇮', 'Dance',        7600, '👨🏾', 7,  2),
  ('b1000000-0000-0000-0000-000000000005', 'Sade A.',      'South Africa','🇿🇦', 'Fashion',       7100, '👩🏽', 9,  1),
  ('b1000000-0000-0000-0000-000000000006', 'Emmanuel O.',  'Kenya',       '🇰🇪', 'Comedy',        6900, '👨🏿', 6,  2),
  ('b1000000-0000-0000-0000-000000000007', 'Fatima B.',    'Senegal',     '🇸🇳', 'Music',         6400, '👩🏿', 5,  1),
  ('b1000000-0000-0000-0000-000000000008', 'Chidi E.',     'Nigeria',     '🇳🇬', 'Tech',          5800, '👨🏿', 4,  1),
  ('b1000000-0000-0000-0000-000000000009', 'Lina M.',      'Ethiopia',    '🇪🇹', 'Dance',         5200, '👩🏿', 6,  0),
  ('b1000000-0000-0000-0000-000000000010', 'Kwame A.',     'Ghana',       '🇬🇭', 'Live Streaming',4900, '👨🏾', 5,  1)
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
do $$ begin create policy "ws_spot_select_all"  on public.worldstage_spotlights for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "ws_spot_manage"      on public.worldstage_spotlights for all using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- Seed spotlights (idempotent)
insert into public.worldstage_spotlights(id, display_name, country, country_flag, category, followers_label, quote, avatar_emoji, wins) values
  ('c1000000-0000-0000-0000-000000000001', 'Amara D.',   'Nigeria',     '🇳🇬', 'Music',         '12.4K Followers', 'Africa''s sound will conquer the world. Keep creating.',  '👑', 4),
  ('c1000000-0000-0000-0000-000000000002', 'Kofi M.',    'Ghana',       '🇬🇭', 'Tech',          '8.1K Followers',  'Build solutions for Africa, by Africans.',              '🔥', 3),
  ('c1000000-0000-0000-0000-000000000003', 'Zara T.',    'Liberia',     '🇱🇷', 'Live Streaming','9.7K Followers',  'Stream your story. The world is watching.',             '⭐', 2)
on conflict (id) do nothing;

-- ── Fix: stream_tokens unique constraint (add user_id-only unique for tokenless upsert) ──
do $$ begin
  alter table public.stream_tokens add constraint stream_tokens_user_id_unique unique (user_id);
exception when duplicate_object then null; when others then null; end $$;

-- ── Realtime: enable for new tables ──────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table public.swipes;               exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.worldstage_leaderboard; exception when others then null; end $$;

-- ── Verification ──────────────────────────────────────────────────────────────
select table_name, (
  select count(*) from information_schema.columns c
  where c.table_name = t.table_name and c.table_schema = 'public'
) as cols
from information_schema.tables t
where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
  and t.table_name in ('swipes','worldstage_events','worldstage_leaderboard','worldstage_spotlights','stream_tokens')
order by table_name;
