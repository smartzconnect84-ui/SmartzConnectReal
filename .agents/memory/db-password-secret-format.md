---
name: DB password secret format
description: How SUPABASE_DB_PASSWORD gets corrupted when re-entered, and how to diagnose true secret-injection failures vs. bad values.
---

# Supabase DB password secret pitfalls

- When asking a user to (re-)enter `SUPABASE_DB_PASSWORD` via `requestSecrets`, they will often paste the **whole connection string** (`postgresql://user:pass@host:port/db`) instead of just the password segment. Detect this by checking the value for `@`/`/`/`supabase.com` before trusting it — a real Postgres password won't contain those characters shaped like a URL.
- If `psql`/`PGPASSWORD` auth fails with `password authentication failed for user "postgres"` even though the value looks password-shaped, it may simply be stale/wrong (Supabase never re-displays the original password after project creation). The reliable fix is to have the user click **Reset database password** in the Supabase dashboard (Project Settings → Database) and paste the new one — this only affects direct Postgres/psql access, not the app (which uses the anon/service REST API keys), so it's safe to do without touching app config.
- Separately: secrets can show as registered (`viewEnvVars` returns `true`) yet resolve to an **empty string** in both `ShellExec` and a configured workflow (e.g. Vercel deploy failing with "You defined --token, but it's missing a value"). This is a real environment sync gap, not user error — confirm by checking `${#VAR}` length in a shell; if genuinely 0 across multiple secrets at once, it's a platform-side propagation issue. Re-requesting the same secrets via `requestSecrets` and having the user re-save them resolves it.

**Why:** Silently trusting an empty or malformed secret wastes a full deploy/migration cycle before failing with a confusing downstream error. Checking length and shape upfront catches both failure modes in one round trip.

**How to apply:** Before using any freshly-(re)requested DB/API secret for a real operation, do a quick non-printing sanity check (`${#VAR}` length, shape heuristics) in a shell, not just `viewEnvVars` existence.

Update (2026-07-12): confirmed this "registered but resolves empty" state hit `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, and `VERCEL_TOKEN` simultaneously in one session — re-running `requestSecrets` and having the user re-paste each one fixed all three. Separately, even after a successful `requestSecrets` round-trip, `SUPABASE_DB_PASSWORD` can still fail psql auth because the value is genuinely stale (not an env-propagation issue) — if the user pastes the password via plain chat text after a dashboard reset (bypassing the secure form), it works for that session's shell commands immediately but the Replit Secret itself still holds the old broken value until they resubmit it through the secure `requestSecrets` form.
