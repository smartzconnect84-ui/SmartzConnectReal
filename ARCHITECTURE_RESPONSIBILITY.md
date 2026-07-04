# SmartzConnect — Service Responsibility Architecture

Audit performed directly against the current codebase (no assumptions). File paths cited are real and were verified before this document was written.

## Phase 1 — Feature Inventory (as it exists today)

| # | Feature | Implementation files | Currently talks to |
|---|---|---|---|
| 1 | Auth (email/password, OAuth, verification, reset) | `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `VerifyEmailPage.tsx`, `AuthCallbackPage.tsx`, `src/contexts/AuthContext.tsx` | Supabase Auth, Cloudflare Turnstile (`src/components/TurnstileWidget.tsx`), Resend (`supabase/functions/send-email`) |
| 2 | Profile | `src/pages/ProfilePage.tsx` | Supabase (`profiles` table + `user-uploads` storage) |
| 3 | Feed: posts/likes/comments/shares | `src/pages/FeedPage.tsx` | Supabase (`posts`, `post_likes`, `post_comments`, `post_shares`, `user-uploads` storage) |
| 4 | Stories | `src/pages/FeedPage.tsx` (`StoriesBar`) | Supabase (`stories`, `user-uploads`) |
| 5 | Swipes / Matching | `src/pages/DiscoverPage.tsx`, `MatchesPage.tsx`, `SpinChatPage.tsx` | Supabase (`swipes`, `matches`) + Postgres Realtime |
| 6 | Direct + group messaging | `src/pages/ChatPage.tsx`, `GroupChatPage.tsx`, `src/lib/stream.ts`, `src/contexts/StreamContext.tsx` | Stream (GetStream Chat) for messages; Supabase only issues the Stream token (`supabase/functions/stream-token`) and supplies profile data |
| 7 | Voice / video calls | `src/components/LiveKitCall.tsx`, `src/contexts/LiveKitCallContext.tsx` | LiveKit for media; Supabase issues the LiveKit token (`supabase/functions/livekit-token`) |
| 8 | SmartzTV (live streaming) | `src/pages/SmartzTVPage.tsx` | Supabase (`livestreams` table) + LiveKit for broadcast |
| 9 | Marketplace | `src/pages/MarketplacePage.tsx` | Supabase (`marketplace_items`) |
| 10 | Ride-hailing | `src/pages/RidePage.tsx` | Supabase (`rides`, driver profiles) |
| 11 | WorldStage | `src/pages/public/WorldStagePage.tsx` | Supabase (`worldstage_events`, `worldstage_leaderboard`, `worldstage_spotlights`) |
| 12 | In-app + push notifications | `src/pages/NotificationsPage.tsx`, `src/lib/onesignal.ts` | Supabase (`notifications` table, Realtime `INSERT` listener) for in-app; OneSignal for push delivery; `supabase/functions/send-push` bridges the two |
| 13 | Payments / subscriptions / mobile money | `src/pages/SubscriptionsPage.tsx`, `src/components/MobileMoneyModal.tsx`, `src/lib/mobileMoney.ts` | Supabase (`subscriptions`, `mobile_money_payments`) — no payment gateway integration exists; MTN/Orange is a manual transaction-ID workflow |
| 14 | Admin panel (users, reports, ads, audit log, analytics) | `src/pages/admin/*` | Supabase directly (all tables) |
| 15 | Reports & moderation | `src/components/ReportBlockModal.tsx`, `src/pages/admin/AdminReports.tsx`, `AdminSafety.tsx` | Supabase (`user_reports`, `user_blocks`) |
| 16 | Search | Inline filtering in `DiscoverPage.tsx`, `MatchesPage.tsx`, `MarketplacePage.tsx` | Supabase `ilike` queries, mostly client-side filtering |
| 17 | Onboarding | `src/pages/OnboardingPage.tsx` | Supabase (`profiles`) |
| 18 | Scheduled DB backup | `supabase/functions/database-backup/index.ts`, `supabase/backup_cron_setup.sql` | Supabase Storage (`db-backups` bucket) + `pg_cron` |

**Not found in the codebase (confirmed by full-repo search):**
- No SUFY.com integration anywhere — all media (`user-uploads`, `db-backups` buckets) is currently stored in **Supabase Storage**.
- No standalone Event Queue exists — the only asynchronous job is the `pg_cron`-scheduled backup function.
- No standalone Session Service exists — token issuance (`stream-token`, `livekit-token`) is done ad hoc inside two separate Supabase Edge Functions, each duplicating JWT-signing logic.

## Phase 2 & 3 — Ownership Assignment and Duplication Removal

| Responsibility | Primary Owner | Supporting | Duplication found & resolution |
|---|---|---|---|
| Authentication, identities, sessions | **Supabase** | Session Service (see below) | Turnstile only gates the form (bot protection), not identity — no conflict. |
| Core relational data (profiles, matches, swipes, posts, marketplace, rides, worldstage, admin, reports, subscriptions) | **Supabase (Postgres + RLS)** | — | None — single owner today. |
| Business logic / triggers (auto-match on mutual like, counters) | **Supabase (Edge Functions / SQL triggers)** | Event Queue | None currently duplicated; recommend moving fire-and-forget side effects (push fan-out, backup) off the request path and into the Event Queue so Supabase stops doing background-job scheduling (`pg_cron`) — that responsibility belongs to the Event Queue, not the database. |
| Direct + group messaging engine | **Stream** | Supabase (issues auth token + stores profile metadata for chat UI) | **Duplication found:** message read/typing state could theoretically be mirrored into Supabase but is not — confirmed clean, no action needed. |
| Voice/video calls | **LiveKit** | Supabase (issues auth token) | Clean — no duplication. |
| Push notification delivery | **OneSignal** | Supabase (`send-push` function decides *who* qualifies via match/relationship checks) | **Duplication found:** the `send-push` function currently mixes authorization logic (business rule: "only matched users can push each other") with delivery (calling OneSignal's API). Recommendation: keep the authorization check in Supabase (it owns business logic), but the actual delivery call should be treated as OneSignal's exclusive responsibility — Supabase must never store or manage device player IDs itself (it currently does not; confirmed no such table exists). |
| Object/media storage (`user-uploads`, `db-backups`, `stream-thumbnails`, `voice-notes`, `documents`, `marketplace`) | **SUFY.com** (per required architecture) | Supabase (stores only the resulting URL + entity metadata) | **Duplication found:** Supabase Storage currently does what SUFY.com should own. This is the one real gap between the current build and the target architecture. Resolution: introduce SUFY.com as the object-storage/CDN layer; Supabase buckets are decommissioned and every table that stores a `media_url`/`avatar_url`/`cover_url`/`image_url` column keeps only the reference, not the binary. |
| Token generation for external services (Stream, LiveKit) | **Session Service** (new, thin) | Supabase (still validates the caller's identity before issuing) | **Duplication found:** `stream-token` and `livekit-token` are two separate Edge Functions that each hand-roll HMAC-SHA256 JWT signing. Resolution: consolidate into one Session Service responsibility with one shared signing utility and two thin per-provider adapters, so JWT construction exists in exactly one place. |
| Background/scheduled jobs (DB backup, future retry logic) | **Event Queue** | Supabase (source of the data being processed) | Resolution: move the daily backup off `pg_cron` (which runs *inside* the database and blurs "storage owner" with "job scheduler") and into the Event Queue as a scheduled job that reads from Supabase and writes to SUFY.com/object storage. |
| Frontend state, UI, presentation | **Frontend** | — | Confirmed: no secrets, API keys, or token-signing logic live in `src/` — `import.meta.env.VITE_*` only carries public URL/anon key, which is correct for a browser context. |

## Phase 4 — Missing Ownership Check

Every feature in the Phase 1 inventory maps to exactly one Primary Owner in Phase 2/3. No orphaned responsibility remains. The two gaps identified (object storage on Supabase instead of SUFY.com; ad hoc token signing instead of a Session Service) are documented above with an owner and a resolution — they are not left unassigned, they are reassigned.

## Phase 5 — Workflow Data-Flow Validation

| Workflow | Entry point | Data owner | Processing owner | Notification owner |
|---|---|---|---|---|
| Registration/Login/OAuth | `AuthContext.tsx` | Supabase | Supabase Auth | Resend (email), OneSignal (post-login push opt-in) |
| Profile update | `ProfilePage.tsx` | Supabase (`profiles`) | Supabase | — |
| Media upload (photo/video/voice/doc) | `CreateModal.tsx`, `ProfilePage.tsx` | SUFY.com (binary) / Supabase (reference row) | SUFY.com | — |
| Feed post + like/comment/share | `FeedPage.tsx` | Supabase | Supabase (triggers update counters) | OneSignal via `send-push`, in-app via `notifications` table |
| Stories | `FeedPage.tsx` | Supabase (metadata) / SUFY.com (media) | Supabase | — |
| Swipe → Match | `DiscoverPage.tsx` | Supabase (`swipes`, `matches`) | Supabase (`auto_create_match` trigger) | OneSignal + in-app `notifications` |
| Direct/Group chat | `ChatPage.tsx`/`GroupChatPage.tsx` | Stream (messages) / Supabase (profile refs) | Stream | OneSignal (new-message push) |
| Voice/video call | `LiveKitCall.tsx` | LiveKit (room state, ephemeral) | LiveKit | OneSignal (missed-call push) |
| Marketplace listing/order | `MarketplacePage.tsx` | Supabase | Supabase | OneSignal (order updates) |
| Ride request | `RidePage.tsx` | Supabase | Supabase | OneSignal |
| Search | `DiscoverPage.tsx`/`MarketplacePage.tsx` | Supabase | Supabase (query layer) | — |
| Report/Block/Moderation | `ReportBlockModal.tsx` → `AdminReports.tsx` | Supabase | Supabase (admin review) | OneSignal (moderation outcome, optional) |
| Payments/mobile money | `MobileMoneyModal.tsx` | Supabase | Supabase (manual verification by admin) | OneSignal (payment confirmed) |
| Admin actions/audit log | `src/pages/admin/*` | Supabase | Supabase | — |
| Scheduled backup | `database-backup` function | Supabase (source) / SUFY.com (destination) | Event Queue (scheduler) | — |

Every workflow above has exactly one entry point, one data owner, one processing owner, and (where applicable) one notification owner — no step is duplicated across services.

## Final Validation

- ✓ Every feature discovered in Phase 1 is assigned in Phase 2/3.
- ✓ Every workflow in Phase 5 has one entry point, one data owner, one processing owner, one notification owner.
- ✓ Every current API (Edge Functions: `send-email`, `send-push`, `stream-token`, `livekit-token`, `database-backup`) has a named owner.
- ✓ Every database table maps to Supabase as sole owner of relational data.
- ✓ Every upload has a single owner: SUFY.com (binary) + Supabase (reference row) — not both storing the binary.
- ✓ Every notification has a single delivery owner: OneSignal for push, Supabase for in-app rows.
- ✓ The one background task (backup) is reassigned from `pg_cron`-in-Supabase to the Event Queue.
- ✓ Token generation is consolidated under one Session Service concept instead of two duplicated Edge Functions.
- ✓ Frontend confirmed to hold zero secrets, zero token-signing logic, zero direct business-data writes bypassing Supabase.
- ✓ No feature found with two Primary Owners.
- ✓ No orphaned responsibility remains.

## Two concrete gaps vs. the target architecture (only real drift found)

1. **Storage:** Media binaries currently live in Supabase Storage buckets (`user-uploads`, `db-backups`, and the buckets declared in `schema_v6_addendum.sql`). Per the target architecture, this should move to SUFY.com, with Supabase retaining only URL/metadata columns. Not migrated in this pass — no SUFY.com credentials or SDK exist in the project yet.
2. **Session Service:** Token signing for Stream and LiveKit is implemented twice (once per provider) inside Supabase Edge Functions instead of a single shared service. Functionally correct today, but violates single-responsibility/no-duplication requirement.

I did not change any code or infrastructure in this pass — this document is the factual audit and ownership assignment you asked for. Say the word if you want me to actually execute gap #1 (SUFY.com storage) and/or gap #2 (consolidated Session Service) next.
