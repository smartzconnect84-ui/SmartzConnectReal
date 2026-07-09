---
name: Admin Public TV Broadcast
description: How admin broadcasts work on the public SmartzTV page — schema, token issuance, and access control.
---

# Admin Public TV Broadcast

## Schema
- `livestreams.is_admin_broadcast BOOLEAN DEFAULT FALSE` — set by admin in AdminSmartzTV panel
- `platform_settings` table (key-value): `banner_enabled` row stores global banner toggle
- RLS on `platform_settings`: public SELECT, admin INSERT/UPDATE/DELETE

## How It Works
1. Admin goes to Admin → SmartzTV, clicks "Publish to Public TV" on any live stream
2. This sets `is_admin_broadcast = true` on that row in Supabase
3. Public `/smartztv` page queries `livestreams` for `is_admin_broadcast=true AND status=live`
4. `PublicLiveTVPlayer` fetches a viewer token from `livekit-public-token` edge function using only the Supabase anon key (no user auth)
5. Token function validates `is_admin_broadcast=true AND status=live` in DB before issuing token — prevents token farming for community streams

## Edge Function
- File: `supabase/functions/livekit-public-token/index.ts`
- Deployed with `--no-verify-jwt` (no user JWT required)
- Uses SERVICE_ROLE_KEY to query DB for authorization check
- Token issuance is `canPublish: false, canSubscribe: true` (viewer only)
- Deploy via Supabase Dashboard → Edge Functions → Deploy (API token auth kept failing from Replit)

**Why:** Edge function deployment from Replit fails 401 for this project even with valid PAT and --use-api flag. Deploy manually from dashboard or CI.

## Access Control
- Community streams (is_admin_broadcast=false) are shown on public page as a teaser grid with lock overlay — clicking goes to /register
- Live video for community streams is never served to anonymous users (token function rejects non-admin-broadcast rooms)
- Admin broadcasts on public page: full live video via WebRTC, mute/fullscreen controls, channel selector when multiple broadcasts

## Banner Toggle
- `bannerEnabled` stored in `platform_settings.banner_enabled` (Supabase, realtime)
- All clients subscribe via Supabase Realtime — toggle changes propagate instantly
- Admin toggles in Admin → Settings → Announcements tab
