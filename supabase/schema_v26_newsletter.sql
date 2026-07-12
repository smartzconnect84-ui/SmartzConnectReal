-- ============================================================================
-- schema_v26_newsletter.sql
-- Public newsletter subscription list + admin bulk-newsletter support.
-- Never edit prior version files — see .agents/memory/schema-evolution.md.
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  name         text,
  source       text default 'website',        -- e.g. 'footer', 'landing_page'
  is_active    boolean not null default true, -- false once unsubscribed
  created_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_subscribers_active_idx
  on public.newsletter_subscribers (is_active);

alter table public.newsletter_subscribers enable row level security;

-- Anyone (including anonymous visitors) can subscribe.
drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
create policy "newsletter_public_insert"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

-- Only admins can read/manage the list (bulk email + CRM view).
drop policy if exists "newsletter_admin_select" on public.newsletter_subscribers;
create policy "newsletter_admin_select"
  on public.newsletter_subscribers for select
  to authenticated
  using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "newsletter_admin_update" on public.newsletter_subscribers;
create policy "newsletter_admin_update"
  on public.newsletter_subscribers for update
  to authenticated
  using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

drop policy if exists "newsletter_admin_delete" on public.newsletter_subscribers;
create policy "newsletter_admin_delete"
  on public.newsletter_subscribers for delete
  to authenticated
  using (exists (select 1 from public.admin_users au where au.id = auth.uid()));

-- A visitor unsubscribing via a public link only needs to flip their own row
-- to inactive — allow anon/authenticated to update is_active by matching email
-- via a SECURITY DEFINER function instead of a broad public UPDATE policy
-- (keeps the table itself locked down to admins for anything else).
create or replace function public.newsletter_unsubscribe(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.newsletter_subscribers
  set is_active = false, unsubscribed_at = now()
  where email = p_email;
end;
$$;

grant execute on function public.newsletter_unsubscribe(text) to anon, authenticated;
