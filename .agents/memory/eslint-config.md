---
name: ESLint config decisions
description: Why certain rules are off/warn in this project's eslint.config.js
---

## Rules turned OFF
- `react-hooks/set-state-in-effect` — false positive on standard `useEffect(() => { fetchData() }, [fetchData])` async data-fetching pattern
- `react-hooks/purity` — false positive on Date.now() in helpers called during render

## Rules downgraded to WARN
- `@typescript-eslint/no-explicit-any` — Supabase returns untyped data; `any` is acceptable until Supabase types are generated
- `react-hooks/exhaustive-deps` — many async fetch callbacks use useCallback; exhaustive deps create infinite loops
- `react-hooks/static-components` — some admin pages define helper components inside (AdminBlog, AdminTeam). Moved AdminTeam's Field outside; others are warnings only
- `react-refresh/only-export-components` — context files (AuthContext, ThemeContext, etc.) export both context and provider

## no-unused-vars pattern
Configured with `varsIgnorePattern: '^_'` so `_foo` suppresses unused-var errors for intentionally-unused destructured values.

## Ignored paths
- `dist/**` — build output
- `.local/**` — Replit agent skill files (would pollute error count)
- `supabase/**` — Deno edge functions use different runtime; skip linting

**Why:** These decisions were made during a lint cleanup pass that reduced errors from 268 to 0 (with 73 remaining as warnings).
