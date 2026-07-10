-- ══════════════════════════════════════════════════════════════════════════
-- Schema v11b: RLS hardening & security fixes
-- ══════════════════════════════════════════════════════════════════════════

-- ── Helper: is_admin() — true if caller is in admin_users ─────────────────
-- NOTE: admin_users.id is a surrogate UUID PK; the auth UID lives in auth_id.
-- Also checks profiles.role as a fallback so admin roles set there also work.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','ceo','moderator','support')
  );
END;
$;

-- ── Admin policies for livestreams ────────────────────────────────────────
-- Admins can update ANY livestream (e.g. approve, moderate, edit)
DROP POLICY IF EXISTS "livestreams_admin_update" ON livestreams;
CREATE POLICY "livestreams_admin_update" ON livestreams
  FOR UPDATE USING (is_admin());

-- Admins can delete ANY livestream
DROP POLICY IF EXISTS "livestreams_admin_delete" ON livestreams;
CREATE POLICY "livestreams_admin_delete" ON livestreams
  FOR DELETE USING (is_admin());

-- Admins can insert livestreams (for admin-created streams)
DROP POLICY IF EXISTS "livestreams_admin_insert" ON livestreams;
CREATE POLICY "livestreams_admin_insert" ON livestreams
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() = creator_id);

-- Make sure there's a public read policy
DROP POLICY IF EXISTS "livestreams_public_select" ON livestreams;
CREATE POLICY "livestreams_public_select" ON livestreams
  FOR SELECT USING (true);

-- ── Stream owner can moderate comments on their streams ───────────────────
-- Drop existing update policy and replace with one that covers both cases:
-- 1. Comment author can update/soft-delete their own comment
-- 2. Stream owner (creator_id) can soft-delete any comment on their stream
DROP POLICY IF EXISTS "stream_comments_update" ON stream_comments;
CREATE POLICY "stream_comments_update" ON stream_comments
  FOR UPDATE USING (
    -- Author can update their own comment
    auth.uid() = user_id
    OR
    -- Stream owner can moderate comments on their stream
    EXISTS (
      SELECT 1 FROM livestreams
      WHERE livestreams.id::TEXT = stream_comments.stream_id
        AND livestreams.creator_id = auth.uid()
    )
    OR
    -- Admins can moderate any comment
    is_admin()
  );

-- ── Harden increment_gifts_earned ─────────────────────────────────────────
-- Add authorization (must be authenticated) + amount validation
CREATE OR REPLACE FUNCTION increment_gifts_earned(stream_row_id TEXT, amount INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Amount must be positive and within the catalog max (500 coins)
  IF amount <= 0 OR amount > 500 THEN
    RAISE EXCEPTION 'Invalid gift amount: must be between 1 and 500';
  END IF;
  -- Verify a recent gift row exists from this sender for this stream
  -- (prevents direct RPC calls from fabricating arbitrary amounts)
  IF NOT EXISTS (
    SELECT 1 FROM stream_gifts
    WHERE stream_id = stream_row_id
      AND sender_id = auth.uid()
      AND coins_cost = amount
      AND created_at > NOW() - INTERVAL '30 seconds'
  ) THEN
    RAISE EXCEPTION 'No matching gift record found — submit a gift first';
  END IF;

  UPDATE livestreams
    SET gifts_earned = COALESCE(gifts_earned, 0) + amount
    WHERE id::TEXT = stream_row_id;
END;
$$;

-- Restrict who can execute this function (only authenticated users via anon/service key)
REVOKE EXECUTE ON FUNCTION increment_gifts_earned(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_gifts_earned(TEXT, INTEGER) TO authenticated;

-- ── Restrict is_admin() similarly ────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, service_role;
