-- ============================================================
-- PERFORMANCE INDEXES — schema_v22
-- Adds covering/composite indexes to every high-traffic table.
-- All statements use CREATE INDEX IF NOT EXISTS so this is
-- safe to run multiple times and on a live DB.
-- ============================================================

-- ── Posts (social feed — hottest table) ──────────────────────
CREATE INDEX IF NOT EXISTS posts_author_id_idx
  ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_author_created_idx
  ON public.posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_created_at_idx
  ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_is_deleted_idx
  ON public.posts (is_deleted) WHERE is_deleted IS NOT TRUE;
CREATE INDEX IF NOT EXISTS posts_visibility_created_idx
  ON public.posts (visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_id_idx
  ON public.posts (user_id) WHERE user_id IS NOT NULL;

-- ── Post engagement ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx
  ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx
  ON public.post_likes (user_id);
CREATE INDEX IF NOT EXISTS post_likes_user_post_idx
  ON public.post_likes (user_id, post_id);

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx
  ON public.post_comments (post_id);
CREATE INDEX IF NOT EXISTS post_comments_author_id_idx
  ON public.post_comments (author_id);
CREATE INDEX IF NOT EXISTS post_comments_post_created_idx
  ON public.post_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_comments_user_id_idx
  ON public.post_comments (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS post_saves_user_id_idx
  ON public.post_saves (user_id);
CREATE INDEX IF NOT EXISTS post_saves_post_user_idx
  ON public.post_saves (post_id, user_id);

CREATE INDEX IF NOT EXISTS post_shares_post_id_idx
  ON public.post_shares (post_id);
CREATE INDEX IF NOT EXISTS post_shares_user_id_idx
  ON public.post_shares (user_id);

CREATE INDEX IF NOT EXISTS comments_post_id_idx
  ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx
  ON public.comments (author_id);

-- ── Notifications (read on every page load) ──────────────────
CREATE INDEX IF NOT EXISTS notifications_user_id_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read)
  WHERE read = false;
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx
  ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx
  ON public.notifications (actor_id) WHERE actor_id IS NOT NULL;

-- ── Profiles ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_username_idx
  ON public.profiles (username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_is_online_idx
  ON public.profiles (is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS profiles_country_idx
  ON public.profiles (country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx
  ON public.profiles (subscription_tier) WHERE subscription_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_created_at_idx
  ON public.profiles (created_at DESC);

-- ── Follows / Social follows ─────────────────────────────────
CREATE INDEX IF NOT EXISTS follows_follower_id_idx
  ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx
  ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS follows_pair_idx
  ON public.follows (follower_id, following_id);

CREATE INDEX IF NOT EXISTS social_follows_follower_id_idx
  ON public.social_follows (follower_id);
CREATE INDEX IF NOT EXISTS social_follows_followee_id_idx
  ON public.social_follows (followee_id);

-- ── Matches / Swipes / Dating ────────────────────────────────
CREATE INDEX IF NOT EXISTS matches_user_a_idx
  ON public.matches (user_a) WHERE user_a IS NOT NULL;
CREATE INDEX IF NOT EXISTS matches_user_b_idx
  ON public.matches (user_b) WHERE user_b IS NOT NULL;
CREATE INDEX IF NOT EXISTS matches_user1_id_idx
  ON public.matches (user1_id) WHERE user1_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS matches_user2_id_idx
  ON public.matches (user2_id) WHERE user2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS matches_status_idx
  ON public.matches (status) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS swipes_swiper_id_idx
  ON public.swipes (swiper_id);
CREATE INDEX IF NOT EXISTS swipes_target_id_idx
  ON public.swipes (target_id);
CREATE INDEX IF NOT EXISTS swipes_pair_idx
  ON public.swipes (swiper_id, target_id);
CREATE INDEX IF NOT EXISTS swipes_created_at_idx
  ON public.swipes (created_at DESC);

CREATE INDEX IF NOT EXISTS dating_swipes_swiper_target_idx
  ON public.dating_swipes (swiper_id, target_id);
CREATE INDEX IF NOT EXISTS dating_swipes_target_id_idx
  ON public.dating_swipes (target_id);

CREATE INDEX IF NOT EXISTS dating_matches_user_a_idx
  ON public.dating_matches (user_a);
CREATE INDEX IF NOT EXISTS dating_matches_user_b_idx
  ON public.dating_matches (user_b);

-- ── Messages ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS messages_sender_id_idx
  ON public.messages (sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx
  ON public.messages (receiver_id) WHERE receiver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_read_idx
  ON public.messages (receiver_id, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS group_messages_room_created_idx
  ON public.group_messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS group_messages_sender_id_idx
  ON public.group_messages (sender_id);
CREATE INDEX IF NOT EXISTS group_messages_is_deleted_idx
  ON public.group_messages (room_id, is_deleted)
  WHERE is_deleted IS NOT TRUE;

CREATE INDEX IF NOT EXISTS conversation_members_user_id_idx
  ON public.conversation_members (user_id);
CREATE INDEX IF NOT EXISTS conversation_members_convo_idx
  ON public.conversation_members (conversation_id);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx
  ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS group_members_room_id_idx
  ON public.group_members (room_id);

-- ── Stories ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS stories_author_id_idx
  ON public.stories (author_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx
  ON public.stories (expires_at);
CREATE INDEX IF NOT EXISTS stories_author_expires_idx
  ON public.stories (author_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS stories_user_id_idx
  ON public.stories (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS story_views_story_id_idx
  ON public.story_views (story_id);
CREATE INDEX IF NOT EXISTS story_views_viewer_story_idx
  ON public.story_views (viewer_id, story_id);

-- ── Marketplace ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS marketplace_items_seller_id_idx
  ON public.marketplace_items (seller_id);
CREATE INDEX IF NOT EXISTS marketplace_items_category_idx
  ON public.marketplace_items (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS marketplace_items_active_created_idx
  ON public.marketplace_items (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_items_country_idx
  ON public.marketplace_items (country) WHERE country IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketplace_listings_seller_id_idx
  ON public.marketplace_listings (seller_id);
CREATE INDEX IF NOT EXISTS marketplace_listings_cat_status_idx
  ON public.marketplace_listings (category, status);
CREATE INDEX IF NOT EXISTS marketplace_listings_created_idx
  ON public.marketplace_listings (created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_orders_buyer_id_idx
  ON public.marketplace_orders (buyer_id);
CREATE INDEX IF NOT EXISTS marketplace_orders_seller_id_idx
  ON public.marketplace_orders (seller_id);
CREATE INDEX IF NOT EXISTS marketplace_orders_status_idx
  ON public.marketplace_orders (status);

-- ── Subscriptions ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx
  ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx
  ON public.subscriptions (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS subscriptions_status_idx
  ON public.subscriptions (status);

-- ── Livestreams ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS livestreams_creator_id_idx
  ON public.livestreams (creator_id);
CREATE INDEX IF NOT EXISTS livestreams_status_created_idx
  ON public.livestreams (status, created_at DESC);
CREATE INDEX IF NOT EXISTS livestreams_status_idx
  ON public.livestreams (status);

CREATE INDEX IF NOT EXISTS stream_comments_stream_created_idx
  ON public.stream_comments (stream_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stream_comments_user_id_idx
  ON public.stream_comments (user_id);

CREATE INDEX IF NOT EXISTS streams_creator_id_idx
  ON public.streams (creator_id);
CREATE INDEX IF NOT EXISTS streams_is_live_idx
  ON public.streams (is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS streams_created_at_idx
  ON public.streams (created_at DESC);

-- ── Calls ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS call_notifications_to_id_idx
  ON public.call_notifications (to_id, created_at DESC);
CREATE INDEX IF NOT EXISTS call_notifications_from_id_idx
  ON public.call_notifications (from_id);
CREATE INDEX IF NOT EXISTS call_notifications_status_idx
  ON public.call_notifications (status);

CREATE INDEX IF NOT EXISTS call_history_caller_id_idx
  ON public.call_history (caller_id);
CREATE INDEX IF NOT EXISTS call_history_callee_id_idx
  ON public.call_history (callee_id) WHERE callee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS call_history_created_at_idx
  ON public.call_history (created_at DESC);

-- ── Rides ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ride_requests_rider_id_idx
  ON public.ride_requests (rider_id);
CREATE INDEX IF NOT EXISTS ride_requests_driver_id_idx
  ON public.ride_requests (driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ride_requests_status_idx
  ON public.ride_requests (status);
CREATE INDEX IF NOT EXISTS ride_requests_created_at_idx
  ON public.ride_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS rides_rider_id_idx
  ON public.rides (rider_id);
CREATE INDEX IF NOT EXISTS rides_driver_id_idx
  ON public.rides (driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS rides_status_idx
  ON public.rides (status);

-- ── Activity feed / audit ────────────────────────────────────
CREATE INDEX IF NOT EXISTS activity_feed_user_created_idx
  ON public.activity_feed (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feed_user_read_idx
  ON public.activity_feed (user_id, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS audit_logs_admin_created_idx
  ON public.audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_target_idx
  ON public.audit_logs (target_type, target_id) WHERE target_id IS NOT NULL;

-- ── Reports ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx
  ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_id_idx
  ON public.reports (reported_id);
CREATE INDEX IF NOT EXISTS reports_status_idx
  ON public.reports (status) WHERE status IS NOT NULL;

-- ── Push / Payments / Reactions ──────────────────────────────
CREATE INDEX IF NOT EXISTS push_notifications_user_read_idx
  ON public.push_notifications (user_id, read)
  WHERE read = false;
CREATE INDEX IF NOT EXISTS push_notifications_user_created_idx
  ON public.push_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payments_user_id_idx
  ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx
  ON public.payments (status) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS reactions_target_idx
  ON public.reactions (target_id, target_type);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx
  ON public.reactions (user_id);

CREATE INDEX IF NOT EXISTS likes_liker_id_idx
  ON public.likes (liker_id);
CREATE INDEX IF NOT EXISTS likes_liked_id_idx
  ON public.likes (liked_id);
CREATE INDEX IF NOT EXISTS likes_pair_idx
  ON public.likes (liker_id, liked_id);

-- ── Anonymous chats ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS anonymous_chats_user1_id_idx
  ON public.anonymous_chats (user1_id) WHERE user1_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS anonymous_chats_user2_id_idx
  ON public.anonymous_chats (user2_id) WHERE user2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS anonymous_chats_status_idx
  ON public.anonymous_chats (status) WHERE status IS NOT NULL;

-- ── User blocks ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS user_blocks_blocker_id_idx
  ON public.user_blocks (blocker_id) WHERE blocker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_blocks_blocked_user_id_idx
  ON public.user_blocks (blocked_user_id) WHERE blocked_user_id IS NOT NULL;

-- ── TV channels / watch history ──────────────────────────────
CREATE INDEX IF NOT EXISTS tv_watch_history_user_id_idx
  ON public.tv_watch_history (user_id);
CREATE INDEX IF NOT EXISTS tv_watch_history_channel_id_idx
  ON public.tv_watch_history (channel_id);
CREATE INDEX IF NOT EXISTS tv_videos_creator_id_idx
  ON public.tv_videos (creator_id);
CREATE INDEX IF NOT EXISTS tv_videos_is_live_idx
  ON public.tv_videos (is_live) WHERE is_live = true;

-- ── Platform files ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS platform_files_user_id_idx
  ON public.platform_files (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_files_entity_idx
  ON public.platform_files (entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- ── Blog ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx
  ON public.blog_posts (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx
  ON public.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx
  ON public.blog_posts (category) WHERE category IS NOT NULL;

-- ── Mobile money / invoices ──────────────────────────────────
CREATE INDEX IF NOT EXISTS mobile_money_payments_user_id_idx
  ON public.mobile_money_payments (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS mobile_money_payments_status_idx
  ON public.mobile_money_payments (status) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_user_id_idx
  ON public.invoices (user_id) WHERE user_id IS NOT NULL;

-- ── Ads ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS advertisements_advertiser_id_idx
  ON public.advertisements (advertiser_id);
CREATE INDEX IF NOT EXISTS advertisements_active_idx
  ON public.advertisements (is_active, is_approved)
  WHERE is_active = true AND is_approved = true;

-- ── Notification preferences ─────────────────────────────────
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx
  ON public.notification_preferences (user_id);
