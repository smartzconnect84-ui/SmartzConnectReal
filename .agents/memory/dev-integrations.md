---
name: Dev-only integrations (OneSignal & Turnstile)
description: OneSignal and Turnstile are restricted to smartzconnect.com; skip loading on any other hostname to avoid console noise in development.
---

OneSignal's CDN SDK throws "Can only be used on: https://smartzconnect.com" if initialised on any other hostname. Turnstile throws error 110200 for unwhitelisted domains.

**Rule:** Both `initOneSignal()` (in `src/lib/onesignal.ts`) and `TurnstileWidget` (in `src/components/TurnstileWidget.tsx`) check `window.location.hostname` against `smartzconnect.com` before loading. If the hostname doesn't match, they return early / return null.

**Why:** The Cloudflare and OneSignal dashboards are configured for the production domain only. Adding the Replit dev domain to both dashboards would also work, but skipping in dev is simpler and keeps logs clean.

**How to apply:** Any new integration that errors on dev domains should follow the same pattern — check hostname at module level and early-return if not on production.
