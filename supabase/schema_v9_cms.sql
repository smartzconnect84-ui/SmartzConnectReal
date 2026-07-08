-- ─── v9: Site-wide Content Management System ────────────────────────────────
-- Enables full CRUD (add/edit/delete/upload/download) from the admin panel for:
--   • site_config   — arbitrary key/value site settings, grouped by category
--   • hero_slides   — homepage hero carousel slides
--   • cms_pages     — freeform public pages (About, Pricing overrides, etc.)
--   • site_assets   — uploaded media library (images/files), backed by SUFY
-- All four tables already exist in the live schema; this migration only adds
-- sane defaults and RLS so the admin panel can write and the public site can
-- read published content directly (no server round-trip needed for reads).

-- ── Defaults so the admin UI doesn't have to generate ids/timestamps itself ──
ALTER TABLE site_config   ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE hero_slides   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE hero_slides   ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE hero_slides   ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE hero_slides   ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE hero_slides   ALTER COLUMN display_order SET DEFAULT 0;
ALTER TABLE cms_pages     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE cms_pages     ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE cms_pages     ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE cms_pages     ALTER COLUMN is_published SET DEFAULT false;
ALTER TABLE site_assets   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE site_assets   ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE site_assets   ALTER COLUMN is_active SET DEFAULT true;

-- Keep cms_pages.updated_at fresh on every edit
CREATE OR REPLACE FUNCTION set_cms_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cms_pages_updated_at ON cms_pages;
CREATE TRIGGER trg_cms_pages_updated_at BEFORE UPDATE ON cms_pages
  FOR EACH ROW EXECUTE FUNCTION set_cms_updated_at();

DROP TRIGGER IF EXISTS trg_hero_slides_updated_at ON hero_slides;
CREATE TRIGGER trg_hero_slides_updated_at BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION set_cms_updated_at();

-- ── RLS: public can read published/active content; only admins can write ────
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin/staff account (mirrors admin_users table)?
CREATE OR REPLACE FUNCTION is_admin_user() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users au WHERE au.id = auth.uid()
    UNION
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'ceo', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "public read site_config" ON site_config;
CREATE POLICY "public read site_config" ON site_config FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin write site_config" ON site_config;
CREATE POLICY "admin write site_config" ON site_config FOR ALL TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "public read active hero_slides" ON hero_slides;
CREATE POLICY "public read active hero_slides" ON hero_slides FOR SELECT TO anon, authenticated USING (is_active IS TRUE);
DROP POLICY IF EXISTS "admin write hero_slides" ON hero_slides;
CREATE POLICY "admin write hero_slides" ON hero_slides FOR ALL TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "public read published cms_pages" ON cms_pages;
CREATE POLICY "public read published cms_pages" ON cms_pages FOR SELECT TO anon, authenticated USING (is_published IS TRUE);
DROP POLICY IF EXISTS "admin read all cms_pages" ON cms_pages;
CREATE POLICY "admin read all cms_pages" ON cms_pages FOR SELECT TO authenticated USING (is_admin_user());
DROP POLICY IF EXISTS "admin write cms_pages" ON cms_pages;
CREATE POLICY "admin write cms_pages" ON cms_pages FOR ALL TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "public read active site_assets" ON site_assets;
CREATE POLICY "public read active site_assets" ON site_assets FOR SELECT TO anon, authenticated USING (is_active IS TRUE);
DROP POLICY IF EXISTS "admin write site_assets" ON site_assets;
CREATE POLICY "admin write site_assets" ON site_assets FOR ALL TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages (slug);
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides (display_order);
CREATE INDEX IF NOT EXISTS idx_site_assets_type ON site_assets (type);
