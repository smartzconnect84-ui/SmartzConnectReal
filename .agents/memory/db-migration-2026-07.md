---
name: Database migration 2026-07
description: All SQL migration files run against live Supabase DB; confirmed state and credentials approach.
---

## DB confirmed state (post-migration)
- 115 tables, 109 in supabase_realtime publication, RLS on ALL tables.
- 70 triggers, 8 key performance indexes, 28 storage buckets.
- 3 subscription plans (Free/Premium/VIP). Duplicate team_members row removed.

## Credentials / connection
- psql via env vars: PGHOST=aws-0-eu-west-1.pooler.supabase.com PGPORT=6543 PGUSER=postgres.ufmuhwepyxzaldvcbipd + PGPASSWORD.
- Supabase Management API returns Cloudflare 1010 from Replit IPs — DO NOT use it for migrations.
- SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ACCESS_TOKEN saved as Replit Secrets.

## Known non-critical issues
- backup_cron_setup.sql needs superuser — run from Supabase Dashboard SQL editor, not pooler.
- RUN_IN_SUPABASE.sql had 5 harmless errors (UUID/text type mismatch on existing inserts).

**Why:** Use psql for all future migrations from Replit; never put credentials in command args (use PGPASSWORD env var).
