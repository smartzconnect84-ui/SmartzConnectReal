---
name: Vite manualChunks TDZ bug (production-only stuck loading)
description: Hand-rolled Rollup manualChunks caused "Cannot access 'X' before initialization" only in production builds, never in dev — the recurring cause of the site being stuck on the splash screen.
---

## Symptom
Site works perfectly in Vite dev / Replit preview but is permanently stuck on the
loading splash on the deployed (Vercel) production build, with no console errors
visible from normal checks — the app never mounts.

## Root cause
`vite.config.ts` had a hand-rolled `build.rollupOptions.output.manualChunks(id)`
function splitting `node_modules` into named chunks (`vendor`, `router`, `deps`,
`ui`, `supabase`, etc.) by substring match on the module id. This class of manual
chunking is fragile: it's easy to create a circular dependency between two
chunks (e.g. `deps` importing something from `vendor` which imports something
back from `deps`). Rollup resolves the cycle by picking a load order, and after
minification this shows up as a TDZ `ReferenceError: Cannot access 'X' before
initialization` thrown at module-eval time in one of the chunk files. This only
manifests in the minified production bundle — Vite's dev server serves ES
modules unbundled, so the cycle never triggers there.

**Why it recurred across multiple "fix infinite loading" commits:** each fix
patched one specific cycle (e.g. separating `react` from `react-router`) but
the underlying pattern (manual substring-based node_modules splitting) keeps
creating new cycles as dependencies/chunks are added.

## Fix
Removed the custom `manualChunks` function entirely and let Rollup's automatic
chunking handle vendor splitting. Route-level code splitting is already handled
separately via `React.lazy()` per page in `App.tsx`, so this is not a
regression in load performance for initial paint — it just produces one larger
vendor bundle instead of several hand-split ones.

**How to apply:** Do not reintroduce hand-rolled `manualChunks` keyed on
`node_modules` substrings for this project. If bundle-size splitting is needed
again, prefer splitting by dynamic `import()` at the feature/page level (which
Vite handles safely) over rewriting the vendor chunking function.

## Debugging technique used
`Screenshot` (appPreview/externalUrl) doesn't reliably surface page-level
`error`/`unhandledrejection` events in its "Browser logs". To surface a
minified prod-only crash: serve the built `dist/` locally (temporary
`configureWorkflow` on an unused port), patch a `window.addEventListener('error'...)`
handler directly into `dist/index.html` that renders the error message + stack
into a visible `<div>`, then screenshot — this makes silent prod-only JS
errors visible without needing browser devtools access.
