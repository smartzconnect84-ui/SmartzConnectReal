# SmartzConnect — Cloudflare Pages Deployment Guide

## Option A — Manual Deployment via Dashboard (one-time setup)

### Step 1: Connect your GitHub repo
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Choose **Connect to Git** → select your GitHub account → select the `smartzconnect` repo
3. Click **Begin setup**

### Step 2: Configure the build
| Setting | Value |
|---------|-------|
| Project name | `smartzconnect` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |

### Step 3: Set environment variables
Click **Environment variables** → **Add variable** for each:

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → your site key |
| `VITE_STREAM_API_KEY` | GetStream.io → Dashboard → App → API key |
| `VITE_ONESIGNAL_APP_ID` | OneSignal → Settings → Keys & IDs → App ID |
| `NODE_VERSION` | `20` |

> **Important:** Set variables for **both** Production and Preview environments.

### Step 4: Deploy
Click **Save and Deploy**. The first build takes ~2 minutes.

---

## Option B — Auto-deploy via GitHub Actions (every push to main)

Set these secrets in **GitHub → Settings → Secrets → Actions**:

| Secret | Where to get it |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → "Cloudflare Pages: Edit" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → right sidebar (Account ID) |
| `VITE_SUPABASE_URL` | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile dashboard |
| `VITE_STREAM_API_KEY` | GetStream dashboard |
| `VITE_ONESIGNAL_APP_ID` | OneSignal dashboard |

Every push to `main` will automatically build and deploy.

---

## Supabase Edge Functions

Deploy the 3 edge functions from your Supabase dashboard or CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link to your project (find YOUR_PROJECT_REF in Supabase → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all three functions
supabase functions deploy stream-token
supabase functions deploy send-email
supabase functions deploy send-push
```

Set these secrets in **Supabase → Project Settings → Edge Functions → Secrets**:

| Secret | Description |
|--------|-------------|
| `STREAM_API_SECRET` | GetStream secret key (not the public API key) |
| `RESEND_API_KEY` | Resend.com API key for transactional emails |
| `ONESIGNAL_APP_ID` | OneSignal App ID |
| `ONESIGNAL_REST_API_KEY` | OneSignal REST API key |

---

## Database Schema

Run SQL in **Supabase → SQL Editor**:

**Fresh install (new project):**
```
supabase/schema_complete.sql  — paste the entire file and click Run
```

**Already deployed (upgrade only):**
```
supabase/schema_v4_addendum.sql  — paste and run to add the missing tables
```

The addendum adds: `swipes`, `worldstage_events`, `worldstage_leaderboard`, `worldstage_spotlights`, and fixes the `stream_tokens` unique constraint.

---

## Common Cloudflare Pages Warnings and Fixes

| Warning | Fix |
|---------|-----|
| `Using an older Node.js version` | `.nvmrc` is set to `20` (committed). Also set `NODE_VERSION=20` as an env var in CF Pages settings |
| `Build failed: vite: not found` | Ensure `npm ci` runs before build — the workflow handles this automatically |
| `Turnstile widget not rendering` | `public/_headers` now includes `https://challenges.cloudflare.com` in `frame-src` and `connect-src` (fixed) |
| `Missing VITE_* variables` | Add all 5 `VITE_*` env vars in Cloudflare Pages → Settings → Environment variables |
| `SPA deep links return 404` | `public/_redirects` has `/* /index.html 200` (already set) |
| `Chunk size warning` | `vite.config.ts` has `chunkSizeWarningLimit: 1500` and manual chunk splitting (already configured) |

---

## Production Checklist

- [ ] All 5 `VITE_*` env vars set in Cloudflare Pages settings
- [ ] `NODE_VERSION=20` set in CF Pages env vars (or `.nvmrc` present — already committed)
- [ ] Supabase SQL schema applied (`schema_complete.sql` for fresh, `schema_v4_addendum.sql` for upgrade)
- [ ] Supabase edge functions deployed (`stream-token`, `send-email`, `send-push`)
- [ ] Edge function secrets set in Supabase dashboard
- [ ] Cloudflare Turnstile site key configured for your production domain
- [ ] OneSignal web push configured for your domain
- [ ] Custom domain connected in Cloudflare Pages → Custom domains
