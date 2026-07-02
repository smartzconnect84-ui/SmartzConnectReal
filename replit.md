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

## User preferences

- Leave existing project structure and stack intact unless explicitly asked to change it.
