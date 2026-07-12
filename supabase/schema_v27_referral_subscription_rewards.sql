-- ═══════════════════════════════════════════════════════════════
-- SCHEMA v27 — Referral → Subscription rewards (auto Premium/VIP)
-- Invite 10 friends → free Premium for 14 days.
-- Invite 20 friends → free VIP for 14 days.
-- Run once in the Supabase SQL Editor. Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Track WHY a profile currently has its subscription_tier, and WHEN
--      an auto-granted (non-paid) tier should expire. Paid/admin grants use
--      subscription_expires_at = NULL (never auto-reverted); referral grants
--      always carry a real expiry that the cleanup job below enforces.
alter table public.profiles add column if not exists subscription_source text
  not null default 'free' check (subscription_source in ('free','referral','payment','admin'));
alter table public.profiles add column if not exists subscription_expires_at timestamptz;

-- Backfill: anyone already on a paid tier before this migration ran got there
-- via payment/admin grant, not a referral — mark them so the cleanup job
-- below never touches them.
update public.profiles
  set subscription_source = 'payment'
  where subscription_tier is not null and subscription_tier <> 'free'
    and subscription_source = 'free';

-- ── 2. Track which referral-reward tier(s) a user has already earned, so we
--      only send the congratulation once per newly-crossed threshold and can
--      tell "renewal" (still above threshold) apart from "first time".
create table if not exists public.referral_reward_grants (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  tier         text not null check (tier in ('premium','vip')),
  referral_count_at_grant int not null,
  granted_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  unique(user_id, tier)
);

create index if not exists referral_reward_grants_user_idx on public.referral_reward_grants(user_id);

alter table public.referral_reward_grants enable row level security;
drop policy if exists "Users read own reward grants" on public.referral_reward_grants;
create policy "Users read own reward grants" on public.referral_reward_grants
  for select using (auth.uid() = user_id);

-- ── 3. Evaluate + grant. Called after every confirmed referral for the
--      REFERRER (the person doing the inviting — only they accumulate
--      credit toward the 10/20 thresholds). Security definer because it
--      writes to another user's profile row; never exposed as a public RPC.
create or replace function public.evaluate_referral_subscription_reward(p_referrer_id uuid)
returns void language plpgsql security definer as $$
declare
  v_confirmed_count int;
  v_target_tier     text;
  v_current         record;
  v_existing_grant  record;
  v_rank            constant jsonb := '{"free":0,"premium":1,"vip":2}'::jsonb;
