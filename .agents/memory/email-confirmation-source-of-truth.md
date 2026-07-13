---
name: Email confirmation source of truth
description: Which table/column actually reflects a confirmed user's email in SmartzConnect, and the auto-sync pipeline into newsletter_subscribers.
---

`public.profiles.email_verified` is NOT populated/synced by anything — querying it always returns 0 rows. The real signal is `public.users.email_verified`, kept in sync with `auth.users.email_confirmed_at` by the `handle_user_updated` trigger (fires on auth.users UPDATE) and `handle_new_user_extended` (fires on auth.users INSERT, for providers like Google that create an already-confirmed user in one step).

**Why:** discovered while building a "confirmed users" dropdown for the invoice generator — a query against `profiles.email_verified` silently returned zero results even though 14+ users were actually confirmed.

**How to apply:** any feature needing "is this user's email confirmed" must read `public.users.email_verified` (joined via `auth_id`), not `profiles`. `public.users` has an open `SELECT` RLS policy (`users_select_all`, role `public`), so it's safe to query directly from the client.

Auto-sync pipeline (see `supabase/schema_v30_email_subscription_sync.sql`): both trigger functions call `public.sync_confirmed_email_subscriber(user_id, email, name)`, which upserts into `newsletter_subscribers` (source='auto-verified') whenever an email is newly confirmed — this keeps the admin subscriber list and any confirmed-user picker current with zero manual steps. It respects existing unsubscribes (won't flip `is_active` back on if `unsubscribed_at` is set).

Public subscribe/unsubscribe RPCs: `newsletter_subscribe(email, name, categories[], source)` and `newsletter_unsubscribe(email)` — used by `/subscribe` (EmailSubscriptionPage) and the Settings page's "Marketing Emails" toggle.
