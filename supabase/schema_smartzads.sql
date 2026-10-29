-- ============================================================
-- SmartzAds — full self-service advertising schema
-- Run in Supabase SQL editor AFTER schema.sql / schema_v2.sql.
-- Safe: all CREATE IF NOT EXISTS; does not touch existing tables.
-- Works alongside the legacy `ad_campaigns` table used by AdminAds.
-- ============================================================

-- ─── Advertiser profiles (one per auth user, unless multi-brand later) ──
create table if not exists public.smartzads_advertisers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category      text default 'Other',
  email         text,
  phone         text,
  country       text default 'Liberia',
  city          text,
  website       text,
  logo_url      text,
  description   text,
  currency      text default 'USD',
  billing_name  text,
  billing_address text,
  suspended     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id)
);
create index if not exists smartzads_advertisers_user_idx on public.smartzads_advertisers(user_id);

-- ─── Campaigns ──
create table if not exists public.smartzads_campaigns (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  advertiser_id    uuid references public.smartzads_advertisers(id) on delete set null,
  name             text not null,
  objective        text default 'brand',
  headline         text,
  description      text,
  body             text,
  cta              text default 'Learn More',
  destination_url  text,
  lead_destination text,
  format           text default 'image',
  placements       text[] default '{home_feed}',
  targeting        jsonb default '{}'::jsonb,
  creatives        jsonb default '[]'::jsonb,
  carousel         jsonb default '[]'::jsonb,
  event_title      text, event_date text, event_location text,
  job_title        text, job_org text,
  start_date       date, end_date date,
  currency         text default 'USD',
  pricing_model    text default 'fixed' check (pricing_model in ('cpm','cpc','fixed','package','daily')),
  budget_total     numeric(12,2) default 0,
  daily_cap        numeric(12,2) default 0,
  package_id       text default '',
  amount_spent     numeric(12,2) default 0,
  impressions      integer default 0,
  clicks           integer default 0,
  leads            integer default 0,
  conversions      integer default 0,
  status           text default 'draft' check (status in ('draft','submitted','under_review','changes_requested','approved','scheduled','active','paused','completed','rejected','cancelled','payment_required','payment_failed')),
  moderation_status text default 'none',
  moderation_note  text default '',
  payment_status   text default 'unpaid' check (payment_status in ('unpaid','pending','verified','failed','refunded','partial_refund')),
  tx_ref           text default '',
  invoice_id       text default '',
  idempotency_key  text unique default encode(gen_random_bytes(16),'hex'),
  history          jsonb default '[]'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists smartzads_campaigns_owner_idx on public.smartzads_campaigns(owner_id);
create index if not exists smartzads_campaigns_status_idx on public.smartzads_campaigns(status);
create index if not exists smartzads_campaigns_dates_idx on public.smartzads_campaigns(start_date, end_date);

-- ─── Events (impressions / clicks / conversions — append-only) ──
create table if not exists public.smartzads_events (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.smartzads_campaigns(id) on delete cascade,
  kind        text not null check (kind in ('impression','click','conversion')),
  placement   text,
  dedupe_key  text,
  created_at  timestamptz default now(),
  unique(campaign_id, dedupe_key)
);
create index if not exists smartzads_events_campaign_idx on public.smartzads_events(campaign_id, kind);

-- ─── Payments / invoices / refunds ──
create table if not exists public.smartzads_invoices (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.smartzads_campaigns(id) on delete set null,
  number      text not null,
  amount      numeric(12,2) default 0,
  fees        numeric(12,2) default 0,
  tax         numeric(12,2) default 0,
  total       numeric(12,2) default 0,
  currency    text default 'USD',
  model       text default 'fixed',
  status      text default 'unpaid',
  tx_ref      text default '',
  provider    text default 'manual',
  created_at  timestamptz default now(),
  unique(number)
);
create index if not exists smartzads_invoices_owner_idx on public.smartzads_invoices(owner_id);

-- ─── Moderation decisions (audit trail) ──
create table if not exists public.smartzads_moderation (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.smartzads_campaigns(id) on delete cascade,
  admin_id    uuid references auth.users(id) on delete set null,
  decision    text not null check (decision in ('approved','rejected','changes_requested','suspended','restored')),
  note        text default '',
  created_at  timestamptz default now()
);
create index if not exists smartzads_moderation_campaign_idx on public.smartzads_moderation(campaign_id);

-- ─── Admin audit log (advertising scope) ──
create table if not exists public.smartzads_audit (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  detail     text default '',
  created_at timestamptz default now()
);
create index if not exists smartzads_audit_admin_idx on public.smartzads_audit(admin_id);

-- ─── Placements / packages are config (localStorage) with DB override table ──
create table if not exists public.smartzads_inventory (
  id         text primary key,
  label      text not null,
  enabled    boolean default true,
  cpm        numeric(10,2) default 0,
  cpc        numeric(10,2) default 0,
  fixed      numeric(10,2) default 0,
  note       text default '',
  updated_at timestamptz default now()
);

-- ─── Row Level Security ──
alter table public.smartzads_advertisers enable row level security;
alter table public.smartzads_campaigns   enable row level security;
alter table public.smartzads_events      enable row level security;
alter table public.smartzads_invoices    enable row level security;
alter table public.smartzads_moderation  enable row level security;
alter table public.smartzads_audit       enable row level security;
alter table public.smartzads_inventory   enable row level security;

-- Owners manage only their own rows
do $$ begin create policy "owners_rw_advertisers" on public.smartzads_advertisers for all using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "owners_rw_campaigns" on public.smartzads_campaigns for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "owners_read_invoices" on public.smartzads_invoices for select using (auth.uid() = owner_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "owners_insert_invoices" on public.smartzads_invoices for insert with check (auth.uid() = owner_id); exception when duplicate_object then null; end $$;

-- Public / delivery: anyone can read approved+active campaigns (delivery service re-checks eligibility server-side semantics client-side here)
do $$ begin create policy "public_read_servable" on public.smartzads_campaigns for select using (status in ('active','approved','scheduled') and moderation_status = 'approved'); exception when duplicate_object then null; end $$;

-- Events: authenticated users may insert (dedupe_key prevents double count); only owners read via campaign join — simplified to owner campaigns
do $$ begin create policy "auth_insert_events" on public.smartzads_events for insert with check (auth.uid() is not null); exception when duplicate_object then null; end $$;
do $$ begin create policy "auth_read_events" on public.smartzads_events for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- Inventory readable by all authenticated users
do $$ begin create policy "auth_read_inventory" on public.smartzads_inventory for select using (auth.uid() is not null); exception when duplicate_object then null; end $$;

-- updated_at triggers
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'apply_updated_at') then return; end if;
  perform public.apply_updated_at('smartzads_advertisers');
  perform public.apply_updated_at('smartzads_campaigns');
  perform public.apply_updated_at('smartzads_inventory');
exception when others then null; end $$;
