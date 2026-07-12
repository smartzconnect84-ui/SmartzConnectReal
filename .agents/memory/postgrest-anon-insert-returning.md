---
name: PostgREST anon insert + RLS returning gotcha
description: Why a public anon INSERT can 401 with "row violates row-level security policy" even though the INSERT policy itself is correct.
---

When a table has an anon/authenticated INSERT policy with `with check (true)` but SELECT is
locked to admins only, an insert that also asks PostgREST to return the row (`Prefer:
return=representation`, i.e. calling `.select()` after `.insert()`/`.upsert()` in supabase-js)
fails with the same 42501 "new row violates row-level security policy" error — because
`INSERT ... RETURNING` implicitly re-checks the SELECT policy on the new row, which the
anon/public role doesn't have.

**Why:** Postgres RLS evaluates the RETURNING clause under the SELECT policy set, not the
INSERT policy set. A passing INSERT check does not guarantee a passing implicit SELECT.

**How to apply:** For public-facing inserts (newsletter signups, contact forms, etc.) where only
admins can read the table back, do NOT chain `.select()` on the client insert/upsert call —
supabase-js defaults to `return=minimal` without it, which sidesteps the RETURNING/SELECT check
entirely. If you need the inserted row back, either add a narrow "insert own row" SELECT policy
or use a SECURITY DEFINER RPC instead.
