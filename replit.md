# SmartzConnect

Africa's #1 social super-app — social feeds, real-time chat, marketplace, video streaming (SmartzTV), and ride-sharing services.

## Stack

- **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Framer Motion, Radix UI
- **Auth & Database**: Supabase (PostgreSQL + Row Level Security + Realtime)
- **Messaging**: Stream Chat (GetStream)
- **Video/Audio calls**: LiveKit
- **Push notifications**: OneSignal

## Running the app

```bash
npm install
npm run dev
```

The app runs on port 5000. Environment variables are pre-configured in Replit.

## Required environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key (safe for browser) |
| `VITE_STREAM_API_KEY` | GetStream Chat API key |
| `VITE_LIVEKIT_WS_URL` | LiveKit WebSocket URL (optional) |
| `VITE_ONESIGNAL_APP_ID` | OneSignal App ID (optional) |

Server-side secrets live in Supabase Edge Functions (not in this repo):
`STREAM_API_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `ONESIGNAL_REST_API_KEY`, `RESEND_API_KEY`

## Project structure

```
src/
  App.tsx          # Router and global context providers
  main.tsx         # React root
  lib/             # Supabase, Stream, LiveKit client setup
  pages/           # Route-level page components
    admin/         # Admin panel pages
    public/        # Public service landing pages
  components/      # Shared UI components
  contexts/        # React context providers (Auth, Stream, LiveKit, Theme)
  hooks/           # Custom React hooks
  layouts/         # Page layout wrappers
supabase/
  functions/       # Supabase Edge Functions (livekit-token, stream-token, send-push, send-email)
  *.sql            # Database schema files (run against Supabase dashboard)
```

## Database

The database lives in Supabase. To set up a fresh project, run the SQL schema files in order:
1. `supabase/schema_complete.sql` — full base schema
2. `supabase/schema_v4_addendum.sql` — WorldStage, swipes, subscriptions
3. `supabase/schema_v5_addendum.sql` — moderation columns
4. `supabase/schema_v6_addendum.sql` — activity feed, LiveKit columns
5. `supabase/schema_v7_production.sql` — final production gaps

## User preferences

- Leave existing project structure and stack intact unless explicitly asked to change it.
- Use Supabase for auth and database — do not replace with Replit Auth or Replit DB.
