---
name: Completed unfinished tasks
description: What was completed from the enhancements-v1 "remaining" list, and key decisions made.
---

## Completed items

**EmojiPicker** (`src/components/EmojiPicker.tsx`) — Full categorized picker (9 categories, 400+ emojis, keyword search). Integrated into ChatPage.tsx (replaces quick-emoji bar) and GroupChatPage.tsx (emoji button now toggles popover). Search uses EMOJI_KEYWORDS map + category-name matching.

**TurnstileWidget** (`src/components/TurnstileWidget.tsx`) — Loads Cloudflare's external_api.js via script tag, renders only when VITE_TURNSTILE_SITE_KEY is set. Wiring into LoginPage/RegisterPage is a separate follow-up task (#2).

**Invoice download** (`src/pages/SubscriptionsPage.tsx`) — `downloadInvoice()` generates a styled HTML invoice and triggers a browser download. All user-controlled fields (txId, method, userName, plan.name/period) are HTML-escaped via `escHtml()` before interpolation to prevent injection. Download button appears in the payment success step.

## GitHub push
Use `gitPush({})` callback in CodeExecution (the Replit git integration). Direct git CLI push fails with auth error (invalid username/token). The Replit callback handles GitHub auth automatically.

**Why:** Replit's cloud environment doesn't have the user's GitHub credentials in the git credential store; the platform integration does.

## Vercel
The Vercel project (prj_SgfcXAUIfkcosqdz3sy2YtDtyAXm) is already configured with all env vars. To enable auto-deploy: user must connect the GitHub repo in Vercel dashboard → Settings → Git. CLI deploys remain BLOCKED. Follow-up task #3 covers this.

## Still remaining (not implemented)
- Language translator (needs external API key)
- AI-powered spin matching / real Stream Chat for Spin (follow-up task)
- SmartzTV real video streaming via LiveKit (follow-up task)

## Completed in second pass
- **Turnstile wiring** — `TurnstileWidget` now renders in `LoginPage` and `RegisterPage` (step 1 only). Gated by `VITE_TURNSTILE_SITE_KEY`; zero impact if unset. Dark-mode theme auto-detected from `document.documentElement.classList.contains('dark')`.
- **SpinChatPage swiped_id fix** — `SpinProfile` interface now includes `id: string`; DB upsert uses `currentProfile.id` (was broken using `currentProfile.name`). Bot replies expanded to 15 varied entries with random delay 1–2.5s.
- **SmartzTV StreamModal** — comments load from `stream_comments` table on open, new comments insert to DB with optimistic local update. Gift send inserts to `stream_gifts` table, then tries `increment_gift_count` RPC with fallback to direct `livestreams` update.
- **LiveKitCallContext build fix** — `.select('id', { count: 'exact', head: true })` (invalid TS signature) replaced with `.select('id')` checking `data.length`.
