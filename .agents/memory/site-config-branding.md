---
name: Site-config branding architecture
description: How admin-controlled logo/background images flow from site_config into the public app.
---

`SiteConfigContext` (`src/contexts/SiteConfigContext.tsx`, provider mounted in `App.tsx` above `AnnouncementProvider`) reads the `site_config` table (key/value, `type` column) and exposes `useSiteConfig().get(key, fallback)`. `SITE_IMAGE_KEYS` holds the well-known keys (logo, per-page backgrounds).

Admin → CMS → Site Settings (`SettingsTab` in `AdminCMS.tsx`) renders `ImageUploader` instead of a text input when a `site_config` row has `type === 'image'`, and auto-seeds the branding/background keys (empty value) on first load so they always appear in the panel without a manual migration step. A matching SQL file (`schema_v16_branding.sql`) exists for repo history but isn't required for the app to work.

Consumers (Navbar, Footer logo; TeamPage and the 7 service pages' hero backgrounds) call `siteConfig.get(key)` and only render the image/override styling when a value is set — empty means the original hardcoded gradient/asset is used, so this is purely additive and safe to ship with no admin configuration yet.

**Why:** avoids inventing a new upload mechanism — reuses the existing `ImageUploader`/`uploadToSufy` pattern already used by hero_slides/cms_pages/site_assets, and keeps every image field admin-editable without code changes going forward.
**How to apply:** to make any other hardcoded image/background admin-controllable, add a key to `SITE_IMAGE_KEYS`, add it to `BRANDING_DEFAULTS` in `AdminCMS.tsx`, and call `siteConfig.get(key, fallbackAsset)` at the render site.
