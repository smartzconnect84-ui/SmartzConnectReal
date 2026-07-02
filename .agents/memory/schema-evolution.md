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

## Live DB scan (July 2026)
- 111 tables confirmed in production Supabase (`ufmuhwepyxzaldvcbipd`)
- **`activity_feed`** — was missing; added in v6
- **`post_shares`** — was missing; added in v6 (reposts tracked via posts.original_post_id; explicit share join table now exists)
- **`video_calls.jitsi_room`** — Jitsi remnant; LiveKit cols added alongside in v6 (livekit_room, livekit_token, room_type, participants, recording_url, ended_at)
- **`stream_tokens`** — missing room_id, token_type; added in v6
- **`notification_preferences`** — missing push_calls, push_social types; 11 new columns added in v6

## Connection note
Replit environment blocks outbound port 5432 to Supabase. Cannot use psql directly. Run SQL via Supabase Dashboard → SQL Editor.

**Why:** Migrations are tracked by file version so agents can audit what's deployed without re-scanning the whole schema.
