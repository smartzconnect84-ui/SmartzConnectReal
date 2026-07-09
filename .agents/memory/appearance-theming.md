---
name: Live appearance theming system
description: ThemeContext extended with fontScale, fontStyle, accentColor, borderRadius, themePreset — all apply immediately via CSS vars and html element manipulation.
---

# Live Appearance Theming

**Rule:** ThemeContext now manages two layers: dark/light mode (css class on `html`) AND full appearance settings (CSS custom properties + inline styles on `document.documentElement`).

**Why:** Tailwind utility classes are compiled static values. The only way to override them at runtime without rebuilding is CSS custom properties + `!important` overrides in index.css.

**How to apply:**
- `applyAppearance()` in ThemeContext sets:
  - `html.style.fontSize` → font scale (85% / 93% / 106% / 118%)
  - `html.style.fontFamily` → font style (Inter / Georgia / Courier New)
  - `--color-brand-from`, `--color-brand-to` → gradient endpoints (consumed by `.bg-love-gradient` CSS override)
  - `--color-accent` → consumed by `.text-brand-pink`, `.bg-brand-pink`, `.border-brand-pink`, `.bg-love-soft` CSS overrides
  - `html.className` includes `radius-sharp` or `radius-pill` → consumed by `html.radius-*` CSS rules
- All overrides are in `src/index.css` with `!important` to beat Tailwind's specificity.
- Admin Settings → Appearance tab drives these via `setAppearance({ fontScale, fontStyle, themePreset, borderRadius, accentColor })`.
- Settings persist to localStorage under key `sc-appearance`; re-applied on every page load.

**CSS class that must stay in index.css** (removing breaks theming):
- `.bg-love-gradient { background-image: linear-gradient(...var(--color-brand-from)...) !important; }`
- `.text-brand-pink { color: var(--color-accent, #EC4899) !important; }`
- `html.radius-sharp .rounded-xl, .rounded-2xl, ...`
- `html.radius-pill .rounded-xl, ...`
