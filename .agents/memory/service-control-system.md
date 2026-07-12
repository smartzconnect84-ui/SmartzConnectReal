---
name: Service control & public stats architecture
description: How the unified admin "Service Management" system gates public visibility, and how public marketing pages source live stats.
---

- `AdminServices.tsx` (services table CRUD) is the single control panel for service-level toggle/add/edit/image/delete + connector tagging (LiveKit, Mux, Stripe, Sufy, Supabase, GetStream, OneSignal, Turnstile). It is intentionally separate from `AdminSettings.tsx` (generic feature toggles/UI theming).
- Public gating of `services` rows happens via `useServices()` (filters `enabled=true`) consumed by `Navbar`/`Footer` — NOT by the marketing landing pages themselves (SmartzRide/Market/Delivery/Ads/Social/Dating), which are static routed pages, not DB-driven.
  **Why:** avoids confusing "hide a service" (nav visibility) with "the page doesn't exist" — the page always exists at its route, only the nav/footer link is gated.
- `invalidateServicesCache()` in `useServices.ts` must be called after any admin mutation (save/toggle/delete) or the public nav will serve a stale cached list until next full reload.
- Public marketing pages source live numbers via `usePublicStats()` (`src/hooks/usePublicStats.ts`), a singleton counting `users`/`drivers`/`marketplace_items`/`matches` — same `count:'exact',head:true` pattern as `AdminDashboard`. Extend this hook rather than writing ad-hoc counts per page.
- Never store private connector secrets (Stream/LiveKit/Mux secrets) in the `services` table — it's client-readable. Keep those in Supabase Edge Function secrets only.
