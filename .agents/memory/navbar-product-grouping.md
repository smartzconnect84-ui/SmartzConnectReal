---
name: Navbar product grouping
description: How the Products mega-menu splits services into "Commerce & Growth" vs "Social & Love", and how DB category differs from nav grouping.
---

The Navbar's two Products dropdown columns are driven entirely by `COMMERCE_SLUGS` in `src/components/Navbar.tsx` — any slug in that list goes to "Commerce & Growth", everything else (except `world-stage`, which has its own standalone link) falls into "Social & Love". This applies both to the hardcoded `FALLBACK_PRODUCTS` and to the DB-driven path via `useServices()`.

**Why:** the `services` table's `category` column (Commerce/Social/Entertainment/Learning/Utility, used by AdminServices for admin-panel organization) is independent from nav bucketing — e.g. `smartztv`'s DB category is "Entertainment" but it is grouped into Commerce & Growth on the navbar because it's listed in `COMMERCE_SLUGS`. Don't assume DB category controls nav placement.

**How to apply:** to move a product between nav groups, edit `COMMERCE_SLUGS` (and mirror the change in `FALLBACK_PRODUCTS.business`/`.social` for the offline/empty-table fallback) — don't touch the `services.category` column for this purpose. New services also need an entry in `SERVICE_ICON_MAP` or they render with a generic gray icon.
