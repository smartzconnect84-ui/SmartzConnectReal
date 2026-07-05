import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Session storage (required for Replit Auth) ─────────────────────────────
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ─── Users (Replit Auth identity) ───────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ─── Profiles (app-specific user profile data) ──────────────────────────────
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  bio: text("bio"),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  age: integer("age"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  occupation: text("occupation"),
  education: text("education"),
  relationshipGoal: text("relationship_goal"),
  languages: text("languages").array(),
  interests: text("interests").array(),
  heightCm: integer("height_cm"),
  role: text("role").default("user"),
  isVerified: boolean("is_verified").default(false),
  isVip: boolean("is_vip").default(false),
  isPremium: boolean("is_premium").default(false),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  languagePref: text("language_pref").default("en"),
  subscriptionTier: text("subscription_tier").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Dating: likes / swipes / matches ────────────────────────────────────────
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  likerId: varchar("liker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  likedId: varchar("liked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isSuperLike: boolean("is_super_like").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("likes_liker_liked_idx").on(t.likerId, t.likedId)]);

export const swipes = pgTable("swipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  swiperId: varchar("swiper_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  swipedId: varchar("swiped_id").references(() => users.id, { onDelete: "cascade" }),
  swipedName: text("swiped_name"),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("swipes_swiper_swiped_idx").on(t.swiperId, t.swipedId)]);

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: varchar("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("accepted"),
  isActive: boolean("is_active").default(true),
  likedBy1: boolean("liked_by_1").default(false),
  likedBy2: boolean("liked_by_2").default(false),
  matchedAt: timestamp("matched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("matches_user1_user2_idx").on(t.user1Id, t.user2Id)]);

// ─── Social feed ─────────────────────────────────────────────────────────────
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  location: text("location"),
  type: text("type").default("text"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("post_likes_post_user_idx").on(t.postId, t.userId)]);

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postShares = pgTable("post_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shareType: text("share_type").default("external"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").default("image"),
  caption: text("caption"),
  views: integer("views").default(0),
  expiresAt: timestamp("expires_at").default(sql`(now() + interval '24 hours')`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyViews = pgTable("story_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  viewerId: varchar("viewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (t) => [uniqueIndex("story_views_story_viewer_idx").on(t.storyId, t.viewerId)]);

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("follows_follower_following_idx").on(t.followerId, t.followingId)]);

export const activityFeed = pgTable("activity_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
  activityType: text("activity_type").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  meta: jsonb("meta").default({}),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Messaging ───────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  type: text("type").default("text"),
  reaction: text("reaction"),
  read: boolean("read").default(false),
  delivered: boolean("delivered").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupRooms = pgTable("group_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  topic: text("topic"),
  emoji: text("emoji").default("\u{1F4AC}"),
  category: text("category").default("General"),
  type: text("type").default("public"),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "set null" }),
  coverUrl: text("cover_url"),
  membersCount: integer("members_count").default(1),
  messagesCount: integer("messages_count").default(0),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => groupRooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (t) => [uniqueIndex("group_members_room_user_idx").on(t.roomId, t.userId)]);

export const groupMessages = pgTable("group_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => groupRooms.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  type: text("type").default("text"),
  replyTo: varchar("reply_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
  entityId: varchar("entity_id"),
  entityType: text("entity_type"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  pushLikes: boolean("push_likes").default(true),
  pushComments: boolean("push_comments").default(true),
  pushFollows: boolean("push_follows").default(true),
  pushReposts: boolean("push_reposts").default(true),
  pushMentions: boolean("push_mentions").default(true),
  pushReactions: boolean("push_reactions").default(true),
  pushCalls: boolean("push_calls").default(true),
  pushLivestreams: boolean("push_livestreams").default(true),
  pushMarketplace: boolean("push_marketplace").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  browserPush: boolean("browser_push").default(true),
  onesignalExternalId: text("onesignal_external_id"),
  onesignalPlayerId: text("onesignal_player_id"),
});

// ─── Subscriptions / plans ───────────────────────────────────────────────────
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  priceUsd: text("price_usd").default("0"),
  billingCycle: text("billing_cycle").default("monthly"),
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  planSlug: text("plan_slug").default("free"),
  status: text("status").default("active"),
  billingCycle: text("billing_cycle").default("monthly"),
  amountUsd: text("amount_usd").default("0"),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Marketplace ─────────────────────────────────────────────────────────────
export const marketplaceItems = pgTable("marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  price: text("price"),
  category: text("category"),
  images: text("images").array(),
  status: text("status").default("active"),
  moderationStatus: text("moderation_status").default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Livestreams / video calls ───────────────────────────────────────────────
export const streams = pgTable("streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").default("live"),
  viewersCount: integer("viewers_count").default(0),
  moderationStatus: text("moderation_status").default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const videoCalls = pgTable("video_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerId: varchar("caller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("ringing"),
  livekitRoom: text("livekit_room"),
  roomType: text("room_type").default("call"),
  participants: jsonb("participants").default([]),
  recordingUrl: text("recording_url"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const callParticipants = pgTable("call_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callId: varchar("call_id").notNull().references(() => videoCalls.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  livekitIdentity: text("livekit_identity"),
  isMuted: boolean("is_muted").default(false),
  cameraOn: boolean("camera_on").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

export const streamTokens = pgTable("stream_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  token: text("token"),
  roomId: text("room_id"),
  tokenType: text("token_type").default("livestream"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Files ───────────────────────────────────────────────────────────────────
export const platformFiles = pgTable("platform_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  thumbnailUrl: text("thumbnail_url"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── WorldStage ──────────────────────────────────────────────────────────────
export const worldstageEvents = pgTable("worldstage_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(),
  prize: text("prize"),
  dateRange: text("date_range"),
  location: text("location"),
  participants: integer("participants").default(0),
  status: text("status").default("upcoming"),
  emoji: text("emoji").default("\u{1F30D}"),
  color: text("color").default("from-pink-500 to-purple-600"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const worldstageLeaderboard = pgTable("worldstage_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  country: text("country").notNull(),
  countryFlag: text("country_flag").default("\u{1F30D}"),
  category: text("category").notNull(),
  points: integer("points").default(0),
  avatarEmoji: text("avatar_emoji").default("\u{1F9D1}"),
  eventCount: integer("event_count").default(0),
  wins: integer("wins").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const worldstageSpotlights = pgTable("worldstage_spotlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  country: text("country").notNull(),
  countryFlag: text("country_flag").default("\u{1F30D}"),
  category: text("category").notNull(),
  followersLabel: text("followers_label").default("0 Followers"),
  quote: text("quote"),
  avatarEmoji: text("avatar_emoji").default("\u2B50"),
  wins: integer("wins").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Zod insert schemas (for basic validation) ───────────────────────────────
export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true, updatedAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, likesCount: true, commentsCount: true, sharesCount: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export type Profile = typeof profiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Message = typeof messages.$inferSelect;

export const genericTableSchema = z.record(z.any());
