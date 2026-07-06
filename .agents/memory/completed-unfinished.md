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
- AI-powered spin matching (follow-up task #4)
- Voice notes (placeholder toast only)
