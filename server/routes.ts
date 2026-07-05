import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

// Tables that may be queried/mutated through the generic data API, and the
// authorization rule applied to each (mirrors the previous Supabase RLS
// policies). "public" tables are readable by anyone; owner-scoped tables
// restrict reads/writes to rows the current user owns.
const TABLES: Record<string, { table: any; ownerColumn?: string; publicRead?: boolean }> = {
  profiles: { table: schema.profiles, ownerColumn: "id", publicRead: true },
  posts: { table: schema.posts, ownerColumn: "userId", publicRead: true },
  post_likes: { table: schema.postLikes, ownerColumn: "userId", publicRead: true },
  post_comments: { table: schema.postComments, ownerColumn: "userId", publicRead: true },
  post_shares: { table: schema.postShares, ownerColumn: "userId", publicRead: true },
  stories: { table: schema.stories, ownerColumn: "userId", publicRead: true },
  story_views: { table: schema.storyViews, ownerColumn: "viewerId" },
  follows: { table: schema.follows, ownerColumn: "followerId", publicRead: true },
  activity_feed: { table: schema.activityFeed, ownerColumn: "userId" },
  likes: { table: schema.likes, ownerColumn: "likerId" },
  swipes: { table: schema.swipes, ownerColumn: "swiperId" },
  matches: { table: schema.matches, ownerColumn: "user1Id" },
  messages: { table: schema.messages, ownerColumn: "senderId" },
  group_rooms: { table: schema.groupRooms, ownerColumn: "creatorId", publicRead: true },
  group_members: { table: schema.groupMembers, ownerColumn: "userId", publicRead: true },
  group_messages: { table: schema.groupMessages, ownerColumn: "senderId", publicRead: true },
  notifications: { table: schema.notifications, ownerColumn: "userId" },
  notification_preferences: { table: schema.notificationPreferences, ownerColumn: "userId" },
  subscription_plans: { table: schema.subscriptionPlans, publicRead: true },
  subscriptions: { table: schema.subscriptions, ownerColumn: "userId" },
  marketplace_items: { table: schema.marketplaceItems, ownerColumn: "sellerId", publicRead: true },
  streams: { table: schema.streams, ownerColumn: "hostId", publicRead: true },
  video_calls: { table: schema.videoCalls, ownerColumn: "callerId" },
  call_participants: { table: schema.callParticipants, ownerColumn: "userId" },
  stream_tokens: { table: schema.streamTokens, ownerColumn: "userId" },
  platform_files: { table: schema.platformFiles, ownerColumn: "userId", publicRead: true },
  worldstage_events: { table: schema.worldstageEvents, publicRead: true },
  worldstage_leaderboard: { table: schema.worldstageLeaderboard, publicRead: true },
  worldstage_spotlights: { table: schema.worldstageSpotlights, publicRead: true },
};

function currentUserId(req: Request): string | undefined {
  return (req.user as any)?.claims?.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // ── Current user ────────────────────────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const userId = currentUserId(req)!;
    const user = await storage.getUser(userId);
    const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, userId));
    res.json({ ...user, profile });
  });

  // ── Generic secured data API (replaces direct Supabase table access) ────
  app.get("/api/db/:table", async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });

    const userId = currentUserId(req);
    if (!def.publicRead && !userId) return res.status(401).json({ message: "Unauthorized" });

    try {
      let query: any = db.select().from(def.table);
      if (!def.publicRead && def.ownerColumn) {
        query = query.where(eq((def.table as any)[def.ownerColumn], userId));
      }
      const rows = await query;
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/db/:table", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;

    const payload = { ...req.body };
    if (def.ownerColumn && !payload[def.ownerColumn]) {
      payload[def.ownerColumn] = userId;
    }
    if (def.ownerColumn && payload[def.ownerColumn] !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const [row] = await db.insert(def.table).values(payload).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/db/:table/:id", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;
    const idColumn = (def.table as any).id;

    try {
      const conditions = def.ownerColumn
        ? and(eq(idColumn, req.params.id), eq((def.table as any)[def.ownerColumn], userId))
        : eq(idColumn, req.params.id);
      const [row] = await db.update(def.table).set(req.body).where(conditions).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/db/:table/:id", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;
    const idColumn = (def.table as any).id;

    try {
      const conditions = def.ownerColumn
        ? and(eq(idColumn, req.params.id), eq((def.table as any)[def.ownerColumn], userId))
        : eq(idColumn, req.params.id);
      await db.delete(def.table).where(conditions);
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Feed ──────────────────────────────────────────────────────────────────
  app.get("/api/feed", async (_req, res) => {
    const rows = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.isDeleted, false))
      .orderBy(desc(schema.posts.createdAt))
      .limit(50);
    res.json(rows);
  });

  // ── Matches / conversations ─────────────────────────────────────────────
  app.get("/api/matches", isAuthenticated, async (req, res) => {
    const userId = currentUserId(req)!;
    const rows = await db
      .select()
      .from(schema.matches)
      .where(or(eq(schema.matches.user1Id, userId), eq(schema.matches.user2Id, userId)));
    res.json(rows);
  });

  app.get("/api/messages/:otherUserId", isAuthenticated, async (req, res) => {
    const userId = currentUserId(req)!;
    const otherId = req.params.otherUserId;
    const rows = await db
      .select()
      .from(schema.messages)
      .where(
        or(
          and(eq(schema.messages.senderId, userId), eq(schema.messages.receiverId, otherId)),
          and(eq(schema.messages.senderId, otherId), eq(schema.messages.receiverId, userId)),
        ),
      )
      .orderBy(schema.messages.createdAt);
    res.json(rows);
  });

  const httpServer = createServer(app);
  return httpServer;
}
