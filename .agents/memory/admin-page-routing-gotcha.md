---
name: Admin page routing gotcha
description: A fully-built admin page can be completely unreachable if it's only wired into the sidebar nav, not the router.
---

Found `AdminWorldChat.tsx` — a complete 500+ line page with working edit/delete/pin/upload wired live to GetStream — present in the repo and referenced by path in `AdminLayout.tsx`'s sidebar `navItems`, but never imported or given a `<Route>` in `App.tsx`. Clicking the sidebar link 404'd to the catch-all redirect.

**Why:** sidebar nav arrays and the route tree are two separate, hand-maintained lists in this codebase; adding a page to one does not add it to the other, and nothing errors when they drift.

**How to apply:** whenever a new admin (or app) page is added, or when auditing whether an existing feature "works end-to-end," grep `App.tsx` for both the lazy import and the `<Route path="...">` entry — don't infer reachability from the sidebar/nav array alone.
