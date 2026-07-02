-- ============================================================
-- SmartzConnect — Schema Update v2
-- Run this after schema.sql
-- Adds: ad_campaigns, cookie_consent, users view
-- ============================================================

-- ─── AD CAMPAIGNS (used by AdminAds) ─────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  advertiser   TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'banner' CHECK (type IN ('banner','video','sponsored')),
  budget_usd   DECIMAL(10,2) DEFAULT 0,
  spent_usd    DECIMAL(10,2) DEFAULT 0,
  impressions  INT DEFAULT 0,
  clicks       INT DEFAULT 0,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('active','paused','pending','ended')),
  placement    TEXT,
  start_date   DATE,
  end_date     DATE,
  image_url    TEXT,
  target_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read for active ads, admin full access
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to ad_campaigns" ON ad_campaigns FOR ALL USING (true);

-- ─── USERS VIEW (convenience alias for profiles) ──────────────
-- The admin panel queries a 'users' table — map it to profiles
CREATE OR REPLACE VIEW users AS
  SELECT
    id,
    email,
    full_name,
    username,
    avatar_url,
    country,
    subscription_tier,
    is_verified AS is_active,
    is_suspended,
    is_banned,
    created_at
  FROM profiles;

-- ─── COOKIE CONSENT ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cookie_consent (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id      TEXT,
  analytics       BOOLEAN DEFAULT FALSE,
  marketing       BOOLEAN DEFAULT FALSE,
  functional      BOOLEAN DEFAULT TRUE,
  consented_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cookie_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consent" ON cookie_consent FOR ALL USING (
  auth.uid() = user_id OR user_id IS NULL
);

-- ─── STREAM CHAT TOKENS (cached) ─────────────────────────────
CREATE TABLE IF NOT EXISTS stream_tokens (
  user_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stream_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own stream token" ON stream_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert stream tokens" ON stream_tokens FOR ALL USING (true);

-- ─── NOTIFICATION PREFERENCES ────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_messages        BOOLEAN DEFAULT TRUE,
  push_matches         BOOLEAN DEFAULT TRUE,
  push_orders          BOOLEAN DEFAULT TRUE,
  push_rides           BOOLEAN DEFAULT TRUE,
  push_system          BOOLEAN DEFAULT TRUE,
  email_marketing      BOOLEAN DEFAULT FALSE,
  email_updates        BOOLEAN DEFAULT TRUE,
  onesignal_player_id  TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ─── AUTO-CREATE NOTIFICATION PREFS ON SIGNUP ────────────────
CREATE OR REPLACE FUNCTION handle_new_user_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_prefs ON profiles;
CREATE TRIGGER on_profile_created_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_prefs();

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_user ON cookie_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- ─── REALTIME ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE ad_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_preferences;
