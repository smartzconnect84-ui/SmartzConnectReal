---
name: Vercel pnpm fix
description: How to fix npm "Exit handler never called" crash on Vercel for this project
---

## Problem
npm v10 crashes on Vercel with "Exit handler never called!" regardless of Node.js version (20.x or 24.x) or install flags. Packages are NOT installed, causing `tsc: command not found` in the build step.

## Fix Applied
1. Switch from npm to pnpm: add `pnpm-lock.yaml` (run `pnpm install --no-frozen-lockfile`)
2. Add `"packageManager": "pnpm@10.34.4"` to package.json
3. Add `"pnpm": { "onlyBuiltDependencies": ["esbuild", "stream-chat"] }` to package.json
4. Update vercel.json installCommand: `"npm install -g pnpm && pnpm install"`
5. Add `enable-pre-post-scripts=true` to .npmrc

**Why:** Vercel's npm installation environment has a bug with this project's dependency tree. pnpm is immune to it.