begin
  select count(*) into v_confirmed_count
    from public.referrals
    where referrer_id = p_referrer_id and status = 'confirmed';

  if v_confirmed_count >= 20 then
    v_target_tier := 'vip';
  elsif v_confirmed_count >= 10 then
    v_target_tier := 'premium';
  else
    return; -- below the first threshold, nothing to grant yet
  end if;

  select subscription_tier, subscription_source, subscription_expires_at
    into v_current
    from public.profiles where id = p_referrer_id;

  if v_current is null then
    return;
  end if;

  -- Never touch a user who currently holds an active PAID/ADMIN grant that
  -- is already at or above the tier we'd otherwise assign — referrals should
  -- only ever help, never downgrade or interrupt something they paid for.
  if v_current.subscription_source in ('payment','admin')
     and (v_current.subscription_expires_at is null or v_current.subscription_expires_at > now())
     and coalesce((v_rank->v_current.subscription_tier)::int, 0) >= coalesce((v_rank->v_target_tier)::int, 0)
  then
    return;
  end if;

  select * into v_existing_grant
    from public.referral_reward_grants
    where user_id = p_referrer_id and tier = v_target_tier;

  -- Apply/refresh the referral-granted tier: always (re)start a fresh 14-day
  -- window so the reward stays "for 14 days validity" from the moment the
  -- threshold is met or re-confirmed.
  update public.profiles
    set subscription_tier = v_target_tier,
        subscription_source = 'referral',
        subscription_expires_at = now() + interval '14 days'
    where id = p_referrer_id;

  insert into public.referral_reward_grants (user_id, tier, referral_count_at_grant, granted_at, expires_at)
    values (p_referrer_id, v_target_tier, v_confirmed_count, now(), now() + interval '14 days')
    on conflict (user_id, tier) do update
      set granted_at = now(),
          expires_at = now() + interval '14 days',
          referral_count_at_grant = excluded.referral_count_at_grant;

  -- Only congratulate on a NEWLY crossed threshold (first grant of this tier,
  -- or the current profile tier wasn't already this reward tier) — avoid
  -- spamming a notification for every referral confirmed after the fact.
  if v_existing_grant is null or v_current.subscription_tier is distinct from v_target_tier then
    begin
      insert into public.notifications (user_id, type, title, body, emoji, action_url)
      values (
        p_referrer_id, 'system',
        case when v_target_tier = 'vip' then '👑 VIP unlocked!' else '🎉 Premium unlocked!' end,
        'You invited ' || v_confirmed_count || ' friends — enjoy free ' || initcap(v_target_tier) ||
          ' for 14 days, on us!',
        case when v_target_tier = 'vip' then '👑' else '🎉' end,
        '/app/subscriptions'
      );
    exception when undefined_column or undefined_table then
      null; -- notifications shape may differ across environments; grant already applied above
    end;

    -- Best-effort real OS push, reusing the existing internal push helper
    -- (see notify_push_internal() in schema.sql). No-ops silently if that
    -- helper or its config doesn't exist in this environment yet.
    begin
      perform public.notify_push_internal(
        p_referrer_id,
        'premium',
        case when v_target_tier = 'vip' then '👑 VIP unlocked!' else '🎉 Premium unlocked!' end,
        'You invited ' || v_confirmed_count || ' friends — enjoy free ' || initcap(v_target_tier) || ' for 14 days!',
        '/app/subscriptions'
      );
    exception when undefined_function then
      null;
    end;
  end if;
end;
$$;

revoke all on function public.evaluate_referral_subscription_reward(uuid) from public, authenticated, anon;

-- ── 4. Wire it into confirm_referral() — same body as schema_v15's version,
--      plus the new call at the end. CREATE OR REPLACE keeps the original
--      signature so the existing trigger (trg_profiles_confirm_referral)
--      keeps working unchanged.
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
$$;

-- Re-apply the lockdown (CREATE OR REPLACE does not preserve prior REVOKEs).
revoke all on function public.confirm_referral(uuid) from public, authenticated, anon;

-- The 10/20-referral subscription check must run every time a referral is
-- confirmed, in its own statement outside the exception-swallowing block
-- above so a notifications-shape hiccup there never skips the reward.
create or replace function public.trg_confirm_referral_on_verify()
returns trigger language plpgsql as $$
declare
  v_referrer uuid;
begin
  if NEW.email_verified is true and (OLD.email_verified is distinct from true) then
    select referrer_id into v_referrer from public.referrals where referred_id = NEW.id;
    perform public.confirm_referral(NEW.id);
    if v_referrer is not null then
      perform public.evaluate_referral_subscription_reward(v_referrer);
    end if;
  end if;
  return NEW;
end;
$$;

-- ── 5. Cleanup: revert an expired referral-granted subscription back to
--      Free. Only ever touches subscription_source = 'referral' rows, so a
--      user who separately paid (subscription_source = 'payment'/'admin')
--      is never affected. Safe to expose to authenticated clients — it's a
--      deterministic, argument-free, self-scoped batch fix-up, not a way to
--      read or write anything sensitive.
create or replace function public.revert_expired_referral_subscriptions()
returns void language plpgsql security definer as $$
begin
  update public.profiles
    set subscription_tier = 'free',
        subscription_source = 'free',
        subscription_expires_at = null
    where subscription_source = 'referral'
      and subscription_expires_at is not null
      and subscription_expires_at < now();
end;
$$;

grant execute on function public.revert_expired_referral_subscriptions() to authenticated, anon;

-- Best-effort scheduled sweep, in addition to the opportunistic client-side
-- call on every sign-in — keeps tiers accurate even for users who don't log
-- in right at expiry. No-ops quietly if pg_cron isn't available/permitted.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('revert-expired-referral-subscriptions');
  end if;
exception when others then
  null;
end $$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'revert-expired-referral-subscriptions',
    '0 * * * *', -- hourly
    $cron$select public.revert_expired_referral_subscriptions();$cron$
  );
