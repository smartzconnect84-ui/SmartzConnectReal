-- ============================================================
-- SmartzConnect — Complete Supabase Database Schema
-- Version: 1.0.0 | Production Ready
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  cover_url       TEXT,
  bio             TEXT,
  gender          TEXT CHECK (gender IN ('male','female','non-binary','prefer_not_to_say')),
  date_of_birth   DATE,
  country         TEXT,
  city            TEXT,
  occupation      TEXT,
  education       TEXT,
  relationship_goal TEXT CHECK (relationship_goal IN ('friendship','casual','long_term','marriage','networking')),
  interests       TEXT[] DEFAULT '{}',
  languages       TEXT[] DEFAULT '{}',
  is_verified     BOOLEAN DEFAULT FALSE,
  is_online       BOOLEAN DEFAULT FALSE,
  last_seen       TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','premium','vip')),
  is_suspended    BOOLEAN DEFAULT FALSE,
  is_banned       BOOLEAN DEFAULT FALSE,
  latitude        FLOAT,
  longitude       FLOAT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. LIKES
-- ============================================================
CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liker_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  like_type   TEXT DEFAULT 'like' CHECK (like_type IN ('like','super_like')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- ============================================================
-- 3. MATCHES
-- ============================================================
CREATE TABLE matches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ============================================================
-- 4. MESSAGES (Private Chat)
-- ============================================================
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT,
  media_url   TEXT,
  media_type  TEXT CHECK (media_type IN ('image','video','audio','gif')),
  is_read     BOOLEAN DEFAULT FALSE,
  reaction    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. GROUP ROOMS
-- ============================================================
CREATE TABLE group_rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID NOT NULL REFERENCES group_rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ============================================================
-- 6. GROUP MESSAGES
-- ============================================================
CREATE TABLE group_messages (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id   UUID NOT NULL REFERENCES group_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content   TEXT,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. POSTS (Social Feed)
-- ============================================================
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT,
  media_urls  TEXT[] DEFAULT '{}',
  media_type  TEXT CHECK (media_type IN ('image','video','text')),
  visibility  TEXT DEFAULT 'public' CHECK (visibility IN ('public','friends','private')),
  like_count  INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  is_trending BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. COMMENTS
-- ============================================================
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. REACTIONS
-- ============================================================
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment','message','video')),
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('match','message','like','comment','reaction','system','marketplace','ride')),
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier            TEXT NOT NULL CHECK (tier IN ('free','premium','vip')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','paused')),
  price_usd       DECIMAL(10,2),
  stripe_sub_id   TEXT,
  paypal_sub_id   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  auto_renew      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount_usd      DECIMAL(10,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  provider        TEXT CHECK (provider IN ('stripe','paypal','mobile_money')),
  provider_tx_id  TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. MARKETPLACE PRODUCTS
-- ============================================================
CREATE TABLE marketplace_products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  price_usd     DECIMAL(10,2) NOT NULL,
  category      TEXT NOT NULL,
  images        TEXT[] DEFAULT '{}',
  condition     TEXT DEFAULT 'new' CHECK (condition IN ('new','used','refurbished')),
  location      TEXT,
  is_approved   BOOLEAN DEFAULT FALSE,
  is_sold       BOOLEAN DEFAULT FALSE,
  view_count    INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. RIDE REQUESTS
-- ============================================================
CREATE TABLE ride_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id       UUID REFERENCES profiles(id),
  pickup_address  TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  pickup_lat      FLOAT,
  pickup_lng      FLOAT,
  dropoff_lat     FLOAT,
  dropoff_lng     FLOAT,
  ride_type       TEXT DEFAULT 'standard' CHECK (ride_type IN ('standard','comfort','premium','moto')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  fare_usd        DECIMAL(10,2),
  distance_km     FLOAT,
  duration_min    INT,
  rider_rating    INT CHECK (rider_rating BETWEEN 1 AND 5),
  driver_rating   INT CHECK (driver_rating BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ============================================================
-- 15. DRIVERS
-- ============================================================
CREATE TABLE drivers (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number  TEXT,
  vehicle_make    TEXT,
  vehicle_model   TEXT,
  vehicle_year    INT,
  vehicle_plate   TEXT,
  vehicle_color   TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  is_available    BOOLEAN DEFAULT FALSE,
  rating          DECIMAL(3,2) DEFAULT 5.0,
  total_rides     INT DEFAULT 0,
  total_earnings  DECIMAL(10,2) DEFAULT 0,
  current_lat     FLOAT,
  current_lng     FLOAT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. TV VIDEOS (SmartzTV)
-- ============================================================
CREATE TABLE tv_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  thumbnail_url TEXT,
  category      TEXT,
  is_live       BOOLEAN DEFAULT FALSE,
  view_count    INT DEFAULT 0,
  like_count    INT DEFAULT 0,
  duration_sec  INT,
  is_featured   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. ADVERTISEMENTS
-- ============================================================
CREATE TABLE advertisements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  image_url   TEXT,
  target_url  TEXT,
  placement   TEXT CHECK (placement IN ('feed','discover','marketplace','smartztv')),
  budget_usd  DECIMAL(10,2),
  spent_usd   DECIMAL(10,2) DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks      INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. REPORTS
-- ============================================================
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id   UUID NOT NULL,
  report_type   TEXT NOT NULL CHECK (report_type IN ('user','post','message','product','video')),
  reason        TEXT NOT NULL,
  description   TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  reviewed_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

-- ============================================================
-- 19. ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('admin','super_admin','ceo','moderator')),
  permissions JSONB DEFAULT '{}',
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  details     JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 21. SETTINGS
-- ============================================================
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);
CREATE INDEX idx_likes_liker ON likes(liker_id);
CREATE INDEX idx_likes_liked ON likes(liked_id);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_trending ON posts(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_marketplace_seller ON marketplace_products(seller_id);
CREATE INDEX idx_marketplace_category ON marketplace_products(category);
CREATE INDEX idx_marketplace_approved ON marketplace_products(is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_ride_requests_rider ON ride_requests(rider_id);
CREATE INDEX idx_ride_requests_driver ON ride_requests(driver_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_tv_videos_creator ON tv_videos(creator_id);
CREATE INDEX idx_tv_videos_live ON tv_videos(is_live) WHERE is_live = TRUE;
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Full-text search
CREATE INDEX idx_profiles_search ON profiles USING gin(to_tsvector('english', full_name || ' ' || COALESCE(bio, '') || ' ' || COALESCE(username, '')));
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', COALESCE(content, '')));
CREATE INDEX idx_marketplace_search ON marketplace_products USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', 'user'), ' ', '_')) || '_' || SUBSTRING(NEW.id::TEXT, 1, 6)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create match when mutual like
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    INSERT INTO matches (user1_id, user2_id)
    VALUES (LEAST(NEW.liker_id, NEW.liked_id), GREATEST(NEW.liker_id, NEW.liked_id))
    ON CONFLICT DO NOTHING;

    -- Notify both users
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES
      (NEW.liker_id, 'match', 'New Match! 💕', 'You have a new match!', jsonb_build_object('match_user_id', NEW.liked_id)),
      (NEW.liked_id, 'match', 'New Match! 💕', 'You have a new match!', jsonb_build_object('match_user_id', NEW.liker_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

-- Update post counts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER marketplace_updated_at BEFORE UPDATE ON marketplace_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE ride_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
