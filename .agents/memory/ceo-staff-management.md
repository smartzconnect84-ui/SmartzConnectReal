---
name: CEO staff management
description: Full CRUD for admin_users table in the CEO panel — add/edit/delete/upload/export with role responsibilities.
---

# CEO Staff Management

**Rule:** AdminCEO.tsx manages the `admin_users` table with full CRUD. Extra columns (`department`, `responsibilities`, `avatar_url`) are tried first; if the save fails with a column-missing error (code `42703` / message contains "column" / "does not exist"), it retries with minimal fields only. Any other error is surfaced to the user — no false-positive success toasts.

**Why:** `admin_users` was created before these columns existed. The migration in `supabase/announcements_migration.sql` adds them via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Until it runs, the panel still works with degraded fields.

**Role responsibilities map:** Hardcoded in `ROLE_META` constant — CEO, super_admin, admin, moderator, support. Each role has 6 responsibility lines shown as reference and as default pre-fill when creating a staff member.

**CSV export:** Uses `csvCell()` helper that:
1. Doubles internal double-quotes
2. Wraps in double-quotes
3. Prepends `\t` to values starting with `=`, `@`, `+`, `-` to prevent spreadsheet formula injection
4. Includes UTF-8 BOM (`\uFEFF`) for Excel compatibility

**Avatar upload:** Uses `uploadToSufy(file, 'photos')` — same as team members page.
