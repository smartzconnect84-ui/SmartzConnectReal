---
name: Community features — Pages, Events, Jobs, Learning
description: The four sidebar "Coming soon" stubs were replaced with real DB-backed features; where they live and how they're wired.
---

Sidebar nav already had icons/routes reserved for Pages/Events/Jobs/Learning (`AppShell.tsx`/`LeftSidebar.tsx`), but `App.tsx` routed all four to a generic `ComingSoon` placeholder. Built real versions following the `MarketplacePage.tsx` list+create convention:

- `community_pages`/`page_followers`, `events`/`event_attendees`, `jobs`/`job_applications`, `learning_resources`/`learning_saves` tables added in `schema_v24_pages_events_jobs_learning.sql`, RLS mirrors `marketplace_items` (public read `is_active=true`, owner CRUD, `is_admin()` override).
- New SUFY upload folders `pages`/`events`/`jobs`/`learning` had to be added to `ALLOWED_FOLDERS` in the `sufy-presign` edge function AND the `SufyFolder` type in `src/lib/sufy.ts` — uploads silently 400 otherwise. Redeploy with `supabase functions deploy sufy-presign --use-api` after any folder-list change.
- Pages: `src/pages/CommunityPagesPage.tsx`, `EventsPage.tsx`, `JobsPage.tsx`, `LearningPage.tsx`; wired as lazy routes in `App.tsx`, `ComingSoon` component removed since nothing else used it.

**Why:** keep this as the reference pattern if more "directory" style community features (list + create + join/follow) are requested later — copy the RLS/table/component shape rather than re-deriving it.
