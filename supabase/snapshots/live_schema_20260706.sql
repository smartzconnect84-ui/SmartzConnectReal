CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_id uuid,
  activity_type text NOT NULL,
  entity_type text,
  entity_id text,
  meta jsonb,
  read boolean,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid NOT NULL,
  title text NOT NULL,
  advertiser_id text,
  type text,
  budget_usd numeric(10,2),
  spent_usd numeric(10,2),
  impressions integer,
  clicks integer,
  status text,
  placement text,
  image_url text,
  start_date date,
  end_date date,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id bigint NOT NULL,
  admin_id integer,
  admin_name text NOT NULL,
  admin_role text NOT NULL,
  target_user_id integer,
  target_user_name text,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_config (
  key text NOT NULL,
  value text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  staff_role staff_role NOT NULL,
  permission text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token text NOT NULL,
  admin_id integer NOT NULL,
  role text NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  expires_at timestamp without time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_staff (
  user_id uuid NOT NULL,
  staff_role staff_role NOT NULL,
  title text,
  department text,
  bio text,
  phone text,
  is_active boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL,
  role text NOT NULL,
  permissions jsonb,
  created_by uuid,
  created_at timestamp with time zone,
  email text,
  full_name text,
  auth_id uuid,
  status text,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.admins (
  id integer NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  is_active boolean NOT NULL,
  created_at timestamp without time zone,
  last_login_at timestamp without time zone,
  auth_id uuid,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid NOT NULL,
  advertiser_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  image_url text,
  target_url text,
  placement text,
  budget_usd numeric(10,2),
  spent_usd numeric(10,2),
  impressions integer,
  clicks integer,
  is_active boolean,
  is_approved boolean,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL,
  title text,
  message text NOT NULL,
  type text NOT NULL,
  is_active boolean NOT NULL,
  expires_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.anonymous_chats (
  id uuid NOT NULL,
  session_token text NOT NULL,
  user_id uuid,
  matched_with uuid,
  status text,
  created_at timestamp with time zone,
  user1_id uuid,
  user2_id uuid
);
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone,
  user_id uuid
);
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid NOT NULL,
  title text NOT NULL,
  slug text,
  excerpt text,
  content text,
  author_name text,
  author_role text,
  image_url text,
  category text,
  tags text[],
  status text,
  featured boolean,
  views_count integer,
  likes_count integer,
  read_time text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  published_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id bigint NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_audience text NOT NULL,
  sent_by_name text NOT NULL,
  recipient_count integer NOT NULL,
  sent_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.call_history (
  id uuid NOT NULL,
  room_name text NOT NULL,
  call_type text NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid,
  status text NOT NULL,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_secs integer,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.call_notifications (
  id uuid NOT NULL,
  from_id uuid NOT NULL,
  to_id uuid NOT NULL,
  room_name text NOT NULL,
  call_type text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone,
  expires_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.call_participants (
  id uuid NOT NULL,
  call_id uuid,
  user_id text NOT NULL,
  room_name text NOT NULL,
  display_name text,
  joined_at timestamp with time zone,
  left_at timestamp with time zone,
  livekit_identity text,
  livekit_sid text,
  is_muted boolean,
  camera_on boolean,
  is_screen_sharing boolean,
  connection_quality text
);
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id uuid NOT NULL,
  conversation_id uuid,
  initiator_id uuid NOT NULL,
  callee_id uuid,
  kind text NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  duration_seconds integer
);
CREATE TABLE IF NOT EXISTS public.calls (
  id uuid NOT NULL,
  room_name text NOT NULL,
  call_type text NOT NULL,
  status text NOT NULL,
  initiated_by uuid NOT NULL,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_secs integer,
  created_at timestamp with time zone,
  caller_id uuid,
  callee_id uuid
);
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  body_md text NOT NULL,
  cover_url text,
  is_published boolean NOT NULL,
  author_id uuid,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid NOT NULL,
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid,
  like_count integer,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL,
  last_read_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL,
  title text,
  is_group boolean NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.dating_matches (
  id uuid NOT NULL,
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.dating_profiles (
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  age integer,
  bio text,
  location text,
  interests text[],
  photos text[],
  is_active boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.dating_swipes (
  id uuid NOT NULL,
  swiper_id uuid NOT NULL,
  target_id uuid NOT NULL,
  direction text NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid NOT NULL,
  sender_id uuid NOT NULL,
  courier_id uuid,
  recipient_name text NOT NULL,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  package_description text,
  status text NOT NULL,
  fee_cents integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid NOT NULL,
  license_number text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_plate text,
  vehicle_color text,
  is_verified boolean,
  is_available boolean,
  rating numeric(3,2),
  total_rides integer,
  total_earnings numeric(10,2),
  current_lat double precision,
  current_lng double precision,
  created_at timestamp with time zone,
  user_id uuid,
  is_online boolean,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id integer NOT NULL,
  user_id integer NOT NULL,
  email text NOT NULL,
  otp text NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  verified boolean NOT NULL,
  created_at timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.feature_permissions (
  id integer NOT NULL,
  feature_key text NOT NULL,
  label text NOT NULL,
  description text,
  free_enabled boolean NOT NULL,
  premium_enabled boolean NOT NULL,
  vip_enabled boolean NOT NULL,
  updated_by text,
  updated_at timestamp with time zone,
  feature_name text
);
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  joined_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid NOT NULL,
  room_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  media_url text,
  type text NOT NULL,
  reply_to uuid,
  created_at timestamp with time zone NOT NULL,
  is_deleted boolean
);
CREATE TABLE IF NOT EXISTS public.group_rooms (
  id uuid NOT NULL,
  name text NOT NULL,
  topic text,
  emoji text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  creator_id uuid,
  cover_url text,
  members_count integer NOT NULL,
  messages_count integer NOT NULL,
  last_message text,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  is_public boolean,
  created_by uuid,
  description text,
  avatar_url text,
  member_count integer,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid NOT NULL,
  title text NOT NULL,
  subtitle text,
  emoji text,
  image_url text,
  cta_text text,
  cta_url text,
  badge_text text,
  gradient text,
  display_order integer,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL,
  user_id uuid,
  plan text NOT NULL,
  amount_usd numeric(10,2),
  currency text,
  payment_method text,
  transaction_id text,
  status text,
  issued_at timestamp with time zone,
  paid_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid NOT NULL,
  liker_id uuid NOT NULL,
  liked_id uuid NOT NULL,
  like_type text,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.livestream_channels (
  id integer NOT NULL,
  channel_id text NOT NULL,
  host_id integer,
  title text NOT NULL,
  thumbnail text,
  hls_url text,
  is_live boolean,
  viewer_count integer,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.livestream_gifts (
  id uuid NOT NULL,
  stream_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  gift_name text NOT NULL,
  gift_emoji text,
  amount_usd numeric(8,2) NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.livestreams (
  id uuid NOT NULL,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  tags text[],
  stream_key text NOT NULL,
  stream_url text,
  jitsi_room text,
  status text NOT NULL,
  viewer_count integer NOT NULL,
  peak_viewers integer NOT NULL,
  total_views integer NOT NULL,
  gifts_earned numeric(10,2) NOT NULL,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.market_orders (
  id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  total_cents integer NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.market_products (
  id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  price_cents integer NOT NULL,
  currency text NOT NULL,
  image_url text,
  stock integer NOT NULL,
  is_active boolean NOT NULL,
  rating numeric(3,2),
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id bigint NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  order_num integer NOT NULL,
  active boolean NOT NULL
);
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id uuid NOT NULL,
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  original_price numeric(12,2),
  currency text,
  category text,
  condition text,
  location text,
  country text,
  image_url text,
  images text[],
  emoji text,
  stock_qty integer,
  sold_count integer,
  views_count integer,
  is_active boolean,
  is_verified boolean,
  is_featured boolean,
  badge text,
  tags text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text
);
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid NOT NULL,
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL,
  price_lrd numeric(12,2),
  currency text NOT NULL,
  category text,
  condition text NOT NULL,
  images text[],
  location text,
  country text,
  status text NOT NULL,
  views_count integer NOT NULL,
  saves_count integer NOT NULL,
  is_featured boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid NOT NULL,
  listing_id uuid,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  payment_method text,
  transaction_id text,
  status text NOT NULL,
  delivery_address text,
  notes text,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id uuid NOT NULL,
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL,
  category text NOT NULL,
  images text[],
  condition text,
  location text,
  is_approved boolean,
  is_sold boolean,
  view_count integer,
  favorite_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid NOT NULL,
  user_a uuid,
  user_b uuid,
  status text,
  liked_by_a boolean,
  liked_by_b boolean,
  created_at timestamp with time zone,
  matched_at timestamp with time zone,
  is_active boolean,
  liked_by_1 boolean,
  liked_by_2 boolean,
  user1_id uuid,
  user2_id uuid
);
CREATE TABLE IF NOT EXISTS public.messages (
  id bigint NOT NULL,
  sender_id uuid,
  receiver_id uuid,
  content text,
  type text,
  read boolean,
  created_at timestamp with time zone,
  conversation_id uuid,
  body text,
  media_url text,
  kind text NOT NULL,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.mobile_money_payments (
  id uuid NOT NULL,
  user_id uuid,
  provider text NOT NULL,
  phone_number text,
  amount_usd numeric(10,2) NOT NULL,
  amount_local numeric(12,2),
  currency_local text,
  transaction_id text,
  plan_id text,
  status text,
  notes text,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid NOT NULL,
  push_messages boolean,
  push_matches boolean,
  push_orders boolean,
  push_rides boolean,
  push_system boolean,
  email_marketing boolean,
  email_updates boolean,
  onesignal_player_id text,
  updated_at timestamp with time zone,
  push_likes boolean,
  push_comments boolean,
  push_follows boolean,
  push_reposts boolean,
  push_mentions boolean,
  push_reactions boolean,
  push_calls boolean,
  push_livestreams boolean,
  push_marketplace boolean,
  in_app_enabled boolean,
  browser_push boolean,
  onesignal_external_id text
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  actor_id uuid,
  entity_id uuid,
  entity_type text,
  read boolean NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  subscription_id uuid,
  amount_usd numeric(10,2) NOT NULL,
  currency text,
  provider text,
  provider_tx_id text,
  status text,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id bigint NOT NULL,
  user_id integer,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.platform_files (
  id uuid NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_by text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  entity_type text,
  entity_id text,
  thumbnail_url text,
  duration_sec integer,
  width integer,
  height integer,
  is_public boolean,
  user_id uuid
);
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid NOT NULL,
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  parent_id uuid,
  content text NOT NULL,
  likes_count integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  user_id uuid,
  is_deleted boolean
);
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid NOT NULL,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid NOT NULL,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid NOT NULL,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  share_type text,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text,
  media_urls text[],
  media_type text,
  visibility text NOT NULL,
  type text NOT NULL,
  original_post_id uuid,
  location text,
  hashtags text[],
  mentions uuid[],
  likes_count integer NOT NULL,
  comments_count integer NOT NULL,
  saves_count integer NOT NULL,
  reposts_count integer NOT NULL,
  views_count integer NOT NULL,
  is_pinned boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  shares_count integer,
  video_url text,
  user_id uuid,
  is_deleted boolean
);
CREATE TABLE IF NOT EXISTS public.profile_boosts (
  id bigint NOT NULL,
  user_id integer NOT NULL,
  boosted_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  boost_type text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.profile_views (
  id bigint NOT NULL,
  viewer_id integer NOT NULL,
  profile_id integer NOT NULL,
  viewed_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text,
  full_name text,
  avatar_url text,
  cover_url text,
  bio text,
  location text,
  country text,
  age integer,
  gender text,
  occupation text,
  education text,
  relationship_goal text,
  languages text[],
  interests text[],
  height_cm integer,
  is_verified boolean,
  is_vip boolean,
  is_premium boolean,
  is_online boolean,
  last_seen timestamp with time zone,
  push_token text,
  language_pref text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_active boolean,
  email text,
  is_banned boolean,
  is_suspended boolean,
  email_verified boolean,
  city text,
  date_of_birth date,
  subscription_tier text,
  looking_for text,
  role text,
  website text,
  phone text,
  height text,
  livekit_room text,
  stream_token text,
  onesignal_player_id text
);
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id uuid NOT NULL,
  user_id uuid,
  title text NOT NULL,
  body text,
  data jsonb,
  sent boolean,
  read boolean,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id bigint NOT NULL,
  user_id integer,
  endpoint text NOT NULL,
  p256dh text,
  auth text,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  target_id uuid NOT NULL,
  target_type text NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.replit_users (
  id character varying NOT NULL,
  replit_id character varying,
  email character varying,
  first_name character varying,
  last_name character varying,
  profile_image_url character varying,
  linked_user_id integer,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  report_type text NOT NULL,
  reason text NOT NULL,
  description text,
  status text,
  reviewed_by uuid,
  created_at timestamp with time zone,
  resolved_at timestamp with time zone,
  admin_note text
);
CREATE TABLE IF NOT EXISTS public.ride_drivers (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  vehicle_type text NOT NULL,
  vehicle_make text,
  vehicle_model text,
  plate_number text,
  license_url text,
  is_verified boolean NOT NULL,
  is_active boolean NOT NULL,
  rating numeric(3,2) NOT NULL,
  total_trips integer NOT NULL,
  current_lat numeric(10,7),
  current_lng numeric(10,7),
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id uuid NOT NULL,
  rider_id uuid NOT NULL,
  driver_id uuid,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_lat numeric(10,7),
  pickup_lng numeric(10,7),
  dropoff_lat numeric(10,7),
  dropoff_lng numeric(10,7),
  distance_km numeric(8,2),
  fare_usd numeric(8,2),
  fare_lrd numeric(10,2),
  vehicle_type text NOT NULL,
  status text NOT NULL,
  payment_method text NOT NULL,
  rating_by_rider integer,
  rating_by_driver integer,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.rides (
  id uuid NOT NULL,
  rider_id uuid NOT NULL,
  driver_id uuid,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  status text NOT NULL,
  fare_cents integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.safety_rules (
  id bigint NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  icon text NOT NULL,
  order_num integer NOT NULL,
  active boolean NOT NULL
);
CREATE TABLE IF NOT EXISTS public.sessions (
  sid character varying NOT NULL,
  sess jsonb NOT NULL,
  expire timestamp without time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.site_assets (
  id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  storage_path text,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid,
  is_active boolean,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.site_config (
  key text NOT NULL,
  value text NOT NULL,
  type text NOT NULL,
  label text NOT NULL,
  group text NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.social_follows (
  follower_id uuid NOT NULL,
  followee_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  media_url text,
  visibility text NOT NULL,
  like_count integer NOT NULL,
  comment_count integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid NOT NULL,
  author_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL,
  caption text,
  duration_sec integer NOT NULL,
  views_count integer NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL,
  background text,
  user_id uuid
);
CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid NOT NULL,
  story_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.stream_comments (
  id bigint NOT NULL,
  stream_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_deleted boolean,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.stream_gifts (
  id uuid NOT NULL,
  stream_id uuid,
  sender_id uuid,
  gift_type text NOT NULL,
  gift_emoji text,
  coins_cost integer,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.stream_tokens (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  token text NOT NULL,
  issued_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone,
  room_id text,
  token_type text
);
CREATE TABLE IF NOT EXISTS public.streams (
  id uuid NOT NULL,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  thumbnail_url text,
  stream_url text,
  emoji text,
  is_live boolean,
  is_featured boolean,
  viewer_count integer,
  peak_viewers integer,
  like_count integer,
  gift_count integer,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text
);
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  price_lrd numeric(12,2),
  billing_cycle text NOT NULL,
  features text[],
  is_active boolean NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  price_month numeric,
  badge text
);
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id bigint NOT NULL,
  user_id integer NOT NULL,
  tier text NOT NULL,
  action text NOT NULL,
  duration_days integer NOT NULL,
  amount_usd numeric(10,2),
  payment_method text,
  notes text,
  processed_by integer,
  processed_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan_id uuid,
  plan_slug text NOT NULL,
  status text NOT NULL,
  billing_cycle text NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  payment_method text,
  transaction_id text,
  started_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.swipes (
  id uuid NOT NULL,
  swiper_id uuid NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL,
  source text NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  photo_url text,
  country text,
  bio text,
  skills text[],
  linkedin_url text,
  twitter_url text,
  joined_year text,
  is_advisor boolean,
  is_active boolean,
  display_order integer,
  organization text,
  created_at timestamp with time zone,
  whatsapp text,
  website text,
  emoji text
);
CREATE TABLE IF NOT EXISTS public.tv_channels (
  id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  thumbnail_url text,
  stream_url text,
  is_live boolean NOT NULL,
  subscriber_count integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.tv_videos (
  id uuid NOT NULL,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  category text,
  is_live boolean,
  view_count integer,
  like_count integer,
  duration_sec integer,
  is_featured boolean,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.tv_watch_history (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  watched_seconds integer NOT NULL,
  watched_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid NOT NULL,
  blocker_id uuid,
  blocked_user_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.user_gifts (
  id bigint NOT NULL,
  from_user_id integer NOT NULL,
  to_user_id integer NOT NULL,
  gift_id integer NOT NULL,
  message text,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_livestreams (
  id bigint NOT NULL,
  host_id integer NOT NULL,
  title text NOT NULL,
  room_id text NOT NULL,
  is_live boolean NOT NULL,
  viewer_count integer NOT NULL,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.user_notes (
  id bigint NOT NULL,
  user_id integer NOT NULL,
  admin_name text NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid NOT NULL,
  reporter_id uuid,
  reported_user_id uuid,
  reason text NOT NULL,
  details text,
  status text,
  admin_notes text,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_sessions (
  token text NOT NULL,
  user_id integer NOT NULL,
  created_at timestamp without time zone,
  expires_at timestamp without time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id bigint NOT NULL,
  user_id integer NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone,
  payment_ref text,
  notes text,
  created_by text,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone,
  is_active boolean NOT NULL
);
CREATE TABLE IF NOT EXISTS public.users (
  id integer NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  gender gender NOT NULL,
  country text NOT NULL,
  bio text,
  interests text[],
  photos text[],
  is_online boolean,
  is_banned boolean,
  suspended_until timestamp without time zone,
  suspension_reason text,
  role text,
  last_seen timestamp without time zone,
  created_at timestamp without time zone,
  height integer,
  looking_for text,
  relationship_status text,
  religion text,
  education text,
  occupation text,
  drinking text,
  smoking text,
  languages text[],
  zodiac text,
  children text,
  ethnicity text,
  email_verified boolean NOT NULL,
  phone_number text,
  phone_verified boolean NOT NULL,
  is_verified boolean NOT NULL,
  verification_badge text,
  referral_code text,
  referred_by integer,
  blocked_users integer[],
  auth_id uuid,
  subscription_tier text,
  subscription_expires_at timestamp with time zone,
  liked_users integer[],
  passed_users integer[],
  coins_balance integer NOT NULL,
  last_seen_at timestamp with time zone,
  phone text,
  full_name text,
  ban_reason text,
  last_login timestamp with time zone,
  is_active boolean,
  auth_id_ref uuid
);
CREATE TABLE IF NOT EXISTS public.video_calls (
  id uuid NOT NULL,
  caller_id uuid,
  callee_id uuid,
  jitsi_room text NOT NULL,
  call_type text,
  status text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_sec integer,
  created_at timestamp with time zone,
  livekit_room text,
  livekit_token text,
  room_type text,
  participants jsonb,
  recording_url text
);
CREATE TABLE IF NOT EXISTS public.virtual_gifts (
  id bigint NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL,
  description text,
  price_coins integer NOT NULL,
  active boolean NOT NULL,
  order_num integer NOT NULL
);
CREATE TABLE IF NOT EXISTS public.voicemails (
  id integer NOT NULL,
  match_id integer NOT NULL,
  sender_id integer NOT NULL,
  audio_data text NOT NULL,
  duration integer NOT NULL,
  is_listened boolean,
  sent_at timestamp without time zone
);
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid NOT NULL,
  user_id uuid,
  item_id uuid,
  created_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.world_chat_messages (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  attachment_url text,
  attachment_type text,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.worldstage_entries (
  id uuid NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  entry_url text,
  description text,
  votes_count integer NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.worldstage_events (
  id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  prize text,
  prize_usd numeric(10,2) NOT NULL,
  date_range text,
  location text,
  emoji text NOT NULL,
  color text NOT NULL,
  status text NOT NULL,
  participants integer NOT NULL,
  max_participants integer,
  rules text,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);
CREATE TABLE IF NOT EXISTS public.worldstage_leaderboard (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  country text,
  category text,
  points integer NOT NULL,
  wins integer NOT NULL,
  avatar_emoji text NOT NULL,
  rank integer,
  updated_at timestamp with time zone NOT NULL,
  country_flag text,
  avatar_url text,
  event_count integer
);
CREATE TABLE IF NOT EXISTS public.worldstage_spotlights (
  id uuid NOT NULL,
  user_id uuid,
  display_name text NOT NULL,
  country text,
  category text,
  followers_label text,
  quote text,
  avatar_emoji text NOT NULL,
  wins integer NOT NULL,
  is_active boolean NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  country_flag text,
  avatar_url text
);
CREATE TABLE IF NOT EXISTS public.worldstage_votes (
  id uuid NOT NULL,
  entry_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL
);
