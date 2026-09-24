---
name: Feed foundation
description: Durable rules for the SmartzConnect social feed’s pagination, visibility, and realtime consistency.
---

The feed uses public visibility as the safe baseline, cursor pagination by descending `created_at`, and a separate Following filter derived from `follows`. Older pages must merge by post ID so realtime refreshes and pagination cannot duplicate cards.

**Why:** The feed is backed by external Supabase tables whose shape has evolved over time, so the client must avoid exposing private rows and must remain correct when posts, likes, comments, and follows change in another session.

**How to apply:** Keep pagination and visibility enforcement in the shared feed query path. Treat optimistic likes/saves as provisional until the write succeeds, and ignore the current user’s own realtime comment event when the UI has already applied its local count.