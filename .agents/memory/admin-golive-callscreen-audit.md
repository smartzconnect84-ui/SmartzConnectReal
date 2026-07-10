---
name: Admin Go-Live, call screen darkness, and account switching
description: Root causes found auditing SmartzTV admin go-live, call screen dark-on-answer, and the CEO account switcher; what was fixed vs. what remains a web-platform limitation.
---

## SmartzTV admin "Go Live" silently failing
`AdminSmartzTV.handleGoLive` updated `livestreams.status/is_admin_broadcast` without checking the Supabase response. If the `livestreams_admin_update` RLS policy (gated by `is_admin()`) rejected the write — e.g. after a session/role drift — zero rows were updated but the admin broadcaster UI opened anyway, so the admin believed they were live while the public SmartzTV page never showed them.
**Fix applied:** check `{data, error}` from the update and refuse to open the broadcaster (show a toast) if no row was updated.
**Why this matters going forward:** any admin action that gates on an RLS-protected UPDATE must check the return value — Supabase does not throw on a policy-blocked update, it just returns 0 rows.

## Call screen "dark when answered"
Not a black screen — `LiveKitCall`'s full-bleed avatar backdrop used `blur(28px) brightness(0.55)`, which reads as "dark" even with a valid profile picture. Reduced to `blur(6px) brightness(0.9)` and narrowed the gradient overlay to just the top/bottom edges so the photo stays clearly visible full-screen. Also added `onError` fallback (avatarLoadFailed) since a broken/expired avatar URL with no fallback rendered as blank/dark.

## Device ringtone limitation
Browsers cannot access a phone's native ringtone files — in-call ringing uses synthesized Web Audio tones (`src/lib/callSounds.ts`) by design; only OS push notifications (OneSignal) get the device's actual default notification sound automatically. This is a hard web-platform limitation, not a bug — flag it to the user rather than trying to "fix" it further.

## CEO account switcher
Already existed (`src/lib/accountSwitcher.ts`, wired into `AdminLoginPage`) — stores refresh tokens (never passwords) for `ceo@smartzconnect.com` (primary, listed first) and `shedrickknungehn@gmail.com`. Extended into the admin topbar itself (`AdminLayout`) as a quick-switch dropdown so switching doesn't require visiting the login page.
