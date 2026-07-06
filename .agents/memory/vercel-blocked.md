---
name: Vercel deployment BLOCKED from Replit
description: All Vercel CLI deployments get permanently BLOCKED when run from Replit's cloud environment on a hobby plan. Working solution: use the Vercel REST API file-upload approach.
---

# Vercel CLI Deployments BLOCKED from Replit — Working Solution Found

## The rule
`vercel --prod` always results in `readyState: BLOCKED` when run from Replit's shared cloud environment, on the hobby plan. No error code, no events, no resolution.

**Why:** Vercel's hobby plan queues deployments from non-GitHub/non-browser sources and appears to block them indefinitely when initiated from cloud IPs.

## ✅ Working solution: REST API file-upload

1. Build locally: `npm run build` (inject VITE_* env vars inline)
2. Walk `dist/`, compute SHA1 of each file
3. POST each file to `https://api.vercel.com/v2/files?teamId=...` with `x-vercel-digest: <sha1>` header
4. POST deployment to `https://api.vercel.com/v13/deployments?teamId=...` with:
   - `builds: [{ src: "**", use: "@vercel/static" }]`  ← CRITICAL — skips install/build
   - `routes` for SPA fallback and long-cache assets
   - `target: "production"`
5. Poll `GET /v13/deployments/{id}` for `readyState: READY`

**Key lesson:** Must use `builds: [{ src: "**", use: "@vercel/static" }]` — omitting this causes Vercel to try `npm install` on the pre-built files (exit 254). Do NOT use `projectSettings.framework` for pre-built deploys.

## Current project state
- Project: `smartzconnect`, ID: `prj_SgfcXAUIfkcosqdz3sy2YtDtyAXm`
- Team: `shedrick-k-nungehn-s-projects`, ID: `team_v7c8RWznnO0mvyueL3r60dPH`
- Node version: 20.x, outputDirectory: `dist`
- All VITE_* env vars updated (new Supabase project: `rcsbfosnupyxaukwykjw`)
- GitHub link: NOT connected (no GitHub App installation found on account)
- Last successful deployment: `dpl_G9WVJy2xreRQmYF7M8gTS7Wqdx9h` (READY)
- Production alias: `smartzconnect-shedrick-k-nungehn-s-projects.vercel.app`

## Script location
The deploy script is at `/tmp/vercel-deploy.mjs` — recreate from the node script pattern above each session.

## Env var IDs on Vercel (for PATCH updates)
- VITE_SUPABASE_URL: `qbiS61HBhKxx6ZUt`
- VITE_SUPABASE_ANON_KEY: `A32H7ZM69xyIFrPB`
- VITE_STREAM_API_KEY: `yQ2NflA1IOoUT4sH`
- VITE_STREAM_APP_ID: `soZGehnt0h9hYZYj`
- VITE_LIVEKIT_WS_URL: `NCRkbKuR5M6lbhHI`
- VITE_ONESIGNAL_APP_ID: `AS4vecBadRePRPZz`
