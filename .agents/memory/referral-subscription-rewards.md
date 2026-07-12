---
name: Referral → subscription milestone rewards
description: How inviting 10/20 confirmed friends auto-grants free Premium/VIP for 14 days, and how it coexists with paid/admin subscriptions.
---

## Design
- Only the **referrer**'s confirmed-referral count matters (not the referred
  user's). Threshold check runs inside `evaluate_referral_subscription_reward()`,
  called from `trg_confirm_referral_on_verify` right after `confirm_referral()`
  on each email-verification-triggered confirmation.
- 10 confirmed referrals → Premium for 14 days. 20 → VIP for 14 days. Each new
  confirmation past a threshold *refreshes* the 14-day window (renews, doesn't
  stack), so `referral_reward_grants (user_id, tier)` is upserted, not inserted
  fresh each time.
- Congratulation notification (+ best-effort push via `notify_push_internal`)
  only fires on a **newly crossed** threshold, not on every subsequent
  confirmation — guarded by comparing against the existing grant row / current
  profile tier.

## Source-of-truth / non-clobbering rule
Added `profiles.subscription_source` (`free|referral|payment|admin`) and
`profiles.subscription_expires_at`. The reward function never downgrades or
interrupts an active `payment`/`admin` sourced tier that's already ≥ the
target reward tier. A hourly `pg_cron` job (`revert-expired-referral-subscriptions`,
also called opportunistically client-side on every sign-in from
`AuthContext.tsx`) reverts expired **referral**-sourced tiers back to `free` —
it never touches `payment`/`admin` rows.

**Why:** `profiles.subscription_tier` is the actual runtime gate for
Premium/VIP UI (not `users.subscription_tier`, which is a separate legacy
column used only by the admin panel) — see `users-profiles-id-mismatch.md`.
Any reward/expiry logic must write there, and must never silently take away
something the user paid for.

## users/profiles dual subscription-tier sync
`public.users.subscription_tier` (legacy, integer-keyed, admin-panel-facing)
and `public.profiles.subscription_tier` (uuid-keyed, actual UI gate) are kept
in sync by two triggers: `mark_subscription_admin_on_grant` (on
`user_subscriptions` insert, resolves `users.auth_id` → `profiles.id`) and
`mirror_subscription_to_users` (on `profiles` subscription-column update,
mirrors back via `auth_id`). Before this, admin "Grant Plan" only wrote
`users.subscription_tier` and never actually affected what the app gated.
