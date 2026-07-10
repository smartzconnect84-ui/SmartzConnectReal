-- ── Product Tour: persistent per-user completion flag ───────────────────────
-- Kept as dedicated columns (not nested inside profiles.preferences) because
-- SettingsPage overwrites the entire `preferences` JSON blob on "Save All" —
-- nesting tour state there would get silently wiped on the next settings save.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tour_completed boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tour_progress  jsonb;

-- ── Done ─────────────────────────────────────────────────────────────────────
-- Idempotent (ADD COLUMN IF NOT EXISTS). Safe to run multiple times.
