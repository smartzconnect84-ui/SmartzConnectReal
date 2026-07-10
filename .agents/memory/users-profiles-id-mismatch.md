---
name: users.id vs profiles.id identity mismatch
description: users.id is not the auth/profile UUID — using it where a UUID is expected (e.g. push recipient targeting) silently fails.
---

`public.users` has its own PK (`id`) that is separate from the Supabase auth
UUID; the auth UUID lives in `users.auth_id`. `public.profiles.id` IS the
auth UUID directly (profiles is keyed 1:1 by auth UUID).

**Why:** found while wiring admin broadcast push fan-out — segment queries
built on `users.subscription_tier` returned `users.id` values, which were
then passed to `send-push`, which validates/targets by `profiles.id`
(auth UUID). Every one of those pushes would have 404'd as "Recipient not
found" while the UI reported success.

**How to apply:** whenever code needs to feed a `users`-table query result
into anything that expects a profile/auth UUID (push targeting, RLS-scoped
queries, OneSignal `external_id`), select `auth_id` from `users`, not `id`.
Reserve `users.id` for updates/deletes against the `users` table itself.
