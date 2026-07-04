---
name: Vercel deployment BLOCKED from Replit
description: All Vercel CLI deployments get permanently BLOCKED when run from Replit's cloud environment on a hobby plan.
---

# Vercel CLI Deployments BLOCKED from Replit

## The rule
`vercel --prod` always results in `readyState: BLOCKED` when run from Replit's shared cloud environment, on the hobby plan. No error code, no events, no resolution.

**Why:** Vercel's hobby plan queues deployments from non-GitHub/non-browser sources and appears to block them indefinitely when initiated from cloud IPs. Account-level blocks (`softBlock`, `blocked`) are both null — it is not a billing issue. The build succeeds locally (`npm run build` ✓). SSO protection disabled, node version set to 20.x, legacy-peer-deps=true in .npmrc — none of these resolve BLOCKED.

## How to apply
When the user wants to deploy to Vercel:
1. **Recommended**: Connect the GitHub repo to Vercel via the dashboard (vercel.com → Import Git Repository), then push to `main` — Vercel's GitHub integration bypasses the CLI BLOCKED issue.
2. **Alternative**: Run `vercel --prod --yes` from a local machine (not a cloud environment).
3. The project is already linked at `prj_SgfcXAUIfkcosqdz3sy2YtDtyAXm` (team: `team_v7c8RWznnO0mvyueL3r60dPH`), `.vercel/project.json` is configured, all 6 VITE_* env vars are set on Vercel.
4. Do NOT waste turns retrying CLI deploy from Replit — it will always BLOCK.

## Current Vercel project state
- Project: `smartzconnect`, ID: `prj_SgfcXAUIfkcosqdz3sy2YtDtyAXm`
- Team: `shedrick-k-nungehn-s-projects`, ID: `team_v7c8RWznnO0mvyueL3r60dPH`
- Node version: 20.x, installCommand: `npm install`, buildCommand: `npm run build`, outputDirectory: `dist`
- All VITE_* env vars (SUPABASE_URL, SUPABASE_ANON_KEY, STREAM_API_KEY, STREAM_APP_ID, LIVEKIT_WS_URL, ONESIGNAL_APP_ID) confirmed set on Vercel
- SSO protection: null, passwordProtection: null
- .npmrc: legacy-peer-deps=true
