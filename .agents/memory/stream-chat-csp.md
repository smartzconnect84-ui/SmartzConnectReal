---
name: Stream Chat CSP
description: Correct Content-Security-Policy domains for Stream Chat SDK (WebSocket + REST)
---

## Rule
Stream Chat SDK does NOT use `api.stream-io-api.com`. It connects to:
- REST: `https://chat.stream-io-api.com`
- WebSocket: `wss://chat.stream-io-api.com`
- Edge CDN: `https://edge.getstream.io` / `wss://edge.getstream.io`

**CSP must use wildcard:** `https://*.stream-io-api.com wss://*.stream-io-api.com https://edge.getstream.io wss://edge.getstream.io`

**Why:** Chat on Replit preview worked because Vite's dev server doesn't enforce CSP headers (defined in `public/_headers` and `vercel.json`). On production (`smartzconnect.com`), the CSP blocked all WebSocket connections to Stream Chat, breaking DMs, Group Chat, Spin&Chat, and Dating messaging.

**How to apply:** Update `connect-src` in BOTH `public/_headers` AND `vercel.json` headers section whenever Stream-related domains need updating.
