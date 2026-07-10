---
name: Push notification completeness & trigger-originated pushes
description: How server-side (SQL trigger) events get real OS push, and the security rules for that path.
---

## Gap found (2026-07 audit)
`notifyUser()` (client) covers UI-driven actions (calls, follows, gifts, admin
broadcasts). Two DB triggers wrote directly to `notifications` and skipped the
OneSignal push entirely: `check_mutual_like` (dating matches) and
`activate_subscription_on_payment` (mobile money). Also, post like/comment/
reaction UI actions had no push at all.

## Fix pattern: `notify_push_internal()`
A SQL helper in `schema.sql` calls the `send-push` edge function via `pg_net`,
authenticated with a **shared internal secret** (`x-internal-secret` header)
instead of a user JWT — because DB triggers have no user session.

**Why a separate secret, not the service-role key:** reusing the service-role
key as the shared secret would mean a leak of one credential compromises both
full DB access and the push channel. Use a distinct random value
(`app.internal_push_secret` in Postgres, `INTERNAL_PUSH_SECRET` on the edge
function).

**Why `REVOKE ALL/EXECUTE ... FROM PUBLIC, anon, authenticated` is mandatory:**
Postgres functions are executable by any role by default unless revoked —
without this, any authenticated app user could invoke `notify_push_internal`
directly via RPC and abuse the internal-auth path to push-spam arbitrary
users. Always revoke on any SECURITY DEFINER helper that embeds a trusted
secret this way.

**How to apply:** any new server-side (trigger/cron) event that should push
must call `notify_push_internal(user_id, type, title, message, action_url)`
rather than a bare `INSERT INTO notifications`. Never invent a second helper
with different secret handling — reuse this one.
