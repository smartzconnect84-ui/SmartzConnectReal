---
name: stories.media_type CHECK constraint missing 'text' (fixed 2026-07-11)
description: Text stories always failed the DB CHECK constraint; image/video stories were fine.
---

`stories_media_type_check` on the live DB only allowed `ANY (ARRAY['image','video'])`. Text stories (added later — `media_type='text'` with `text_content`/`bg_color`, no `media_url`) were never granted a matching migration, so every text-story insert (FeedPage StoriesBar quick text story, and CreateModal's text tab) failed at the DB layer with a constraint violation. FeedPage's `handleTextStorySubmit` swallows the error (`catch { /* ignore */ }`), so it looked like nothing happened; CreateModal's version does surface `err.message` but it's a raw Postgres constraint string, not user-friendly.

**Fix:** `alter table stories` — dropped and recreated `stories_media_type_check` to include `'text'` (see `supabase/schema_v16_stories_text_fix.sql`). Verified via direct RLS-simulated insert (SET ROLE authenticated + request.jwt.claims) that text/image story inserts and post_comments inserts all succeed post-fix.

**Why noted:** any time a new `media_type`/`enum`-like value is added on the frontend, check the live DB's CHECK constraint too — schema files in the repo don't always match what's actually deployed (see `schema-evolution.md`).

**Comments status:** `post_comments` insert + RLS select tested independently (same exact columns the frontend sends: `post_id, author_id, user_id, content`) and worked correctly — not a backend bug. The live table only had 0 rows, consistent with low usage (10 profiles, 2 posts) rather than a broken pipeline.
