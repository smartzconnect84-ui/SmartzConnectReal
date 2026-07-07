# SmartzConnect

A real-time social communication platform with chat, video/audio calls, dating, marketplace, and more.

## Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Auth / DB**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Real-time chat**: GetStream (`stream-chat`)
- **Video / audio calls**: LiveKit (`livekit-client`, `@livekit/components-react`)
- **Push notifications**: OneSignal
- **Storage**: SUFY object storage (via `src/lib/sufy.ts`)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Package manager**: pnpm

## Running the App
```
pnpm install
pnpm run dev        # starts Vite dev server on port 5000
pnpm run build      # TypeScript compile + Vite production build
```

## Key Environment Variables
Set as Replit Secrets / env vars:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key
- `VITE_STREAM_API_KEY` — GetStream Chat API key
- `VITE_LIVEKIT_WS_URL` — LiveKit WebSocket URL (`wss://...`)
- `VITE_ONESIGNAL_APP_ID` — OneSignal App ID (optional; push only on prod domain)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

## Project Structure
```
src/
  pages/
    admin/          Admin panel pages (dashboard, users, settings, etc.)
    public/         Public marketing pages
    WorldChatPage.tsx     Global community chat for all users
    UserProfilePage.tsx   View another user's profile with DM/Video/Audio/Follow
    SettingsPage.tsx      Full user settings (notifications, theme, privacy, account)
    ProfilePage.tsx       Own profile page
    ChatPage.tsx          1-on-1 direct message chat (uses Stream)
    GroupChatPage.tsx     Group chat rooms
    CallsPage.tsx         Call history
  components/
    LiveKitCall.tsx       Video/audio call overlay
    IncomingCall.tsx      Incoming call notification
    AdminRoute.tsx        Route guard for admin panel
  contexts/
    AuthContext.tsx       Auth state + role management
    LiveKitCallContext.tsx Call signaling via Supabase Realtime
    StreamContext.tsx     GetStream connection lifecycle
  layouts/
    AppShell.tsx          Main app layout with drawer
    LeftSidebar.tsx       Desktop left navigation sidebar
  lib/
    supabase.ts           Supabase client
    stream.ts             Stream Chat client + helpers
    sufy.ts               SUFY file storage helpers
```

## Admin Accounts
- `ceo@smartzconnect.com` — superadmin (full access)
- `shedrickknungehn@gmail.com` — superadmin (full access)
Both have role `superadmin` in the `profiles` table and `ceo` in `admin_users`.

## Routes (App — protected under /app)
| Path | Page |
|------|------|
| `/app/feed` | Home feed |
| `/app/worldchat` | 🌍 World Chat (global) |
| `/app/chat/:userId` | Direct message |
| `/app/groups` | Group chat rooms |
| `/app/discover` | Dating / discover |
| `/app/calls/video` | Video calls |
| `/app/calls/audio` | Audio calls |
| `/app/profile` | Own profile |
| `/app/profile/:userId` | View another user's profile |
| `/app/settings` | Full settings page |
| `/app/friends` | Friends list |
| `/admin` | Admin panel (role-gated) |

## User Preferences
User preferences (notifications, privacy, appearance) are stored in the UI state in `src/pages/SettingsPage.tsx`. Persistence to the database is a planned follow-up task.

## Notes
- OneSignal push only fires on the production domain — no-ops in dev/preview
- SUFY storage folders: `avatars`, `covers`, `photos`, `stories`, `posts`, `voice-notes`, `documents`
- Admin roles recognized by AuthContext: `admin`, `superadmin`, `ceo`, `moderator`, `support`
