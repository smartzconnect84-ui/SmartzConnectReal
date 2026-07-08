---
name: Livestreams table schema & PostgREST join limits
description: Actual column names in the livestreams table (differ from what the frontend assumed); no FK relationships exist so PostgREST joins must be done separately.
---

## Actual live column names (livestreams)
| Code assumed | Live column | Note |
|---|---|---|
| `streamer_id` | `creator_id` | uuid, no FK to profiles |
| `view_count` | `viewer_count` | integer |
| `like_count` | *(doesn't exist)* | omit entirely |
| `gift_count` | `gifts_earned` | numeric |

## No FK relationships exist
`stories.author_id`, `livestreams.creator_id` — neither has a FK to `profiles`.
PostgREST embedded-resource syntax (e.g. `profiles:creator_id(...)`) silently returns null
without a FK. **Always fetch profiles in a separate query and merge client-side.**

## Atomic gift increment RPC
`increment_gifts_earned(stream_row_id uuid, amount numeric)` created 2026-07-08.
Use this instead of client-side read-modify-write to prevent concurrent-write data loss.

**Why:** Concurrent gifts from multiple clients would overwrite each other's totals with stale local state.

## LiveKit broadcaster timeout pattern
20-second timeout with `timedOut` flag that:
1. Calls `room.disconnect()` to abort pending connection
2. Checks `timedOut` guard in success path to prevent late-connect overwriting the error state
3. Calls `setLkError('')` on success to clear any race-set error
