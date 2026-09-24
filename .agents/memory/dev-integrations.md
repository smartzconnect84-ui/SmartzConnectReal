---
name: Dev-only integrations (OneSignal, Tawk & Turnstile)
description: OneSignal, Tawk, and Turnstile are restricted to smartzconnect.com; skip loading on any other hostname to avoid console noise in development.
---

OneSignal's CDN SDK throws "Can only be used on: https://smartzconnect.com" if initialised on any other hostname. Tawk can return a 400 from its embed endpoint on Replit previews, and Turnstile throws error 110200 for unwhitelisted domains.

**Rule:** `initOneSignal()`, the Tawk embed in `index.html`, and `TurnstileWidget` check the current host before loading. If the hostname is not the production domain, they return early / skip injection.

**Why:** The Cloudflare, OneSignal, and Tawk configurations are production-domain-only. Adding the Replit dev domain to each dashboard would also work, but skipping these integrations in dev is simpler and keeps the preview usable.

**How to apply:** Any new integration that errors on dev domains should follow the same pattern — check hostname at module level and early-return or skip script injection if not on production.
