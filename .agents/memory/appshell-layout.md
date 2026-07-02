---
name: AppShell sidebar/nav layout
description: How the app shell switches between mobile bottom nav, tablet icon sidebar, and desktop full sidebar.
---

**Three-tier layout:**
1. Mobile (<md, <768px): top bar + bottom nav (5 tabs) + full-screen drawer
2. Tablet (md-lg, 768-1023px): icon-only sidebar `w-16` + no bottom nav
3. Desktop (lg+, 1024px+): full sidebar `w-60 xl:w-64` with labels

**Key classes:**
- Sidebar: `hidden md:flex` with `w-16 lg:w-60 xl:w-64`
- Labels in sidebar: `hidden lg:block`
- Section headers in sidebar: `hidden lg:block`
- Bottom nav: `md:hidden fixed bottom-0`
- Mobile top bar: `md:hidden`
- Page content bottom padding: `pb-16 md:pb-0`

**Icon-only sidebar (md) behaviour:**
- Nav items: `justify-center lg:justify-start`
- Badge dots: small absolute dot on icon at md, full pill at lg
- Logo: icon-only at md, full text at lg
- User info footer: `hidden lg:flex`

**Why:** Tablets at 768px+ have enough room for a compact sidebar (48px wide), eliminating the "two-layer" UX of bottom nav + drawer that mobile uses.
