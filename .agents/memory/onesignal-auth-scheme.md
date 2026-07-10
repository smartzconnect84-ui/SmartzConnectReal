---
name: OneSignal REST auth scheme must be consistent across all edge functions
description: All server-side OneSignal calls must use "Key <key>", not "Basic <key>" — found two functions still on the old scheme during a 2026-07 audit.
---

`send-push` (the canonical push path, wired via `notifyUser()`) correctly uses
`Authorization: Key <ONESIGNAL_REST_API_KEY>`. Two other edge functions —
`notify` (unused/dead, not invoked from client code) and `stream-webhook`
(DM push on Stream `message.new`) — still used the legacy `Authorization:
Basic <key>` scheme, which fails silently against current-format OneSignal
keys ("Access denied" with no detail).

**Why:** OneSignal migrated REST key auth to the `Key` scheme; `Basic` only
works with old-format keys. Any new edge function that calls OneSignal's
`/notifications` endpoint must copy `send-push`'s auth header, not invent one.

**How to apply:** when adding/reviewing any OneSignal call, grep for
`Authorization.*Basic` against `onesignal.com` — that pattern is always wrong
now. Also: `stream-webhook` previously skipped recipient push whenever the
Stream payload omitted `event.members` (common for plain `message.new`
events) — it now falls back to `StreamChat.getInstance(key,secret).channel(type,id).query()`
server-side to resolve members. And webhook signature verification is
mandatory whenever `STREAM_API_SECRET` is configured — a request without
`x-signature` must be rejected, not silently allowed through.
