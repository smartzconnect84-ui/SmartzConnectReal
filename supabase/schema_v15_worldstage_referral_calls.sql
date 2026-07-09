-- ═══════════════════════════════════════════════════════════════
-- SCHEMA v15 — WorldStage admin support, Referral rewards, Conference calls
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → paste → Run).
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. WORLD STAGE: nomination form needs a title field ──────────────────
alter table public.worldstage_entries add column if not exists title text;
alter table public.worldstage_entries add column if not exists image_url text;

-- Admins need to update/delete entries & events (public policies only allowed
-- select + user-scoped insert before). Service-role (used by admin client via
-- the app's own admin checks) bypasses RLS by default, but we still add
-- explicit admin policies so the anon/authenticated admin UI can operate
-- under RLS when using the regular client with an admin role.
create or replace function public.is_admin_role(uid uuid)
returns boolean language sql stable security definer as $$
  select coalesce((select role in ('admin','superadmin','ceo','moderator') from public.profiles where id = uid), false)
$$;

-- Prior schema revisions (schema_v4_addendum / schema_v7_production /
-- schema_complete) created permissive "any authenticated user" manage
-- policies under different names (ws_events_manage, ws_spot_manage,
-- ws_lb_insert_auth). Those must be dropped too, or they remain active
-- alongside the admin-only policy below and let any logged-in user write.
drop policy if exists "ws_events_manage" on public.worldstage_events;
drop policy if exists "Admins manage events" on public.worldstage_events;
create policy "Admins manage events" on public.worldstage_events
  for all using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

drop policy if exists "Admins manage entries" on public.worldstage_entries;
create policy "Admins manage entries" on public.worldstage_entries
  for all using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

drop policy if exists "ws_spot_manage" on public.worldstage_spotlights;
drop policy if exists "Admins manage spotlights" on public.worldstage_spotlights;
create policy "Admins manage spotlights" on public.worldstage_spotlights
  for all using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

drop policy if exists "ws_lb_insert_auth" on public.worldstage_leaderboard;
drop policy if exists "Admins manage leaderboard" on public.worldstage_leaderboard;
create policy "Admins manage leaderboard" on public.worldstage_leaderboard
  for all using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

-- Users can update/delete their own pending entries (edit nomination before approval)
drop policy if exists "Users manage own entries" on public.worldstage_entries;
create policy "Users manage own entries" on public.worldstage_entries
  for update using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

-- ── 2. REFERRALS ──────────────────────────────────────────────────────────
alter table public.profiles add column if not exists referred_by_id uuid references public.profiles(id);
create unique index if not exists profiles_referral_code_uidx on public.profiles(referral_code) where referral_code is not null;

-- Auto-generate a short referral code for every profile that doesn't have one
create or replace function public.generate_referral_code()
returns trigger language plpgsql as $$
begin
  if NEW.referral_code is null then
    NEW.referral_code := upper(substr(replace(NEW.id::text, '-', ''), 1, 8));
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_profiles_referral_code on public.profiles;
create trigger trg_profiles_referral_code
  before insert on public.profiles
  for each row execute procedure public.generate_referral_code();

-- Backfill existing rows without a code
update public.profiles set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
  where referral_code is null;

create table if not exists public.referrals (
  id            uuid primary key default uuid_generate_v4(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referred_id   uuid not null references public.profiles(id) on delete cascade unique,
  status        text not null default 'pending' check (status in ('pending','confirmed')),
  confirmed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

alter table public.referrals enable row level security;
drop policy if exists "Users read own referrals" on public.referrals;
create policy "Users read own referrals" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);
drop policy if exists "Users create referral link" on public.referrals;
create policy "Users create referral link" on public.referrals
  for insert with check (auth.uid() = referred_id);

create table if not exists public.referral_perks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  referral_id   uuid references public.referrals(id) on delete cascade,
  perk_type     text not null check (perk_type in ('call_credit_minutes','unlimited_messaging','unlimited_spins')),
  minutes       int not null default 0,
  granted_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);

create index if not exists referral_perks_user_idx on public.referral_perks(user_id, expires_at);

alter table public.referral_perks enable row level security;
drop policy if exists "Users read own perks" on public.referral_perks;
create policy "Users read own perks" on public.referral_perks
  for select using (auth.uid() = user_id);

-- Grants perks to both sides of a confirmed referral: 2 min call credit each,
-- plus unlimited messaging & unlimited spins for 24h each, stacking per
-- confirmed referral (each new confirmed referral adds another 24h/2min block).
create or replace function public.confirm_referral(p_referred_id uuid)
returns void language plpgsql security definer as $$
declare
  r record;
begin
  select * into r from public.referrals where referred_id = p_referred_id and status = 'pending';
  if not found then
    return;
  end if;

  update public.referrals set status = 'confirmed', confirmed_at = now() where id = r.id;

  -- Grant to both the referrer and the newly-referred user
  insert into public.referral_perks (user_id, referral_id, perk_type, minutes, expires_at) values
    (r.referrer_id, r.id, 'call_credit_minutes', 2, now() + interval '30 days'),
    (r.referrer_id, r.id, 'unlimited_messaging', 0, now() + interval '24 hours'),
    (r.referrer_id, r.id, 'unlimited_spins',     0, now() + interval '24 hours'),
    (r.referred_id, r.id, 'call_credit_minutes', 2, now() + interval '30 days'),
    (r.referred_id, r.id, 'unlimited_messaging', 0, now() + interval '24 hours'),
    (r.referred_id, r.id, 'unlimited_spins',     0, now() + interval '24 hours');

  -- Congratulate both users via the existing notifications feed
  insert into public.notifications (user_id, type, title, body, created_at) values
    (r.referrer_id, 'system', '🎉 Referral confirmed!', 'Your friend joined SmartzConnect! You both earned 2 min call time + unlimited spins & messaging for 24h.', now()),
    (r.referred_id, 'system', '🎉 Welcome bonus unlocked!', 'Thanks for joining via a referral link! You both earned 2 min call time + unlimited spins & messaging for 24h.', now());
exception when undefined_column or undefined_table then
  -- notifications table shape may differ across environments; perks/referral
  -- status updates above are the source of truth and must not be rolled back
  -- because of a best-effort notification insert failing.
  null;
end;
$;

-- confirm_referral must only ever run via the email-verification trigger
-- below (which executes with the definer's privileges regardless of grants),
-- never as a direct client RPC — otherwise any authenticated user could call
-- confirm_referral(arbitrary_referred_id) and instantly confirm someone
-- else's pending referral, skipping the verification requirement entirely.
revoke all on function public.confirm_referral(uuid) from public, authenticated, anon;

-- Link a freshly-registered profile to its referrer's code (called by the
-- client right after signup with the code captured from the invite link).
create or replace function public.apply_referral_code(p_user_id uuid, p_code text)
returns void language plpgsql security definer set search_path = public as $
declare
  v_referrer uuid;
begin
  -- Ownership check: a client may only apply a referral code to their OWN
  -- profile, never to an arbitrary user id, despite this function running as
  -- security definer (which bypasses RLS).
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'apply_referral_code: not authorized for this user';
  end if;

  select id into v_referrer from public.profiles where referral_code = upper(p_code) and id <> p_user_id;
  if v_referrer is null then
    return;
  end if;
  update public.profiles set referred_by_id = v_referrer where id = p_user_id and referred_by_id is null;
  insert into public.referrals (referrer_id, referred_id, status)
    values (v_referrer, p_user_id, 'pending')
    on conflict (referred_id) do nothing;
end;
$;

revoke all on function public.apply_referral_code(uuid, text) from public;
grant execute on function public.apply_referral_code(uuid, text) to authenticated;

-- Auto-confirm the referral the moment the referred user's email is verified.
create or replace function public.trg_confirm_referral_on_verify()
returns trigger language plpgsql as $$
begin
  if NEW.email_verified is true and (OLD.email_verified is distinct from true) then
    perform public.confirm_referral(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_profiles_confirm_referral on public.profiles;
create trigger trg_profiles_confirm_referral
  after update of email_verified on public.profiles
  for each row execute procedure public.trg_confirm_referral_on_verify();

-- Helper view: does a user currently have an active perk of a given kind?
create or replace function public.has_active_perk(p_user_id uuid, p_perk_type text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.referral_perks
    where user_id = p_user_id and perk_type = p_perk_type and expires_at > now()
  )
$$;

-- ── 3. CONFERENCE CALLS — multi-participant invite roster ─────────────────
-- NOTE: a table named `call_participants` already exists in this database
-- (schema_v7_production.sql) keyed by `call_id` (FK to video_calls) + a plain
-- uuid `user_id`, with no `room_name`/`invited_by`/`status` columns. Reusing
-- that name here would silently no-op under `create table if not exists` and
-- break every insert below. We use a distinct table, `call_invites`, keyed by
-- LiveKit `room_name` (rooms aren't always backed by a `video_calls` row —
-- e.g. group/conference rooms), to track who's been invited into an
-- in-progress room.
create table if not exists public.call_invites (
  id           uuid primary key default uuid_generate_v4(),
  room_name    text not null,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  invited_by   uuid references public.profiles(id) on delete set null,
  status       text not null default 'invited' check (status in ('invited','joined','left','declined')),
  joined_at    timestamptz,
  left_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique(room_name, user_id)
);

create index if not exists call_invites_room_idx on public.call_invites(room_name);

alter table public.call_invites enable row level security;
drop policy if exists "Participants read own room" on public.call_invites;
create policy "Participants read own room" on public.call_invites
  for select using (
    auth.uid() = user_id or auth.uid() = invited_by or
    exists (select 1 from public.call_invites cp2 where cp2.room_name = call_invites.room_name and cp2.user_id = auth.uid())
  );
drop policy if exists "Users manage own participation" on public.call_invites;
create policy "Users manage own participation" on public.call_invites
  for all using (auth.uid() = user_id or auth.uid() = invited_by)
  with check (auth.uid() = user_id or auth.uid() = invited_by);
