---
name: Schema evolution
description: SmartzConnect Supabase schema versioning — which addendum covers what, and the live-DB scan findings.
---

# Schema Evolution

**Rule:** Always extend with a new vN addendum file in `supabase/`. Never edit prior versions.

## Files (in order)
| File | Coverage |
|---|---|
| `schema_complete.sql` | Full base schema — all core tables |
| `schema_v4_addendum.sql` | Swipes (Discover/Dating), WorldStage module |
| `schema_v5_addendum.sql` | Moderation status columns for admin modules |
| `schema_v6_addendum.sql` | activity_feed (new), post_shares (new), LiveKit cols on video_calls/stream_tokens/call_participants, extended notification_preferences, platform_files enrichment, storage buckets |

## Critical column name mismatches (fixed July 2026)
- `posts.author_id` — NOT `user_id`. FeedPage query must use `profiles:author_id` for the join.
- `matches.user_a` / `matches.user_b` — NOT `user1_id`/`user2_id`. MatchesPage must query with `.or('user_a.eq.X,user_b.eq.X')` and resolve the OTHER user in a second query.
- `swipes.action` — NOT `direction`. Values are `'like'`, `'pass'`, `'super_like'` (NOT 'right'/'left'/'super'). Unique constraint on `(swiper_id, swiped_id)`.
- `marketplace_items.title` — NOT `name`. Column is `title`.
- `marketplace_items.is_active` — NOT `status`. Use `.eq('is_active', true)` for filtering active listings.
- `marketplace_items.stock_qty` — NOT `in_stock`. Integer column; check `> 0` for availability. No `rating`/`review_count` columns exist.
- `public.users` was missing an `updated_at` column while two BEFORE UPDATE triggers (`trg_updated_at`, `trg_users_updated_at` → `set_updated_at()`) reference `NEW.updated_at` — broke every signup with a 500 "Database error saving new user" via the `handle_new_user()` ON CONFLICT DO UPDATE path. Fixed by adding the column. When a Supabase signup/insert 500s with a vague client error, check GoTrue's `auth_logs` (via Management API `analytics/endpoints/logs.all`) for the real Postgres error — the client-side message is often just `{}`/"unexpected_failure".

## Live DB state (as of July 6, 2026)
- Direct Postgres (port 6543, pooler) IS reachable from Replit via `psql`/`pg_dump` — earlier note about port 5432 being blocked was stale/incorrect (or was fixed). Verify connectivity directly before assuming Management API is required.
- Almost all core data tables are empty (profiles/users/posts/matches/auth.users ~0 rows) — only a few config/seed tables have rows (e.g. subscription_plans=3, feature_permissions=18).
- The repo's schema SQL files (`schema_complete.sql`, `schema_v4-v7_addendum/production.sql`) are **out of sync** with the live DB on a handful of tables that were hand-edited later directly in the Supabase dashboard: `subscription_plans` (live has `slug`/`billing_cycle`/`badge`, uuid id — not the simple text-id version in the script), `user_subscriptions` (live `user_id` is `integer` FK to a custom `public.users` table, not `uuid` FK to `auth.users`), `feature_permissions` (live uses `feature_key`/`free_enabled`/`premium_enabled`/`vip_enabled`, not `feature_name`/`free_allowed`), `worldstage_leaderboard` (`user_id` is NOT NULL, rejects script's fake-user seed rows), `blog_posts` (live uses `author_name`/`author_role` text fields, not `author_id` uuid fk).
- Running the repo's idempotent schema scripts against the live DB is safe (no data loss — errors are just rejected INSERT/ALTER statements on the mismatched tables), but won't reconcile the drift. A live schema snapshot was captured in `supabase/snapshots/live_schema_<date>.sql` via a `pg_catalog` introspection query (see below) as the source of truth going forward.

## Connection note
- Supabase project region: **eu-west-1** (pooler host: `aws-0-eu-west-1.pooler.supabase.com`, port 6543).
- `pg_dump`/`psql` in this Replit environment are v16, but Supabase runs Postgres 17 — `pg_dump` refuses due to version mismatch (`aborting because of server version mismatch`). Workaround: use a raw SQL query against `pg_catalog.pg_class`/`pg_attribute` via `psql -At` to reconstruct `CREATE TABLE` statements instead of `pg_dump`.
- Edge function secrets set via `POST /v1/projects/{ref}/secrets`.

## Edge function deployment from Replit
- `npx supabase functions deploy` fails (DNS resolution blocked for deno.land).
- Use `PATCH https://api.supabase.com/v1/projects/{ref}/functions/{slug}` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` and body `{ verify_jwt: bool, body: "<source>" }`.
- `stream-token` must have `verify_jwt: false` so unauthenticated clients can request a GetStream token.

**Why:** Column name mismatches are silent — queries return an error, `dbConnected` flips false, user sees "Configure Supabase" placeholder. Always verify against live schema before writing queries.
