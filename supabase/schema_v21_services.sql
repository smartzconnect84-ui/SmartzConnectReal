-- ══════════════════════════════════════════════════════════════════════════
-- Schema v21: Services registry table
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS services (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  description text,
  icon        text,                        -- lucide icon name or emoji
  image_url   text,
  route       text,                        -- public page path e.g. /smartzride
  category    text,                        -- e.g. 'Commerce', 'Social', 'Entertainment'
  connector   text DEFAULT 'None',         -- e.g. 'LiveKit','Mux','Stripe','Sufy','Supabase','None'
  enabled     boolean DEFAULT true,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ── Updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_services_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public can SELECT enabled services
DROP POLICY IF EXISTS "services_public_select" ON services;
CREATE POLICY "services_public_select" ON services
  FOR SELECT USING (enabled = true);

-- Admins can SELECT all (including disabled)
DROP POLICY IF EXISTS "services_admin_select" ON services;
CREATE POLICY "services_admin_select" ON services
  FOR SELECT USING (is_admin());

-- Admin INSERT
DROP POLICY IF EXISTS "services_admin_insert" ON services;
CREATE POLICY "services_admin_insert" ON services
  FOR INSERT WITH CHECK (is_admin());

-- Admin UPDATE
DROP POLICY IF EXISTS "services_admin_update" ON services;
CREATE POLICY "services_admin_update" ON services
  FOR UPDATE USING (is_admin());

-- Admin DELETE
DROP POLICY IF EXISTS "services_admin_delete" ON services;
CREATE POLICY "services_admin_delete" ON services
  FOR DELETE USING (is_admin());

-- ── Seed data ─────────────────────────────────────────────────────────────
INSERT INTO services (slug, name, description, icon, route, category, connector, enabled, sort_order)
VALUES
  ('smartzdating',   'SmartzDating',   'Find meaningful relationships with AI-powered matching, verified profiles, and safe communication tools.',  '❤️',  '/smartzdating',   'Social',      'LiveKit',   true, 1),
  ('smartzsocial',   'SmartzSocial',   'Share life''s moments, go live, join communities, and stay close to the people who matter.',                 '👥',  '/app/feed',       'Social',      'LiveKit',   true, 2),
  ('smartzmarket',   'SmartzMarket',   'Africa''s social marketplace — list products and reach millions of buyers.',                                 '🛍',  '/smartzmarket',   'Commerce',    'Stripe',    true, 3),
  ('smartzride',     'SmartzRide',     'Safe, affordable ride-hailing with verified drivers and real-time tracking across African cities.',           '🚗',  '/smartzride',     'Commerce',    'Supabase',  true, 4),
  ('smartzdelivery', 'SmartzDelivery', 'Fast, reliable local delivery connecting vendors with customers across every neighbourhood.',                 '📦',  '/smartzdelivery', 'Commerce',    'Supabase',  true, 5),
  ('smartzads',      'SmartzAds',      'Run powerful ad campaigns targeted to Africa''s most engaged digital community.',                             '📢',  '/smartzads',      'Commerce',    'Supabase',  true, 6),
  ('smartztv',       'SmartzTV',       'Broadcast to millions, earn virtual gifts, and build your creator empire on SmartzTV.',                      '📺',  '/smartztv',       'Entertainment','Mux',      true, 7),
  ('spin-chat',      'Spin & Chat',    'Random video connections — meet new people with a single spin.',                                             '⚡',  '/app/spin',       'Social',      'LiveKit',   true, 8),
  ('world-stage',    'World Stage',    'Global community hub for performances, challenges, and live world connections.',                             '🌍',  '/world-stage',    'Entertainment','LiveKit',  true, 9)
ON CONFLICT (slug) DO NOTHING;
