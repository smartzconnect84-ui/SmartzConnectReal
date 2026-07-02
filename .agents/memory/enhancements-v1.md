---
name: Enhancement pass v1
description: Summary of the major feature enhancement pass — what was built, key patterns used, and what's remaining.
---

## What was built

**Global 10% size reduction** — `html { font-size: 90% }` in `src/index.css` @layer base. All rem-based sizes shrink proportionally without touching class names.

**Hero mobile zoom** — Hero.tsx image gets `scale-110` on mobile, `sm:scale-100` on desktop. Applied directly to the `<img>` className.

**CEO static hardcode** — `CEO_STATIC` object in TeamPage.tsx is prepended to `leadership` array before rendering. Shows regardless of DB connection. Photo at `/ceo-shedrick.jpg`. DB members from team_members table append after.

**Flyers** — Copied to `/public/flyer-vip.png` and `/public/flyer-ordinary.png`. Added side-by-side grid at top of BlogPage and AdminAds.

**File upload** — ProfilePage.tsx uses Supabase storage bucket `user-uploads` (must be created). Avatar → `avatars/{userId}.ext`, photos → `photos/{userId}/{timestamp}.ext`. Falls back gracefully if bucket not set up.

**CurrencyConverter** — `src/components/CurrencyConverter.tsx`. Standalone, no external API — hardcoded rates updated daily. Embedded in SubscriptionsPage between "Why Upgrade?" and "Accepted Payments".

**ReportBlockModal** — `src/components/ReportBlockModal.tsx`. Writes to `user_reports` and `user_blocks` tables. Import and open with `open={true}` prop.

**Anonymous spin chat** — Toggle button in SpinChat header. When on, shows 🎭 avatar and "Anonymous User" name instead of match profile. State is local only.

**Admin sidebar reorder** — AdminLayout.tsx navItems reordered: Dashboard → Users → Analytics → Reports → Safety → Content → Subscriptions → Marketplace → SmartzTV → Rides → Broadcasts → Advertisements → Team → Settings → Audit → Page Tour.

**LiveChat dismiss to mobile top bar** — AppShell.tsx mobile top bar now shows chat icon (MessageCircle) when LiveChat is dismissed, with unread count badge.

## Supabase schema
`supabase/schema_v3.sql` — run in Supabase SQL editor. Creates: profiles, team_members, blog_posts, ad_campaigns, user_reports, user_blocks, invoices, video_calls, anonymous_chats, push_notifications. Also creates user-uploads storage bucket.

## What remains (not yet implemented)
- Invoice PDF generation
- Language translator (needs external API)
- Jitsi video/audio call integration
- Emoji picker / voice notes / attachment in chat
- AI-powered spin matching
- Push notification backend (OneSignal already in frontend)
