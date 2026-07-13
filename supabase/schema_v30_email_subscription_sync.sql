-- schema_v30_email_subscription_sync.sql
-- Full Email Subscription page backend + automatic sync of every confirmed
-- user's email into newsletter_subscribers, so the admin subscriber list
-- (AdminEmail) and the Invoice Generator's email dropdown always reflect
-- real, verified users without any manual step.

-- 1) Subscriber preference categories (used by the public Email Subscription page)
alter table public.newsletter_subscribers
  add column if not exists categories text[] not null default '{general}';

alter table public.newsletter_subscribers
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists newsletter_subscribers_user_id_idx
  on public.newsletter_subscribers (user_id);

-- 2) Auto-sync function — upserts a confirmed user's email into the
-- subscriber list. SECURITY DEFINER so it can write regardless of the
-- calling context (auth triggers run as the postgres role already, but this
-- keeps the helper reusable from other trigger contexts too).
create or replace function public.sync_confirmed_email_subscriber(
  p_user_id uuid,
  p_email text,
  p_name text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_email is null or p_email = '' then
    return;
  end if;

  insert into public.newsletter_subscribers (email, name, source, is_active, user_id, categories)
  values (lower(p_email), p_name, 'auto-verified', true, p_user_id, '{general}')
  on conflict (email) do update
    set user_id = excluded.user_id,
        name = coalesce(public.newsletter_subscribers.name, excluded.name)
        -- Never flip is_active back on for someone who explicitly unsubscribed.
    where public.newsletter_subscribers.unsubscribed_at is null;
end;
$$;

grant execute on function public.sync_confirmed_email_subscriber(uuid, text, text) to postgres, authenticated;

-- 3) Extend the existing auth.users UPDATE trigger function to sync on
-- email confirmation (fires whenever email_confirmed_at transitions to set).
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.users
  set email_verified = (new.email_confirmed_at is not null),
      updated_at     = now()
  where auth_id = new.id;

  if new.email_confirmed_at is not null and (old.email_confirmed_at is null) then
    perform public.sync_confirmed_email_subscriber(
      new.id,
      new.email,
      (select full_name from public.profiles where id = new.id)
    );
  end if;

  return new;
end;
$function$;

-- 4) Extend the INSERT trigger too, for providers (Google, etc.) that create
-- an already-confirmed user in one step (no separate UPDATE event fires).
create or replace function public.handle_new_user_extended()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.users(auth_id, email, full_name, created_at, updated_at)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    now(), now())
  on conflict (auth_id) do nothing;

  if new.email_confirmed_at is not null then
    perform public.sync_confirmed_email_subscriber(
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
  end if;

  return new;
end $function$;

-- 5) Backfill — sync every already-confirmed user right now.
insert into public.newsletter_subscribers (email, name, source, is_active, user_id, categories)
select lower(au.email), p.full_name, 'auto-verified', true, au.id, '{general}'
from auth.users au
left join public.profiles p on p.id = au.id
where au.email_confirmed_at is not null
  and au.email is not null
on conflict (email) do update
  set user_id = excluded.user_id
  where public.newsletter_subscribers.unsubscribed_at is null;

-- 6) RPC for the public Email Subscription page — lets a visitor subscribe
-- (or update preferences) with a chosen set of categories in one call.
create or replace function public.newsletter_subscribe(
  p_email text,
  p_name text,
  p_categories text[],
  p_source text default 'subscribe-page'
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email address is required';
  end if;

  insert into public.newsletter_subscribers (email, name, source, is_active, categories)
  values (lower(trim(p_email)), nullif(trim(coalesce(p_name, '')), ''), p_source, true, coalesce(p_categories, '{general}'))
  on conflict (email) do update
    set categories = coalesce(p_categories, public.newsletter_subscribers.categories),
        is_active = true,
        unsubscribed_at = null,
        name = coalesce(nullif(trim(coalesce(p_name, '')), ''), public.newsletter_subscribers.name);
end;
$$;

grant execute on function public.newsletter_subscribe(text, text, text[], text) to anon, authenticated;
grant execute on function public.newsletter_unsubscribe(text) to anon, authenticated;
