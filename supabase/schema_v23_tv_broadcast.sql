-- ============================================================
--  Schema v23 — SmartzTV Broadcast Enhancements
--  SRT/WHIP multi-protocol support, stream health monitoring,
--  broadcast sessions, realtime, RLS hardening.
--  Safe to re-run (IF NOT EXISTS / OR REPLACE throughout).
-- ============================================================

-- ── 1. Extend tv_channels with broadcast metadata ─────────────────────────────
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS srt_url               TEXT;
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS whip_url              TEXT;
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS latency_mode          TEXT NOT NULL DEFAULT 'low'
  CHECK (latency_mode IN ('low','reduced','standard'));
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS reconnect_window      INT  NOT NULL DEFAULT 60;
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS health_data           JSONB;
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS last_broadcast_at     TIMESTAMPTZ;
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS total_broadcast_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE tv_channels ADD COLUMN IF NOT EXISTS is_admin_broadcast    BOOLEAN NOT NULL DEFAULT TRUE;

-- ── 2. Broadcast sessions log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tv_stream_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID        NOT NULL REFERENCES tv_channels(id) ON DELETE CASCADE,
  mux_stream_id   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  peak_viewers    INT         NOT NULL DEFAULT 0,
  total_minutes   INT         NOT NULL DEFAULT 0,
  encoder_info    JSONB,
  latency_mode    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tv_stream_sessions_channel
  ON tv_stream_sessions(channel_id, started_at DESC);

ALTER TABLE tv_stream_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_all_sessions"   ON tv_stream_sessions;
DROP POLICY IF EXISTS "public_read_sessions"  ON tv_stream_sessions;
CREATE POLICY "admins_all_sessions"  ON tv_stream_sessions FOR ALL   USING (is_admin_user());
CREATE POLICY "public_read_sessions" ON tv_stream_sessions FOR SELECT USING (TRUE);

-- ── 3. tv_videos: add tracking columns ───────────────────────────────────────
ALTER TABLE tv_videos ADD COLUMN IF NOT EXISTS channel_id        UUID REFERENCES tv_channels(id) ON DELETE SET NULL;
ALTER TABLE tv_videos ADD COLUMN IF NOT EXISTS duration_seconds  INT;
ALTER TABLE tv_videos ADD COLUMN IF NOT EXISTS mux_asset_id      TEXT;
ALTER TABLE tv_videos ADD COLUMN IF NOT EXISTS is_published      BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tv_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_videos"  ON tv_videos;
DROP POLICY IF EXISTS "admins_all_videos"   ON tv_videos;
CREATE POLICY "public_read_videos" ON tv_videos FOR SELECT USING (is_published = TRUE);
CREATE POLICY "admins_all_videos"  ON tv_videos FOR ALL   USING (is_admin_user());

-- ── 4. Fix tv_channels RLS — admins get full access incl. stream_key ─────────
DROP POLICY IF EXISTS "admins_all_channels"    ON tv_channels;
DROP POLICY IF EXISTS "anon_read_channels"     ON tv_channels;
DROP POLICY IF EXISTS "anon_read_channels_v2"  ON tv_channels;

-- Admins: unrestricted
CREATE POLICY "admins_all_channels" ON tv_channels
  FOR ALL USING (is_admin_user());

-- Public: active channels, no sensitive cols — enforced by query projection
-- (stream_key / rtmp_url columns are excluded in the public query)
CREATE POLICY "anon_read_channels" ON tv_channels
  FOR SELECT USING (is_active = TRUE);

-- ── 5. tv_schedules RLS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_schedules"  ON tv_schedules;
DROP POLICY IF EXISTS "admins_all_schedules"   ON tv_schedules;
CREATE POLICY "public_read_schedules" ON tv_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tv_channels WHERE id = channel_id AND is_active = TRUE)
  );
CREATE POLICY "admins_all_schedules" ON tv_schedules
  FOR ALL USING (is_admin_user());

-- ── 6. Add tv_channels + sessions to realtime ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tv_channels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tv_channels;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tv_stream_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tv_stream_sessions;
  END IF;
END;
$$;

-- ── 7. RPC: record_broadcast_session ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_broadcast_session(
  p_channel_id   UUID,
  p_started_at   TIMESTAMPTZ,
  p_peak_viewers INT DEFAULT 0
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO tv_stream_sessions(channel_id, started_at, peak_viewers)
  VALUES (p_channel_id, p_started_at, p_peak_viewers)
  RETURNING id INTO v_id;

  UPDATE tv_channels
  SET last_broadcast_at = p_started_at
  WHERE id = p_channel_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_broadcast_session FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION record_broadcast_session TO authenticated, service_role;

-- ── 8. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tv_channels_active_feat
  ON tv_channels (is_active, is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_tv_videos_channel
  ON tv_videos (channel_id, created_at DESC);
