---
name: Integration audit lessons (GetStream/LiveKit/Supabase/OneSignal/SUFY)
description: Durable lessons from auditing SmartzConnect's third-party integrations and DB — how to tell real bugs from false positives, and a TS nullability gotcha.
---

# Integration Audit Lessons

## Codebase has many historical/dead integration variants
Before treating an apparent mismatch (wrong function name, "missing" table, alarming UI copy) as a bug, verify against what's actually live: check the live DB (or a fresh `pg_catalog` snapshot) rather than the base schema file, check which edge functions are actually deployed/ACTIVE via the Management API, and check which functions the client code actually imports/calls. Several "issues" found by a first-pass audit here (an unused legacy edge function, a table missing from one schema file but present live, disconnected-state UI text) turned out to be non-issues once verified this way.

**Why:** this project has multiple schema files/addenda and duplicate-looking edge functions from iterative development; surface-level greps produce false positives.

## `tsc -b` (project references) catches null-safety errors that `tsc --noEmit` at the repo root misses
This project's root `tsconfig.json` only has `references`, no `files`/`include` — running `npx tsc --noEmit` there type-checks nothing useful. Must run `npx tsc -b` (or `--force` after clearing `node_modules/.tmp/*.tsbuildinfo`) to actually build via `tsconfig.app.json`/`tsconfig.node.json` and surface real errors (e.g. TS18047 possibly-null).

**How to apply:** always verify with `npx tsc -b --force` (clearing incremental build info first) before declaring a change type-safe in this repo.

## Nullable module-level singletons and closures
When a module-level `const` is typed nullable (e.g. `streamClient: StreamChat | null`), a null-guard at the top of a `useEffect` does NOT narrow the type inside nested async closures defined within that effect — capture it into a local `const` after the guard and reference the local inside the closure.
