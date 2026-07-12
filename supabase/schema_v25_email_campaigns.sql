-- ============================================================================
-- schema_v25_email_campaigns.sql
-- Adds the `email_campaigns` table backing the admin "Compose Email" bulk
-- mailer (src/pages/admin/AdminEmail.tsx), plus `system_notifications` used
-- for best-effort admin activity logging. Idempotent — safe to re-run.
-- ============================================================================

create table if not exists public.email_campaigns (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  body         text not null,
  audience     text not null default 'all',
  footer       text,
  from_email   text,
  from_name    text,
  status       text not null default 'draft' check (status in ('draft', 'sent', 'scheduled', 'failed')),
  sent_count   integer not null default 0,
  opened_count integer not null default 0,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

create index if not exists email_campaigns_created_at_idx on public.email_campaigns(created_at desc);

alter table public.email_campaigns enable row level security;

drop policy if exists "email_campaigns_admin_select" on public.email_campaigns;
create policy "email_campaigns_admin_select" on public.email_campaigns
  for select using (is_admin());

drop policy if exists "email_campaigns_admin_insert" on public.email_campaigns;
create policy "email_campaigns_admin_insert" on public.email_campaigns
  for insert with check (is_admin());

drop policy if exists "email_campaigns_admin_update" on public.email_campaigns;
create policy "email_campaigns_admin_update" on public.email_campaigns
  for update using (is_admin());

drop policy if exists "email_campaigns_admin_delete" on public.email_campaigns;
create policy "email_campaigns_admin_delete" on public.email_campaigns
  for delete using (is_admin());

-- ── system_notifications (best-effort admin activity log) ──────────────────
create table if not exists public.system_notifications (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists system_notifications_created_at_idx on public.system_notifications(created_at desc);

alter table public.system_notifications enable row level security;

drop policy if exists "system_notifications_admin_select" on public.system_notifications;
create policy "system_notifications_admin_select" on public.system_notifications
  for select using (is_admin());

drop policy if exists "system_notifications_admin_insert" on public.system_notifications;
create policy "system_notifications_admin_insert" on public.system_notifications
  for insert with check (is_admin());

drop policy if exists "system_notifications_admin_update" on public.system_notifications;
create policy "system_notifications_admin_update" on public.system_notifications
  for update using (is_admin());
