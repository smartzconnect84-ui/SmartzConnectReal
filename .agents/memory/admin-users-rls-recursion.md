---
name: admin_users RLS infinite recursion (unfixed)
description: platform_settings and system_announcements reads 500 with "infinite recursion detected in policy for relation admin_users" — pre-existing, not yet fixed.
---

Confirmed live (2026-07-11) via anon REST calls: `GET .../rest/v1/platform_settings` and `GET .../rest/v1/system_announcements` both return HTTP 500 with Postgres error `42P17 infinite recursion detected in policy for relation "admin_users"`. This is why the public site's browser console always shows a few 500s (AnnouncementContext's banner/announcement fetches fail silently and fall back to defaults, so it's not visibly broken, just noisy).

Root cause not yet located — likely some policy (on `platform_settings` and/or `system_announcements`, or a helper function they call) does a subquery against `admin_users` whose own RLS policy recurses back into itself or into a table that re-triggers it. `admin_users`' only known policy (`admin_users_select_self`) looks safe on its own, so the recursion is probably introduced by a different, undocumented policy added directly on the live DB (schema drift — see `schema-evolution.md`).

Could not fix this session: `SUPABASE_DB_PASSWORD` (and psql direct connection) was unavailable/empty in the shell env despite being listed as an available secret; Supabase Management API is blocked from Replit IPs (CF 1010, per `db-migration-2026-07.md`). Anon REST key can only read, not alter policies.

**Why noted:** so a future session doesn't need to re-discover this from scratch — go straight to inspecting/rewriting the RLS policies on `platform_settings`/`system_announcements` (and whatever helper function they use to check admin status) once a working DB write path exists.
**How to apply:** once psql or Management API access works, run `select policyname, qual from pg_policies where tablename in ('platform_settings','system_announcements');` and fix any subquery that re-enters `admin_users`' RLS instead of using a `SECURITY DEFINER` helper like `is_admin_user()`.
