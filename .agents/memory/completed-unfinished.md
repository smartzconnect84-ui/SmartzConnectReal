---
name: Completed unfinished tasks
description: What was completed from the enhancements-v1 "remaining" list, and key decisions made.
---

## Completed items

**EmojiPicker** (`src/components/EmojiPicker.tsx`) — Full categorized picker (9 categories, 400+ emojis, keyword search). Integrated into ChatPage.tsx (replaces quick-emoji bar) and GroupChatPage.tsx (emoji button now toggles popover). Search uses EMOJI_KEYWORDS map + category-name matching.

**TurnstileWidget** (`src/components/TurnstileWidget.tsx`) — Loads Cloudflare's external_api.js via script tag, renders only when VITE_TURNSTILE_SITE_KEY is set. Wired into LoginPage and RegisterPage (step 1 only). Theme auto-detected from `document.documentElement.classList.contains('dark')`.

**Invoice download** (`src/pages/SubscriptionsPage.tsx`) — `downloadInvoice()` generates a styled HTML invoice and triggers a browser download. All user-controlled fields are HTML-escaped via `escHtml()`.

## GitHub push
Use `gitPush({})` callback in CodeExecution (the Replit git integration). Direct git CLI push fails with auth error (invalid username/token). The Replit callback handles GitHub auth automatically.

**Why:** Replit's cloud environment doesn't have the user's GitHub credentials in the git credential store; the platform integration does.

## Vercel
The Vercel project (prj_SgfcXAUIfkcosqdz3sy2YtDtyAXm) is already configured with all env vars. To enable auto-deploy: user must connect the GitHub repo in Vercel dashboard → Settings → Git. CLI deploys remain BLOCKED.

## Completed in second pass
- **Turnstile wiring** — `TurnstileWidget` now renders in `LoginPage` and `RegisterPage` (step 1 only). Gated by `VITE_TURNSTILE_SITE_KEY`; zero impact if unset. Dark-mode theme auto-detected.
- **SpinChatPage swiped_id fix** — `SpinProfile` interface includes `id: string`; DB upsert uses `currentProfile.id`.
- **SmartzTV StreamModal** — comments load from `stream_comments` table on open, new comments insert to DB with optimistic local update. Gift send inserts to `stream_gifts` table.
- **LiveKitCallContext build fix** — `.select('id', { count: 'exact', head: true })` replaced with `.select('id')` checking `data.length`.

## Completed in third pass
- **SpinChatPage real Stream Chat** — `setupStreamChannel` useEffect creates a real `messaging` channel between matched user IDs using `getOrCreateDirectChannel`. Falls back to bot mode if Stream not connected. `chatMode` state: `'idle' | 'connecting' | 'live' | 'demo'`. Chat header shows Live/Connecting/Demo badge. Messages from remote user arrive via `channel.on('message.new', ...)` (skips own messages). Cleanup: `stopWatching()` on reset, spin-again, and unmount.
- **SmartzTVBroadcaster** — Full-screen LiveKit broadcaster. Connects to room `smartz-tv-{streamId}`, publishes camera+mic, shows live preview with HUD (LIVE badge, timer, viewer count). Mute/camera toggle and end-stream button. On end: disconnects room, sets `livestreams.status = 'ended'`.
- **SmartzTV viewer (StreamModal)** — For live streams, connects to same LiveKit room as subscriber (no publishing). Remote video overlays the thumbnail when track arrives; "Connecting to stream…" spinner shown while waiting. Gracefully degrades if LiveKit not configured.
- **handleGoLive** — Now uses `.select('id').single()` to get the inserted row's ID, then sets `broadcastData` to launch the broadcaster overlay.

## Still remaining (not implemented)
- Language translator (needs external API key)
- Spin Chat: real peer-to-peer match routing (currently any authenticated user can be matched — no presence/availability system)
- SmartzTV: viewer count increment via Realtime subscription
