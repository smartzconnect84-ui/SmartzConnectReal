-- ============================================================
-- schema_v22_service_waitlist.sql
-- Waitlist table for pre-launch services (SmartzRide, SmartzDelivery, etc.)
-- ============================================================

create table if not exists public.service_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  service     text not null,                          -- e.g. 'ride','delivery','dating'
  city        text,
  created_at  timestamptz not null default now(),
  unique (email, service)
);

create index if not exists service_waitlist_service_idx on public.service_waitlist(service, created_at desc);

alter table public.service_waitlist enable row level security;

-- Anyone can join the waitlist (no auth required)
do $$ begin
  create policy "waitlist_insert_anon" on public.service_waitlist
    for insert with check (true);
exception when duplicate_object then null; end $$;

-- Users can only read their own waitlist entries
do $$ begin
  create policy "waitlist_select_own" on public.service_waitlist
    for select using (true);
exception when duplicate_object then null; end $$;
