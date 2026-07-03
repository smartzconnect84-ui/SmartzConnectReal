# SmartzConnect

A React + Vite "super-app" featuring social feeds, real-time chat, a marketplace, video streaming (SmartzTV), and ride-sharing services.

## Stack

- **Frontend**: React 19 (TypeScript), Vite, Tailwind CSS, Framer Motion, Radix UI
- **Auth & Database**: Supabase (PostgreSQL)
- **Messaging**: Stream Chat (GetStream)
- **Video/Audio calls**: LiveKit
- **Push notifications**: OneSignal
- **Bot protection**: Cloudflare Turnstile

## Running the app

```bash
npm install
npm run dev
```

The app requires these environment variables (see `.env.example` for the full list):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_STREAM_API_KEY` | GetStream Chat API key |
| `VITE_LIVEKIT_WS_URL` | LiveKit WebSocket URL |
| `VITE_ONESIGNAL_APP_ID` | OneSignal App ID |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (optional) |

Server-side secrets (Supabase Edge Functions only — never commit these):
`STREAM_API_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `ONESIGNAL_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`

## Database

Initialize the database by running the SQL schema files in `supabase/` against your Supabase project. A good starting point is `supabase/schema_complete.sql` (full schema), then apply addenda in order: `schema_v4_addendum.sql`, `schema_v5_addendum.sql`. Additional policy/setup files: `rls_policies.sql`, `realtime_setup.sql`, `mobile_money_payments.sql`.

## Project structure

```
src/
  App.tsx          # Router and global context providers
  main.tsx         # React root
  lib/             # Supabase, Stream, LiveKit client setup
  pages/           # Route-level page components
  components/      # Shared UI components
  contexts/        # React context providers
supabase/
  functions/       # Edge Functions
  *.sql            # Database schema (v1–v4)
```

## Deploying to Vercel

The project ships with a `vercel.json` that configures:
- SPA fallback routing (`/* → /index.html`) so `/app/*` and `/admin/*` routes load correctly
- Security headers (CSP, X-Frame-Options, etc.)
- Long-lived cache headers for assets

**Steps:**
1. Connect your GitHub repo to Vercel (or `vercel --prod` from the CLI).
2. Set the following **Environment Variables** in the Vercel dashboard (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `VITE_STREAM_API_KEY` | GetStream API key |
| `VITE_LIVEKIT_WS_URL` | LiveKit WebSocket URL |
| `VITE_ONESIGNAL_APP_ID` | OneSignal Web App ID |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (optional) |

3. Vercel auto-detects Vite. Build command: `npm run build`, output: `dist`.
4. After deploying, add the Vercel domain (`*.vercel.app` or your custom domain) in the **OneSignal dashboard → Settings → Site URL** so push subscriptions are accepted.

## OneSignal Push Notifications

- The service worker is at `public/OneSignalSDKWorker.js` (served at `https://yourdomain/OneSignalSDKWorker.js`).
- Set `VITE_ONESIGNAL_APP_ID` in Replit **and** in Vercel env vars.
- Set `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` as **Supabase Edge Function secrets** so the `send-push` function can trigger notifications server-side.
- OneSignal requires HTTPS — push works on Vercel by default; for local testing set `allowLocalhostAsSecureOrigin: true` (already set when `import.meta.env.DEV` is true).

## User preferences

- Leave existing project structure and stack intact unless explicitly asked to change it.
