---
name: Stream Chat + WorldChat fixes (July 2026)
description: Root causes and fixes for chat endless-loading; WorldChat channel type; stream-token edge function deployment pattern.
---

# Stream Chat Diagnosis & Fixes

## Root Causes Found

1. **WorldChat `members:[]` bug** — channel was created with `messaging` type and empty members list. `messaging` channels require explicit membership for `watch()`. Fixed by switching to `livestream` channel type (`smartz-worldchat-v2`) where any authenticated user can watch/send without membership.

2. **`getstream_api_secret` placeholder** — `admin_config` row had `REPLACE_WITH_YOUR_GETSTREAM_API_SECRET`. Updated to the real secret value. BUT: `STREAM_SECRET` from Vercel is NOT the same as `STREAM_API_SECRET`. Confirmed via token signature failures.

3. **`generate_getstream_token` DB function needs `extensions.hmac()`** — `pgcrypto` is installed in the `extensions` schema, not `public`. The function must have `SET search_path = public, extensions` or use `extensions.hmac()` explicitly; otherwise calling it via RPC fails with "function hmac(bytea, bytea, unknown) does not exist".

4. **Edge function `STREAM_API_SECRET` IS set in Supabase** — confirmed by tokens generated yesterday (2026-07-08) in `stream_tokens` table with valid signatures. The token generation was working; WorldChat bugs caused the UX failures.

## Key Values
- Stream API Key: `awspcvfkzuq7` (public, in VITE_STREAM_API_KEY)
- Stream App ID: `1630966`
- World Chat: `livestream` type, channel ID `smartz-worldchat-v2`

**Why:** `messaging` channels are private (member-only), `livestream` channels are public-readable/writeable by any authenticated user — correct for global chat rooms.

## What stream-token Edge Function Needs (Supabase Secrets)
- `STREAM_API_SECRET` — the GetStream API signing secret (already set)
- `STREAM_API_KEY` — the public API key `awspcvfkzuq7` (NEW REQUIREMENT after July 2026 changes; must be set before deploying new function version)
- `SUPABASE_SERVICE_ROLE_KEY` — needed for stream_tokens upsert cache

## Deployment Blocker
Supabase Management API returns 401 for the stored PAT when called from Replit. Can't deploy edge functions or set secrets via CLI/API from Replit. Must be done via Supabase dashboard.

**How to apply:** When edge function changes needed, go to supabase.com/dashboard → Edge Functions → stream-token → Deploy. Or create a GitHub Actions workflow (requires `workflow` scope PAT).

## Frontend-Only Fix Path
Since edge function can't be deployed remotely, the current `livestream` channel type fix in WorldChatPage.tsx is frontend-only and works without edge function changes. This is sufficient for the world chat fix.
