-- ============================================================
-- SmartzConnect — Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (NOT is_banned AND NOT is_suspended);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- LIKES
-- ============================================================
CREATE POLICY "Users can see their own likes"
  ON likes FOR SELECT USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create likes"
  ON likes FOR INSERT WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE USING (auth.uid() = liker_id);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE POLICY "Users can see their own matches"
  ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches"
  ON matches FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "Users can see messages in their matches"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = messages.match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- ============================================================
-- GROUP ROOMS
-- ============================================================
CREATE POLICY "Public rooms are viewable by all"
  ON group_rooms FOR SELECT USING (is_public = TRUE OR
    EXISTS (SELECT 1 FROM group_members WHERE room_id = group_rooms.id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create rooms"
  ON group_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room admins can update rooms"
  ON group_rooms FOR UPDATE USING (
    EXISTS (SELECT 1 FROM group_members WHERE room_id = id AND user_id = auth.uid() AND role IN ('admin','moderator'))
  );

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
CREATE POLICY "Members can see room members"
  ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.room_id = group_members.room_id AND gm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM group_rooms WHERE id = group_members.room_id AND is_public = TRUE)
  );

CREATE POLICY "Users can join public rooms"
  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON group_members FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- GROUP MESSAGES
-- ============================================================
CREATE POLICY "Members can see group messages"
  ON group_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE room_id = group_messages.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can send group messages"
  ON group_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM group_members WHERE room_id = group_messages.room_id AND user_id = auth.uid())
  );

-- ============================================================
-- POSTS
-- ============================================================
CREATE POLICY "Public posts are viewable by all"
  ON posts FOR SELECT USING (visibility = 'public' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE POLICY "Comments on public posts are viewable"
  ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE id = comments.post_id AND visibility = 'public')
    OR auth.uid() = author_id
  );

CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "Users can see own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "Users can see own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL USING (TRUE);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY "Users can see own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- MARKETPLACE PRODUCTS
-- ============================================================
CREATE POLICY "Approved products are viewable by all"
  ON marketplace_products FOR SELECT USING (is_approved = TRUE OR seller_id = auth.uid());

CREATE POLICY "Authenticated users can list products"
  ON marketplace_products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON marketplace_products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON marketplace_products FOR DELETE USING (auth.uid() = seller_id);

-- ============================================================
-- RIDE REQUESTS
-- ============================================================
CREATE POLICY "Riders can see own rides"
  ON ride_requests FOR SELECT USING (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE POLICY "Riders can create ride requests"
  ON ride_requests FOR INSERT WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Riders and drivers can update rides"
  ON ride_requests FOR UPDATE USING (auth.uid() = rider_id OR auth.uid() = driver_id);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE POLICY "Drivers are viewable by all"
  ON drivers FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Users can register as driver"
  ON drivers FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Drivers can update own profile"
  ON drivers FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- TV VIDEOS
-- ============================================================
CREATE POLICY "Videos are viewable by all"
  ON tv_videos FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can upload videos"
  ON tv_videos FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own videos"
  ON tv_videos FOR UPDATE USING (auth.uid() = creator_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE POLICY "Users can see own reports"
  ON reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- ADMIN USERS (Admin only)
-- ============================================================
CREATE POLICY "Admins can see admin users"
  ON admin_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ============================================================
-- AUDIT LOGS (Admin only)
-- ============================================================
CREATE POLICY "Admins can see audit logs"
  ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create audit logs"
  ON audit_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ============================================================
-- SETTINGS (Admin only)
-- ============================================================
CREATE POLICY "Settings are readable by admins"
  ON settings FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Settings are writable by super admins"
  ON settings FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('super_admin','ceo'))
  );
