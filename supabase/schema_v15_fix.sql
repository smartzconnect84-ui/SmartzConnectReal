-- ═══════════════════════════════════════════════════════════════
-- SCHEMA v15 FIX — adds missing referral_code column and corrects
-- function dollar-quote syntax errors from schema_v15.
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add missing referral_code column ─────────────────────────────────────
alter table public.profiles add column if not exists referral_code text;

-- Now that the column exists, create the unique index and backfill
create unique index if not exists profiles_referral_code_uidx
  on public.profiles(referral_code) where referral_code is not null;

-- Backfill existing rows without a code
update public.profiles
  set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
  where referral_code is null;

-- ── 2. Re-create confirm_referral with correct $$ delimiters ────────────────
create or replace function public.confirm_referral(p_referred_id uuid)
returns void language plpgsql security definer as $$
declare
  r record;
begin
  select * into r from public.referrals
    where referred_id = p_referred_id and status = 'pending';
  if not found then
    return;
  end if;

  update public.referrals
    set status = 'confirmed', confirmed_at = now()
    where id = r.id;

  -- Grant to both the referrer and the newly-referred user
  insert into public.referral_perks (user_id, referral_id, perk_type, minutes, expires_at) values
    (r.referrer_id, r.id, 'call_credit_minutes', 2, now() + interval '30 days'),
    (r.referrer_id, r.id, 'unlimited_messaging', 0, now() + interval '24 hours'),
    (r.referrer_id, r.id, 'unlimited_spins',     0, now() + interval '24 hours'),
    (r.referred_id, r.id, 'call_credit_minutes', 2, now() + interval '30 days'),
    (r.referred_id, r.id, 'unlimited_messaging', 0, now() + interval '24 hours'),
    (r.referred_id, r.id, 'unlimited_spins',     0, now() + interval '24 hours');

  -- Congratulate both users via the notifications feed
  insert into public.notifications (user_id, type, title, body, created_at) values
    (r.referrer_id, 'system', '🎉 Referral confirmed!',
     'Your friend joined SmartzConnect! You both earned 2 min call time + unlimited spins & messaging for 24h.',
     now()),
    (r.referred_id, 'system', '🎉 Welcome bonus unlocked!',
     'Thanks for joining via a referral link! You both earned 2 min call time + unlimited spins & messaging for 24h.',
     now());
exception when undefined_column or undefined_table then
  -- notifications table shape may differ; perks/referral status must not roll back
  null;
end;
$$;

revoke all on function public.confirm_referral(uuid) from public, authenticated, anon;

-- ── 3. Re-create apply_referral_code with correct $$ delimiters ─────────────
create or replace function public.apply_referral_code(p_user_id uuid, p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_referrer uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'apply_referral_code: not authorized for this user';
  end if;

  select id into v_referrer
    from public.profiles
    where referral_code = upper(p_code) and id <> p_user_id;
  if v_referrer is null then
    return;
  end if;

  update public.profiles
    set referred_by_id = v_referrer
    where id = p_user_id and referred_by_id is null;

  insert into public.referrals (referrer_id, referred_id, status)
    values (v_referrer, p_user_id, 'pending')
    on conflict (referred_id) do nothing;
end;
$$;

revoke all on function public.apply_referral_code(uuid, text) from public;
grant execute on function public.apply_referral_code(uuid, text) to authenticated;

-- ── 4. Re-create auto-confirm trigger (had syntax errors before) ─────────────
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

-- ── 5. has_active_perk helper (re-run for safety) ────────────────────────────
create or replace function public.has_active_perk(p_user_id uuid, p_perk_type text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.referral_perks
    where user_id = p_user_id
      and perk_type = p_perk_type
      and expires_at > now()
  )
$$;
