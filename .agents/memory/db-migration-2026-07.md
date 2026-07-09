---
name: Database migration & fix 2026-07
description: Full DB audit and fix pass; all SQL files run; real bugs fixed in live DB.
---

## Live DB confirmed state (post full fix pass)
- 115 tables, ALL with RLS enabled (0 exceptions)
- 111 tables in supabase_realtime publication
- 535 RLS policies, 339 indexes, 70 triggers, 79 functions
- 28 feature_permissions rows seeded; unique constraint on both feature_key AND feature_name
- 3 subscription plans (Free/Premium/VIP) with UUID PKs in live DB
- 1 team_member (Shedrick K. Nungehn, Founder & CEO) — duplicate removed
- 28 storage buckets confirmed

## Real bugs fixed in live DB
1. **call_participants RLS**: policy used `auth.uid() = user_id` but user_id is text; fixed to `auth.uid()::text = user_id`
2. **feature_permissions**: no unique on feature_name; added constraint + seeded 18 new permission rows
3. **stories_expires_idx**: partial index used volatile `now()` — fixed to plain `expires_at DESC`
4. **Column gaps**: added user_id uuid columns to likes, subscriptions, payments, tv_videos, ride_requests, ad_campaigns; added auth_user_id to admin_users; added profile stat columns (coins_balance, followers_count, etc.)
5. **Duplicate team_members**: cleaned up

## SQL file fixes applied (schema_v7_production.sql)
- Line 324: stories_expires_idx — removed volatile WHERE predicate (IMMUTABLE error)
- Line 613: call_participants policy — cast uuid to text
- Line 1139: ON CONFLICT target reverted to (feature_name) to match CREATE TABLE UNIQUE

## Schema drift (not blocking, live DB diverged from SQL files)
- subscription_plans: live DB uses UUID PKs; SQL files insert text IDs ('free','premium','vip') — INSERT fails silently, data already exists
- user_subscriptions: live DB has user_id as integer (ref public.users); SQL files expect uuid (ref auth.users) — RLS uses subquery join through users.auth_id which works correctly
- feature_permissions: live DB has many extra columns (label, feature_key, free_enabled, etc.) not in schema_v7

## Credentials / connection
- psql via PGHOST=aws-0-eu-west-1.pooler.supabase.com PGPORT=6543 PGUSER=postgres.ufmuhwepyxzaldvcbipd + PGPASSWORD env var
- Management API returns CF 1010 or 403 from Replit IPs — use psql for all migrations
- SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ACCESS_TOKEN saved as Replit Secrets

## pg_cron / backup
- backup_cron_setup.sql needs superuser; run from Supabase Dashboard SQL editor (not pooler)

**Why:** Use psql for all future migrations. Never put password in command args (use PGPASSWORD env var). Never run ON CONFLICT (col) without verifying that col has a UNIQUE constraint in BOTH the SQL file and the live DB.
