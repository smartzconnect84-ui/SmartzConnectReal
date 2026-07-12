---
name: admin_users RLS infinite recursion (RESOLVED 2026-07-12)
description: Root cause and fix for the 42P17 "infinite recursion detected in policy for relation admin_users" 500s on platform_settings/system_announcements.
---

## Root cause
`admin_users` had a self-referential RLS policy, `"Admins can see admin users"`:
`EXISTS (SELECT 1 FROM admin_users admin_users_1 WHERE admin_users_1.auth_id = auth.uid())`.
Evaluating this policy requires re-running RLS on `admin_users` itself → infinite
recursion. Because it lives on `admin_users`, it poisons *any* query that joins
or subqueries into `admin_users` — including `platform_settings` and
`system_announcements`'s admin policies, which are loaded on every page via
`AnnouncementContext` (hence 500s appearing everywhere, not just admin pages).

## Fix
Dropped the redundant policy: `drop policy if exists "Admins can see admin
users" on public.admin_users;`. Self-access is already covered by
`admin_users_select_self` (`auth.uid() = auth_id`), and role checks elsewhere
correctly use the `SECURITY DEFINER` helpers (`is_admin()`, `is_superadmin()`,
`is_admin_role()`, `is_admin_user()`) which don't re-trigger RLS.

**Why:** any RLS policy on a table that subqueries the *same* table (instead
of using a `SECURITY DEFINER` helper) will recurse the moment that table has
row-level security enabled — this is a general trap, not specific to this app.
**How to apply:** if a fresh 42P17 recursion shows up again, run `select
tablename, policyname, qual from pg_policies where tablename = '<table>'` and
look for a policy whose `qual`/`with_check` subqueries the same table by name
instead of calling an existing `SECURITY DEFINER` helper.
