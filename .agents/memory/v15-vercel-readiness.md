---
name: v15 completion & Vercel readiness
description: Fixes applied to complete v15 tasks and unblock Vercel deployment.
---

## Build blocker — Stream Chat `ChannelData` type
`WorldChatPage.tsx` passed `{ name: 'World Chat' }` as the third arg to `client.channel()`. Stream Chat v9 `ChannelData` type does not expose `name`, causing TS2353 compile error. Fix: cast the init object as `Record<string, unknown>` — runtime behaviour unchanged.

**Why:** stream-chat v9 tightened the `ChannelData` generic; `name` must be in the extra-data map but the type doesn't declare it.

## ReferralsPage async error handling
`Promise.all([...]).then(...)` had no `.catch()` or `.finally()`, leaving `loading=true` forever on any fetch failure.

Fix: added `.catch(err => console.error(...)).finally(() => { if (isMounted) setLoading(false) })`.

**Why:** isMounted-guarded finally is the safe pattern (matches rest of codebase); catch before finally to log the error.

## WorldStage public spotlight data exposure
`/public/WorldStagePage.tsx` queried `worldstage_spotlights` without filtering `is_active`, so admin-hidden spotlights could appear publicly.

Fix: added `.eq('is_active', true)` before `.order(...)`.

## Sidebar broken routes
Nav items for Pages, Events, Jobs, Learning linked to `/app/pages`, `/app/events`, `/app/jobs`, `/app/learning` which had no routes — wildcard catch redirected users to `/` (home), breaking UX.

Fix: added inline `ComingSoon` component in `App.tsx` + four protected routes under `/app`.

**How to apply:** When adding new sidebar items, always wire up a route simultaneously — even a placeholder.
