---
name: Feature additions July 2026
description: New pages, routes, schema tables, and UI features added in the July 2026 pass.
---

## New Pages & Routes
- `/app/help` → `HelpSupportPage` — FAQ accordion by category, live chat button (opens LiveChatContext), email/phone contact links, safety links.
- `/app/saved` → `SavedPostsPage` — queries `post_saves` JOIN `posts`, supports unsave, like, share.
- Both added to LeftSidebar bottomNav, AppShell drawerSections, and App.tsx routes.

## Google Sign-In on Register Page
- `RegisterPage` step 1 now has "Continue with Google" button above the email form.
- Uses `signInWithGoogle()` from `useAuth`. Redirects via OAuth — no navigate() needed.
- `googleLoading` state disables the button during the OAuth redirect.

## Admin SmartzTV — Go Live Broadcaster
- `AdminBroadcaster` component added inline in AdminSmartzTV.tsx (mirrors SmartzTVBroadcaster pattern).
- `handleGoLive(stream)` sets DB status to 'live' then sets broadcastData state → launches broadcaster overlay.
- Stream cards now show: pending→Approve/Reject + "Go Live Now" (admin-created); approved+admin-created→"Go Live"; live→"Resume Broadcast".
- LiveKit token fetched via `livekit-token` edge function (same as user broadcaster).

## Post Emoji Reactions
- `post_reactions` table: (post_id, user_id, emoji), UNIQUE per trio. 6 emojis: ❤️🔥😂😮😢👏.
- `REACTION_EMOJIS` constant in FeedPage. `reactions` + `myReaction` state per PostCard.
- Fetch on mount via supabase (separate from the main post fetch to avoid query explosion).
- Reaction bar renders above the Like/Comment/Share row.

## Text Story Creation
- `TEXT_STORY_BG_OPTIONS` — 6 gradient presets.
- "Text Story" button (Aa) in StoriesBar, only shown when user has no active story.
- `TextStoryModal` opens inline; stores to `stories` with `media_type='text'`, `text_content`, `bg_color`.
- New schema columns: `stories.text_content TEXT`, `stories.bg_color TEXT DEFAULT 'from-pink-500 to-rose-600'`.

## Schema (schema_v14_reactions_stories_saves.sql)
- `post_reactions` table with RLS
- `post_saves` table (if not exists) with RLS
- `team_members` table (if not exists) with RLS — required for AdminTeam to work
- `stories.text_content` and `stories.bg_color` columns added via DO block
- `platform_settings` table seed

## Admin Sidebar Cleanup
- `Advertisements` nav item changed from `Megaphone` icon (duplicate of Broadcasts) to `Zap` icon.