exception when others then
  -- pg_cron unavailable/unauthorized on this project tier — the client-side
  -- call in AuthContext on every sign-in still keeps this correct.
  null;
end $$;

-- ── 6. Keep subscription_source/expiry accurate for PAID grants too, so the
--      reward logic above can correctly recognize "already has a paid plan".
--      Runs alongside whichever activate_subscription_on_payment() trigger
--      is live in this environment (schema.sql / schema_v7_production.sql /
--      mobile_money_payments.sql all define one) without needing to know
--      which version deployed — this is a second, independent trigger.
create or replace function public.mark_subscription_paid_on_payment()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'confirmed' and OLD.status = 'pending' then
    update public.profiles
      set subscription_source = 'payment',
          subscription_expires_at = now() + interval '30 days'
      where id = NEW.user_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_mark_subscription_paid_on_payment on public.mobile_money_payments;
create trigger trg_mark_subscription_paid_on_payment
  after update on public.mobile_money_payments
  for each row execute procedure public.mark_subscription_paid_on_payment();

-- Admin manual "Grant Plan" (AdminSubscriptions.tsx) writes directly to
-- user_subscriptions.user_id, which is the legacy INTEGER public.users.id —
-- not a profiles UUID — and today only updates users.subscription_tier,
-- never profiles.subscription_tier. That means admin-granted plans silently
-- didn't gate any real UI feature (the app reads profiles.subscription_tier).
-- Fix: resolve the profile via users.auth_id and keep both tables' tier +
-- expiry in sync, tagged 'admin' so the referral cleanup job never touches it.
create or replace function public.mark_subscription_admin_on_grant()
returns trigger language plpgsql security definer as $$
declare
  v_profile_id uuid;
begin
  if NEW.status = 'active' then
    select auth_id into v_profile_id from public.users where id = NEW.user_id;
    if v_profile_id is not null then
      update public.profiles
        set subscription_tier = NEW.plan_id,
            subscription_source = 'admin',
            subscription_expires_at = NEW.expires_at
        where id = v_profile_id;
    end if;
    update public.users
      set subscription_tier = NEW.plan_id,
          subscription_expires_at = NEW.expires_at
      where id = NEW.user_id;
  end if;
  return NEW;
exception when others then
  return NEW; -- never block the admin grant if this best-effort sync fails
end;
$$;

drop trigger if exists trg_mark_subscription_admin_on_grant on public.user_subscriptions;
create trigger trg_mark_subscription_admin_on_grant
  after insert on public.user_subscriptions
  for each row execute procedure public.mark_subscription_admin_on_grant();

-- Mirror the referral-reward grant/expiry onto public.users too (via
-- auth_id), so the admin dashboard's view of a user's plan stays consistent
-- with what actually gates their UI experience on profiles.
create or replace function public.mirror_subscription_to_users()
returns trigger language plpgsql security definer as $$
begin
  update public.users
    set subscription_tier = NEW.subscription_tier,
        subscription_expires_at = NEW.subscription_expires_at
    where auth_id = NEW.id;
  return NEW;
exception when others then
  return NEW;
end;
$$;

drop trigger if exists trg_mirror_subscription_to_users on public.profiles;
create trigger trg_mirror_subscription_to_users
  after update of subscription_tier, subscription_source, subscription_expires_at on public.profiles
  for each row execute procedure public.mirror_subscription_to_users();

-- ── 7. Unrelated pre-existing bug hit while verifying this migration's pages:
--      admin_users had a self-referential RLS policy ("Admins can see admin
--      users": EXISTS (SELECT 1 FROM admin_users WHERE auth_id = auth.uid()))
--      that recurses into its own RLS on evaluation, 500ing (42P17) every
--      query that touches admin_users — including platform_settings and
--      system_announcements (loaded on every page via AnnouncementContext).
--      Redundant with admin_users_select_self; real admin-role checks already
--      go through the SECURITY DEFINER helpers (is_admin()/is_superadmin()),
--      which don't re-trigger RLS. Safe to drop.
drop policy if exists "Admins can see admin users" on public.admin_users;
