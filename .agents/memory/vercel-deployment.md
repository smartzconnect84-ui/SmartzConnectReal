---
name: Vercel deployment
description: How to deploy to Vercel from this Replit workspace
---

## Project IDs
- Project ID: `prj_BMV7iv3LZK3UhhJZJZwPlTBDWyQX`
- Org/team: `team_v7c8RWznnO0mvyueL3r60dPH` (shedrick-k-nungehn-s-projects)
- Domain alias: `www.smartzconnect.com`
- `.vercel/project.json` is in place — do NOT delete it.

## Deploy method: Vercel REST API (git-source trigger)
The `npx vercel` CLI approach is permanently blocked — Replit's security policy
blocks `tar-6.x` / `tar-7.x` which is a transitive dependency of every version of
the vercel CLI (via @vercel/redwood → @vercel/nft → @mapbox/node-pre-gyp → tar).
`pnpm dlx vercel` hits the same block.

**Use the Vercel REST API instead:**
```js
// 1. GET project to find git link (repoId, org, repo)
fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
// 2. POST deployment with gitSource — Vercel builds on their servers from main branch
fetch(`https://api.vercel.com/v13/deployments?teamId=${teamId}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: p.name, project: projectId, target: 'production',
    gitSource: { type: 'github', ref: 'main', repoId: p.link.repoId, org: p.link.org, repo: p.link.repo }
  })
})
// 3. Poll GET /v13/deployments/{id}?teamId=... until status=READY/ERROR
```

The "Deploy to Vercel" workflow now uses this pattern as a `node -e "..."` inline script.

**Why git-source?** Vercel builds on their servers using pnpm run build — no CLI, no tar, no local build needed. Only works because the repo is pushed to GitHub first.

## Environment variables
After deploy, all `VITE_*` env vars must be set in the Vercel dashboard (or via `vercel env add`). The Admin panel "Vercel Environment Variables" lists the 6 required keys.
