---
name: Announcement banner system
description: Scrolling announcement banner shown platform-wide to all users and admins, with admin CRUD and toggle control.
---

# Announcement Banner System

**Rule:** AnnouncementContext tries Supabase `system_announcements` table first; only falls back to localStorage when the error indicates the table is missing (`42P01` / `PGRST116` / "does not exist"). Transient errors do NOT trigger localStorage fallback (to avoid silently forking state).

**Why:** Without this gate, any network hiccup would cause the admin's browser to become the only one with the announcements, and other users would see nothing.

**How to apply:**
1. Run `supabase/announcements_migration.sql` in the Supabase SQL editor once — this creates the `system_announcements` table and extends `admin_users` with `department`, `responsibilities`, `avatar_url` columns.
2. Until the migration runs, announcements work via localStorage (admin browser only, useful for testing).
3. The banner renders in both `AppShell` (user-facing) and `AdminLayout` (admin) — placed at the top of the main content column.
4. Banner dismiss tracks by announcement ID — new/changed announcements auto-show even if user dismissed the previous one.
5. Admin toggle + full CRUD is in Admin Settings → Announcements tab.
