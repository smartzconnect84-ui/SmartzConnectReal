---
name: Auth session persistence fix
description: How the AuthContext loading/role race was fixed to prevent admin redirect-on-refresh.
---

## The bug
`getSession()` called `setLoading(false)` immediately after starting `fetchRole()` (fire-and-forget). This meant `AdminRoute` saw `loading=false` but `isAdmin=false` (role still default 'user') for the brief time the Supabase query was in flight. Admin users were redirected to `/app/feed` on every page refresh.

## The fix
- Replaced `fetchRole` (standalone) with `resolveRole(userId): Promise<string | null>` — returns `null` on Supabase error (network, policy, missing row), returns the role string on success.
- `getSession().then()` now **awaits** `resolveRole` before calling `setLoading(false)`. Role is known before any route guard renders.
- `SIGNED_IN` event also awaits role before `setLoading(false)` so admin navigation after fresh sign-in is correct.
- `TOKEN_REFRESHED` event re-fetches role; only applies it if `resolved !== null` — preserves existing role on transient failure (never demotes an admin due to network error).
- Added `currentUserIdRef` (useRef) to track the active user ID. All `setRole` calls after `await` check `currentUserIdRef.current === uid` to prevent stale async overwrites when auth events fire rapidly (e.g., sign-out/sign-in in quick succession).
- All `setRole` / `setLoading` calls are also guarded by `isMounted` to prevent post-unmount state updates.
- `getSession()` and `SIGNED_IN` use `resolved ?? 'user'` fallback — safe default for first contact when DB is unreachable.

**Why:** Both `getSession()` and `onAuthStateChange` callbacks are async. INITIAL_SESSION fires synchronously before the promise resolves, so role must be awaited in the `getSession` path specifically. TOKEN_REFRESHED fires ~hourly and must not demote admins on transient failures.

**How to apply:** If auth behavior regresses (admin redirect loop, role flicker, wrong role after switch), check: (1) `setLoading(false)` is never called before `resolveRole()` resolves in the initial-session branch; (2) TOKEN_REFRESHED only applies non-null role; (3) `currentUserIdRef.current === uid` guard is present after every `await resolveRole`.
