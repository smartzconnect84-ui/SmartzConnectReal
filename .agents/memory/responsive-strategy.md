---
name: SmartzConnect responsive breakpoint strategy
description: Tailwind breakpoint conventions used across all landing and app components.
---

**Breakpoints:**
- `sm` (640px) — minor size tweaks: padding, font adjustments, icon/text combos
- `md` (768px) — tablet threshold: multi-column grids switch ON here, AppShell icon sidebar appears, bottom nav disappears
- `lg` (1024px) — desktop: full sidebar with labels, large grid layouts, right sidebars visible
- `xl` (1280px) — expanded sidebar width

**Grid conventions:**
- Feature/pricing/stat grids: `grid-cols-1 md:grid-cols-N` (NOT sm:, which is too narrow for multiple cols)
- Footer link columns: `grid-cols-2 md:grid-cols-4 lg:grid-cols-6`
- Trust stats: `grid-cols-2 md:grid-cols-4`

**Font sizing:**
- Section headers: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
- Hero headline: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl`
- Body text: `text-sm sm:text-base lg:text-lg`
- Labels/badges: `text-[10px] sm:text-xs`

**Why:** Using sm: for multi-column grids causes cramped layouts at 640-767px (landscape phones). md: is the correct tablet breakpoint.
