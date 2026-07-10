-- ══════════════════════════════════════════════════════════════════════════
-- Schema v18: SmartzTV Go-Live bug fixes
-- Safe to re-run (all changes use OR REPLACE / IF NOT EXISTS / IF EXISTS)
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Add is_admin_broadcast column to livestreams (if not already present) ─
ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS is_admin_broadcast BOOLEAN DEFAULT FALSE;

-- ── 2. Fix is_admin() — was checking admin_users.id instead of auth_id ────────
-- admin_users.id is a surrogate UUID PK; the Supabase auth UID lives in auth_id.
-- With the old query (WHERE id = auth.uid()), is_admin() always returned false,
-- blocking both livestreams_admin_insert and livestreams_admin_update RLS policies.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','ceo','moderator','support')
  );
END;
$$;

-- ── 3. Fix is_admin_user() — same wrong-column bug ────────────────────────────
CREATE OR REPLACE FUNCTION is_admin_user() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users au WHERE au.auth_id = auth.uid()
    UNION
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin','ceo','moderator','support')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 4. Re-create livestreams admin RLS policies with correct helper ────────────
DROP POLICY IF EXISTS "livestreams_admin_update" ON livestreams;
CREATE POLICY "livestreams_admin_update" ON livestreams
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "livestreams_admin_delete" ON livestreams;
CREATE POLICY "livestreams_admin_delete" ON livestreams
  FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "livestreams_admin_insert" ON livestreams;
CREATE POLICY "livestreams_admin_insert" ON livestreams
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() = creator_id);

-- Ensure public select policy exists
DROP POLICY IF EXISTS "livestreams_public_select" ON livestreams;
CREATE POLICY "livestreams_public_select" ON livestreams
  FOR SELECT USING (true);

-- ── 5. Re-grant helpers (may already be set, harmless to repeat) ──────────────
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated, service_role;
