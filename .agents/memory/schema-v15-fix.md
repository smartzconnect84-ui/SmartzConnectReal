---
name: Schema v15 SQL bugs and fix
description: Bugs found in schema_v15 SQL and how they were resolved
---

## Bugs in schema_v15_worldstage_referral_calls.sql

1. **Missing ALTER TABLE** — The SQL created a unique index on `profiles.referral_code` before adding the column. Fix: run `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;` first.

2. **Dollar-quote syntax** — Functions `confirm_referral` and `apply_referral_code` used `$;` as the closing delimiter instead of `$$;`. This caused the function body to be parsed incorrectly.

## Resolution
`supabase/schema_v15_fix.sql` was created and applied. It is idempotent and:
- Adds the `referral_code` column with `IF NOT EXISTS`
- Re-creates both functions with correct `$$` delimiters
- Re-creates the trigger `trg_profiles_confirm_referral`
- Re-creates the `has_active_perk` helper

**Why:** Partial SQL failure left the DB without referral functions. The fix file can be re-run safely anytime.
