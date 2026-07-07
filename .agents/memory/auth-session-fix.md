---
name: Auth session persistence fix
description: How the AuthContext loading/role race was fixed to prevent admin redirect-on-refresh.
---

## The bug
`getSession()` called `setLoading(false)` immediately after starting `fetchRole()` (fire-and-forget). This meant `AdminRoute` saw `loading=false` but `isAdmin=false` (role still default 'user') for the brief time the Supabase query was in flight. Admin users were redirected to `/app/feed` on every page refresh.

## The fix
- Replaced `fetchRole` (standalone) with `resolveRole` (returns the role value, no setState).
- `getSession().then()` now **awaits** `resolveRole` before calling `setLoading(false)`. Role is known before any route guard renders.
- `SIGNED_IN` event in `onAuthStateChange` also awaits role resolution before `setLoading(false)` so admin navigation after fresh sign-in is also correct.
- All `setRole` / `setLoading` calls inside the effect are guarded by `if (isMounted)` to prevent post-unmount state updates.
- Added `TOKEN_REFRESHED` handler (no-op, just clears loading if needed).

**Why:** Both `getSession()` and `onAuthStateChange` callbacks are async in this implementation. INITIAL_SESSION fires synchronously before the promise resolves, so role must be awaited in the `getSession` path specifically.

**How to apply:** If auth behavior regresses (admin redirect loop, role flicker), check that `setLoading(false)` is never called before `resolveRole()` resolves in the initial-session branch.
