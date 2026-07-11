---
name: Vercel deployment
description: How to deploy to Vercel from this Replit workspace
---

## Project IDs
- Project ID: `prj_BMV7iv3LZK3UhhJZJZwPlTBDWyQX`
- Org/team: `team_v7c8RWznnO0mvyueL3r60dPH` (shedrick-k-nungehn-s-projects)
- Domain alias: `www.smartzconnect.com`
- `.vercel/project.json` is in place — do NOT delete it.

## Deploy command
The "Deploy to Vercel" workflow runs this (also runnable directly via shell):
```
VERCEL_TOKEN="<from secret VERCEL_TOKEN>" npx vercel --prod --yes --archive=tgz --token="<token>"
```
A prior `deploy-api.mjs` (raw Vercel REST API upload, bypassing the CLI) was
removed — it can't do a real build step, so it either uploads stale/unbuilt
output or Vercel's API rejects the payload shape (`additionalProperty
projectId`). The CLI archive approach is the only one that reliably works.

**Why `--archive=tgz`:** Without it, Vercel CLI errors with "files should NOT have more than 15000 items" (received ~23296). The tgz archive bundles the workspace into a single tarball.

**Why `pnpm`:** `vercel.json` must have `"buildCommand": "pnpm run build"` (not `npm run build`) and `"installCommand": "npm install -g pnpm && pnpm install"`. npm v10 causes "Exit handler never called" failures (see vercel-pnpm-fix.md).

## Environment variables
After deploy, all `VITE_*` env vars must be set in the Vercel dashboard (or via `vercel env add`). The Admin panel "Vercel Environment Variables" lists the 6 required keys.
