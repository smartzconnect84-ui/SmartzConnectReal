-- ═══════════════════════════════════════════════════════════════════════════
-- schema_v24: Community Pages, Events, Jobs, Learning
-- Replaces the "Coming soon" stubs at /app/pages, /app/events, /app/jobs, /app/learning
-- Follows the marketplace_items table/RLS convention (schema_complete.sql).
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Community Pages (business/community pages users create & follow) ───────
create table if not exists public.community_pages (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  category      text default 'Community',
  description   text,
  cover_url     text,
  location      text,
  followers_count int default 0,
  is_active     boolean default true,
  is_verified   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.page_followers (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid references public.community_pages(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (page_id, user_id)
);

-- ── Events ───────────────────────────────────────────────────────────────
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  description   text,
  category      text default 'Social',
  cover_url     text,
  location      text,
  is_online     boolean default false,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  attendees_count int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.event_attendees (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  status     text default 'going' check (status in ('going','interested')),
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

-- ── Jobs ─────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  poster_id     uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  company       text not null,
  description   text,
  job_type      text default 'Full-time' check (job_type in ('Full-time','Part-time','Contract','Internship','Remote')),
  location      text,
  salary_range  text,
  apply_url     text,
  contact_email text,
  logo_url      text,
  is_active     boolean default true,
  applicants_count int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.job_applications (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references public.jobs(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  note       text,
  created_at timestamptz default now(),
  unique (job_id, user_id)
);

-- ── Learning resources ───────────────────────────────────────────────────
create table if not exists public.learning_resources (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  description   text,
  category      text default 'General',
  resource_type text default 'Article' check (resource_type in ('Article','Video','Course','Ebook','Podcast')),
  resource_url  text,
  cover_url     text,
  duration_mins int,
  views_count   int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.learning_saves (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid references public.learning_resources(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique (resource_id, user_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────
create index if not exists idx_community_pages_active   on public.community_pages(is_active, created_at desc);
create index if not exists idx_events_active_starts      on public.events(is_active, starts_at);
create index if not exists idx_jobs_active               on public.jobs(is_active, created_at desc);
create index if not exists idx_learning_resources_active on public.learning_resources(is_active, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.community_pages     enable row level security;
alter table public.page_followers      enable row level security;
alter table public.events              enable row level security;
alter table public.event_attendees     enable row level security;
alter table public.jobs                enable row level security;
alter table public.job_applications    enable row level security;
alter table public.learning_resources  enable row level security;
alter table public.learning_saves      enable row level security;

-- community_pages
do $$ begin create policy "pages_select_active" on public.community_pages for select using (is_active = true or auth.uid() = owner_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "pages_insert_own"    on public.community_pages for insert with check (auth.uid() = owner_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "pages_update_own"    on public.community_pages for update using (auth.uid() = owner_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "pages_delete_own"    on public.community_pages for delete using (auth.uid() = owner_id or is_admin()); exception when duplicate_object then null; end $$;

-- page_followers
do $$ begin create policy "page_followers_select" on public.page_followers for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "page_followers_insert"  on public.page_followers for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "page_followers_delete"  on public.page_followers for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- events
do $$ begin create policy "events_select_active" on public.events for select using (is_active = true or auth.uid() = host_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "events_insert_own"    on public.events for insert with check (auth.uid() = host_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "events_update_own"    on public.events for update using (auth.uid() = host_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "events_delete_own"    on public.events for delete using (auth.uid() = host_id or is_admin()); exception when duplicate_object then null; end $$;

-- event_attendees
do $$ begin create policy "event_attendees_select" on public.event_attendees for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "event_attendees_insert" on public.event_attendees for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "event_attendees_delete" on public.event_attendees for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- jobs
do $$ begin create policy "jobs_select_active" on public.jobs for select using (is_active = true or auth.uid() = poster_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "jobs_insert_own"    on public.jobs for insert with check (auth.uid() = poster_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "jobs_update_own"    on public.jobs for update using (auth.uid() = poster_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "jobs_delete_own"    on public.jobs for delete using (auth.uid() = poster_id or is_admin()); exception when duplicate_object then null; end $$;

-- job_applications (poster can see applicants to their own jobs; applicant can see their own)
do $$ begin create policy "job_applications_select" on public.job_applications for select using (
  auth.uid() = user_id or auth.uid() in (select poster_id from public.jobs where id = job_id) or is_admin()
); exception when duplicate_object then null; end $$;
do $$ begin create policy "job_applications_insert" on public.job_applications for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "job_applications_delete" on public.job_applications for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- learning_resources
do $$ begin create policy "learning_select_active" on public.learning_resources for select using (is_active = true or auth.uid() = author_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "learning_insert_own"    on public.learning_resources for insert with check (auth.uid() = author_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "learning_update_own"    on public.learning_resources for update using (auth.uid() = author_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "learning_delete_own"    on public.learning_resources for delete using (auth.uid() = author_id or is_admin()); exception when duplicate_object then null; end $$;

-- learning_saves
do $$ begin create policy "learning_saves_select" on public.learning_saves for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "learning_saves_insert" on public.learning_saves for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "learning_saves_delete" on public.learning_saves for delete using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- ── updated_at triggers (reuse existing helper from schema_complete.sql) ──
select public.apply_updated_at('community_pages');
select public.apply_updated_at('events');
select public.apply_updated_at('jobs');
select public.apply_updated_at('learning_resources');

-- ── Realtime (match convention: most tables are added to supabase_realtime) ──
do $$ begin alter publication supabase_realtime add table public.community_pages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.events; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.jobs; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.learning_resources; exception when duplicate_object then null; end $$;
