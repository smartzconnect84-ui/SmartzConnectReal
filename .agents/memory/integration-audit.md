---
name: Integration audit fixes
description: Key decisions and constraints from the OneSignal/GetStream/Jitsi/Turnstile audit and fix pass.
---

## Jitsi — External API (not iframe src)
Use `window.JitsiMeetExternalAPI` loaded from `https://meet.jit.si/external_api.js` to get real mic/camera control. The old `<iframe src="...">` approach cannot control media cross-origin. The External API renders into a `<div ref>` container. Wire `toggleAudio`/`toggleVideo` executeCommand to the overlay buttons; listen to `audioMuteStatusChanged` / `videoMuteStatusChanged` events to sync state. CSP `script-src` must include `https://meet.jit.si`; `connect-src` must include `https://*.jit.si wss://*.jit.si`.

**Why:** Jitsi iframe is cross-origin — contentWindow commands are blocked. External API is the only way to control audio/video from the host page.

## GetStream — no dev token in production
`connectStreamUser` must require a real JWT token; removed `streamClient.devToken()` fallback. If no token is provided, the function returns null without connecting.

**Why:** Dev tokens bypass Stream's auth entirely and would allow any user to impersonate any other user in production.

## GetStream — StreamContext now connects the client
After fetching the token from the `stream-token` Supabase Edge Function, StreamContext now calls `connectStreamUser()` directly. It also subscribes to `notification.message_new` / `notification.mark_read` events to keep `unreadCount` live. The correct API is `client.getUnreadCount()` → `.total_unread_count` (not `.unread_count`).

## Turnstile — include Cloudflare Pages preview domains
TurnstileWidget `isProduction` check includes both `smartzconnect.com` and `smartzconnect.pages.dev` (and their subdomains) to match OneSignal's guard. Without this, Turnstile widgets would not render on CF Pages preview deployments.

## AdminSettings — localStorage persistence
Settings (toggles, theme, color, mode, border-radius, font-scale) are persisted to `localStorage` under key `smartz_admin_settings`. No DB migration needed. Loaded on mount via `useEffect`.

**Why:** Creating a new Supabase table requires a migration; localStorage is sufficient for admin settings that are per-browser/per-admin and don't need cross-device sync.

## ChatPage — Paperclip and Mic buttons
Paperclip triggers a hidden `<input type="file">` which appends `[📎 filename]` to the message input. Mic shows an animated toast "Voice messages coming soon". The outer `div` must be `relative` for the toast's `absolute` positioning to work correctly.

## SpinChatPage — Connect button
Connect button does an `upsert` into `swipes` table with `action: 'like'` and `source: 'spin_chat'`. Shows loading spinner then a "Matched!" confirmation state, then auto-resets after 2.5s.

## GroupChatPage — Plus button
Opens a full create-room modal with fields: emoji, name, topic, category (pill picker), type (public/private). Created rooms are added to local state immediately. Wire to Supabase `group_rooms` table insert when that table is created.
