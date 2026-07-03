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

## Live DB state (after July 2026 wipe)
- All demo/test data cleared: profiles=0, users=0, posts=0, matches=0, auth.users=0
- Platform is clean for production use.

## Connection note
- Supabase project region: **eu-west-1** (pooler host: `aws-0-eu-west-1.pooler.supabase.com`)
- Replit environment blocks outbound port 5432 (direct Postgres). Use Supabase Management API (`api.supabase.com/v1/projects/{ref}/database/query`) with `SUPABASE_ACCESS_TOKEN` to run SQL remotely.
- Edge function secrets set via `POST /v1/projects/{ref}/secrets`.

## Edge function deployment from Replit
- `npx supabase functions deploy` fails (DNS resolution blocked for deno.land).
- Use `PATCH https://api.supabase.com/v1/projects/{ref}/functions/{slug}` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` and body `{ verify_jwt: bool, body: "<source>" }`.
- `stream-token` must have `verify_jwt: false` so unauthenticated clients can request a GetStream token.

**Why:** Column name mismatches are silent — queries return an error, `dbConnected` flips false, user sees "Configure Supabase" placeholder. Always verify against live schema before writing queries.
