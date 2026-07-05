import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { eq, and, or, ne, gt, gte, lt, lte, like, ilike, isNull, isNotNull, inArray, desc, asc, sql } from "drizzle-orm";
import { presignPutUrl, deleteObject, sufyPublicUrl, loadSufyConfig } from "./sufyStorage";
import { signJwtHS256 } from "./jwt";
import crypto from "crypto";

// Tables that may be queried/mutated through the generic data API, and the
// authorization rule applied to each (mirrors the previous Supabase RLS
// policies). "public" tables are readable by anyone; owner-scoped tables
// restrict reads/writes to rows the current user owns; "adminOnly" tables
// require the caller's profile.role to be an admin-ish role.
const ADMIN_ROLES = new Set(["admin", "superadmin", "ceo", "moderator", "support"]);

interface TableDef {
  table: any;
  ownerColumn?: string;
  publicRead?: boolean;
  adminOnly?: boolean;
  adminWrite?: boolean; // writes require admin even if reads are public
}

const TABLES: Record<string, TableDef> = {
  profiles: { table: schema.profiles, ownerColumn: "id", publicRead: true },
  users: { table: schema.profiles, ownerColumn: "id", adminOnly: true }, // admin virtual alias
  posts: { table: schema.posts, ownerColumn: "userId", publicRead: true },
  post_likes: { table: schema.postLikes, ownerColumn: "userId", publicRead: true },
  post_comments: { table: schema.postComments, ownerColumn: "userId", publicRead: true },
  post_shares: { table: schema.postShares, ownerColumn: "userId", publicRead: true },
  post_saves: { table: schema.postSaves, ownerColumn: "userId" },
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
  subscription_plans: { table: schema.subscriptionPlans, publicRead: true, adminWrite: true },
  subscriptions: { table: schema.subscriptions, ownerColumn: "userId" },
  user_subscriptions: { table: schema.userSubscriptions, ownerColumn: "userId", adminOnly: true },
  marketplace_items: { table: schema.marketplaceItems, ownerColumn: "sellerId", publicRead: true },
  streams: { table: schema.streams, ownerColumn: "hostId", publicRead: true },
  video_calls: { table: schema.videoCalls, ownerColumn: "callerId" },
  call_participants: { table: schema.callParticipants, ownerColumn: "userId" },
  stream_tokens: { table: schema.streamTokens, ownerColumn: "userId" },
  platform_files: { table: schema.platformFiles, ownerColumn: "userId", publicRead: true },
  worldstage_events: { table: schema.worldstageEvents, publicRead: true },
  worldstage_leaderboard: { table: schema.worldstageLeaderboard, publicRead: true },
  worldstage_spotlights: { table: schema.worldstageSpotlights, publicRead: true },
  user_reports: { table: schema.userReports, ownerColumn: "reporterId" },
  user_blocks: { table: schema.userBlocks, ownerColumn: "blockerId" },
  mobile_money_payments: { table: schema.mobileMoneyPayments, ownerColumn: "userId" },
  reports: { table: schema.reports, adminOnly: true },
  audit_logs: { table: schema.auditLogs, adminOnly: true },
  team_members: { table: schema.teamMembers, publicRead: true, adminWrite: true },
  admin_users: { table: schema.adminUsers, adminOnly: true },
  safety_rules: { table: schema.safetyRules, publicRead: true, adminWrite: true },
  feature_permissions: { table: schema.featurePermissions, publicRead: true, adminWrite: true },
  ad_campaigns: { table: schema.adCampaigns, publicRead: true, adminWrite: true },
  broadcast_messages: { table: schema.broadcastMessages, adminOnly: true },
  blog_posts: { table: schema.blogPosts, publicRead: true, adminWrite: true },
  drivers: { table: schema.drivers, ownerColumn: "userId", adminOnly: true },
  ride_requests: { table: schema.rideRequests, ownerColumn: "riderId" },
  livestreams: { table: schema.livestreams, ownerColumn: "hostId", publicRead: true },
};

function currentUserId(req: Request): string | undefined {
  return (req.user as any)?.claims?.sub;
}

async function currentUserRole(req: Request): Promise<string | null> {
  const userId = currentUserId(req);
  if (!userId) return null;
  const [profile] = await db.select({ role: schema.profiles.role }).from(schema.profiles).where(eq(schema.profiles.id, userId));
  return profile?.role ?? null;
}

function opToCondition(column: any, op: string, value: any) {
  switch (op) {
    case "eq": return eq(column, value);
    case "neq": return ne(column, value);
    case "gt": return gt(column, value);
    case "gte": return gte(column, value);
    case "lt": return lt(column, value);
    case "lte": return lte(column, value);
    case "like": return like(column, value);
    case "ilike": return ilike(column, value);
    case "in": return inArray(column, value);
    case "is": return value === null ? isNull(column) : isNotNull(column);
    case "contains": return sql`${column} @> ${JSON.stringify(value)}`;
    default: return eq(column, value);
  }
}

function parseFilters(req: Request): { col: string; op: string; value: any }[] {
  const raw = req.query.filters as string | undefined;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseOrders(req: Request): { col: string; ascending: boolean }[] {
  const raw = req.query.order as string | undefined;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    if (def.adminOnly) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    } else if (!def.publicRead && !userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const columns = def.table as Record<string, any>;
      const conditions = parseFilters(req)
        .filter((f) => columns[f.col])
        .map((f) => opToCondition(columns[f.col], f.op, f.value));

      if (!def.adminOnly && !def.publicRead && def.ownerColumn) {
        conditions.push(eq(columns[def.ownerColumn], userId));
      }

      let query: any = db.select().from(def.table);
      if (conditions.length) query = query.where(and(...conditions));

      const orders = parseOrders(req);
      if (orders.length) {
        query = query.orderBy(...orders.filter((o) => columns[o.col]).map((o) => (o.ascending ? asc(columns[o.col]) : desc(columns[o.col]))));
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      if (limit) query = query.limit(limit);

      if (req.query.range) {
        try {
          const [from, to] = JSON.parse(req.query.range as string);
          query = query.limit(to - from + 1).offset(from);
        } catch { /* ignore malformed range */ }
      }

      const rows = await query;

      if (req.query.count === "exact") {
        let countQuery: any = db.select({ count: sql<number>`count(*)::int` }).from(def.table);
        if (conditions.length) countQuery = countQuery.where(and(...conditions));
        const [{ count }] = await countQuery;
        if (req.query.head === "1") return res.json({ rows: [], count });
        return res.json({ rows, count });
      }

      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/db/:table", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;

    if (def.adminOnly || def.adminWrite) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    }

    const payload = { ...req.body };
    if (!def.adminOnly && def.ownerColumn) {
      if (!payload[def.ownerColumn]) payload[def.ownerColumn] = userId;
      if (payload[def.ownerColumn] !== userId) return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const [row] = await db.insert(def.table).values(payload).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/db/:table/upsert", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;

    if (def.adminOnly || def.adminWrite) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    }

    const payload = { ...req.body };
    if (!def.adminOnly && def.ownerColumn) {
      if (!payload[def.ownerColumn]) payload[def.ownerColumn] = userId;
      if (payload[def.ownerColumn] !== userId) return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const idColumn = (def.table as any).id;
      const [row] = await db
        .insert(def.table)
        .values(payload)
        .onConflictDoUpdate({ target: idColumn, set: payload })
        .returning();
      res.status(200).json(row);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/db/:table", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;

    if (def.adminOnly || def.adminWrite) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const columns = def.table as Record<string, any>;
      const conditions = parseFilters(req)
        .filter((f) => columns[f.col])
        .map((f) => opToCondition(columns[f.col], f.op, f.value));

      if (!def.adminOnly && !def.adminWrite && def.ownerColumn) {
        conditions.push(eq(columns[def.ownerColumn], userId));
      }
      if (!conditions.length) return res.status(400).json({ message: "Refusing unscoped update" });

      const rows = await db.update(def.table).set(req.body).where(and(...conditions)).returning();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/db/:table", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;

    if (def.adminOnly || def.adminWrite) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const columns = def.table as Record<string, any>;
      const conditions = parseFilters(req)
        .filter((f) => columns[f.col])
        .map((f) => opToCondition(columns[f.col], f.op, f.value));

      if (!def.adminOnly && !def.adminWrite && def.ownerColumn) {
        conditions.push(eq(columns[def.ownerColumn], userId));
      }
      if (!conditions.length) return res.status(400).json({ message: "Refusing unscoped delete" });

      await db.delete(def.table).where(and(...conditions));
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Legacy id-scoped mutation routes (kept for direct callers).
  app.patch("/api/db/:table/:id", isAuthenticated, async (req: Request, res: Response) => {
    const def = TABLES[req.params.table];
    if (!def) return res.status(404).json({ message: "Unknown table" });
    const userId = currentUserId(req)!;
    const idColumn = (def.table as any).id;

    if (def.adminOnly || def.adminWrite) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const conditions = !def.adminOnly && !def.adminWrite && def.ownerColumn
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

    if (def.adminOnly || def.adminWrite) {
      const role = await currentUserRole(req);
      if (!role || !ADMIN_ROLES.has(role)) return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const conditions = !def.adminOnly && !def.adminWrite && def.ownerColumn
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

  // ── Ported "edge functions" (formerly Supabase Edge Functions) ──────────
  // All require an authenticated Replit-Auth session; ownership/ACL rules
  // that used to live in the Deno functions are enforced here instead.
  const ALLOWED_SUFY_FOLDERS = ["avatars", "covers", "photos", "stories", "marketplace", "posts", "voice-notes", "documents"];

  app.post("/api/functions/sufy-presign", isAuthenticated, async (req, res) => {
    const config = loadSufyConfig();
    if (!config) return res.status(503).json({ error: "SUFY storage not configured" });

    const { folder, fileName, contentType } = req.body ?? {};
    if (!folder || !fileName || !contentType) {
      return res.status(400).json({ error: "folder, fileName and contentType are required" });
    }
    if (!ALLOWED_SUFY_FOLDERS.includes(folder)) {
      return res.status(400).json({ error: `folder must be one of: ${ALLOWED_SUFY_FOLDERS.join(", ")}` });
    }

    const userId = currentUserId(req)!;
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${userId}/${Date.now()}-${safeName}`;

    try {
      const uploadUrl = await presignPutUrl(config, key, contentType);
      const publicUrl = sufyPublicUrl(config, key);
      res.json({ uploadUrl, publicUrl, key });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/functions/sufy-delete", isAuthenticated, async (req, res) => {
    const config = loadSufyConfig();
    if (!config) return res.status(503).json({ error: "SUFY storage not configured" });

    const { key } = req.body ?? {};
    if (!key || typeof key !== "string") return res.status(400).json({ error: "key is required" });

    const userId = currentUserId(req)!;
    const ownPrefix = `/${userId}/`;
    if (!key.includes(ownPrefix)) return res.status(403).json({ error: "Forbidden" });

    try {
      const result = await deleteObject(config, key);
      if (!result.ok && result.status !== 404) {
        return res.status(502).json({ error: `SUFY delete failed (${result.status})` });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const EMAIL_TEMPLATES: Record<string, (d: Record<string, string>) => { subject: string; html: string }> = {
    welcome: (d) => ({
      subject: `Welcome to SmartzConnect, ${d.name || "Friend"}! 🎉`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:40px;text-align:center"><h1 style="margin:0;font-size:28px;font-weight:900">SmartzConnect</h1></div><div style="padding:40px"><h2 style="color:#ec4899;margin-top:0">Welcome, ${d.name || "Friend"}! 🎉</h2><p style="color:#9ca3af;line-height:1.7">Your account is ready. Start connecting with Africans across the continent.</p></div></div>`,
    }),
    reset_password: (d) => ({
      subject: "Reset your SmartzConnect password",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden"><div style="padding:40px"><h2 style="color:#ec4899">Password Reset</h2><p style="color:#9ca3af">${d.resetUrl ? `<a href="${d.resetUrl}">Reset your password</a>` : "Request a new reset link from the app."}</p></div></div>`,
    }),
    verify_email: (d) => ({
      subject: "Verify your SmartzConnect email address",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden"><div style="padding:40px"><h2 style="color:#ec4899">Confirm your email</h2><p style="color:#9ca3af">${d.verifyUrl || ""}</p></div></div>`,
    }),
    newsletter: (d) => ({
      subject: d.subject || "SmartzConnect Newsletter",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden"><div style="padding:40px">${d.body || ""}</div></div>`,
    }),
    order_update: (d) => ({
      subject: `Order Update: ${d.status || "Status Changed"} — SmartzConnect`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden"><div style="padding:32px"><p style="color:#9ca3af">Order #${d.orderId || "N/A"} — ${d.message || "Your order has been updated."}</p></div></div>`,
    }),
    ride_update: (d) => ({
      subject: `Ride Update: ${d.status || "Status Changed"} — SmartzConnect`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0A14;color:#fff;border-radius:16px;overflow:hidden"><div style="padding:32px"><p style="color:#9ca3af">${d.message || "Your ride status has been updated."}</p></div></div>`,
    }),
  };

  app.post("/api/functions/send-email", isAuthenticated, async (req, res) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return res.status(503).json({ error: "Resend not configured" });

    const { to, template, data = {} } = req.body ?? {};
    if (!to || !template) return res.status(400).json({ error: "Missing required fields: to, template" });
    const builder = EMAIL_TEMPLATES[template];
    if (!builder) return res.status(400).json({ error: `Unknown template: ${template}` });

    const { subject, html } = builder(data);
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "SmartzConnect <noreply@smartzconnect.com>", to: [to], subject, html }),
      });
      const result = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: result });
      res.json({ success: true, id: result.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/functions/send-push", isAuthenticated, async (req, res) => {
    const userId = currentUserId(req)!;
    const { userId: targetUserId, title, message, url } = req.body ?? {};
    if (!targetUserId || !title || !message) {
      return res.status(400).json({ error: "Missing required fields: userId, title, message" });
    }

    const [a, b] = [userId, targetUserId].sort();
    const [match] = await db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(and(eq(schema.matches.user1Id, a), eq(schema.matches.user2Id, b)))
      .limit(1);

    const isSelf = userId === targetUserId;
    if (!match && !isSelf) return res.status(403).json({ error: "Forbidden: no match with target user" });

    const oneSignalAppId = process.env.ONESIGNAL_APP_ID || process.env.VITE_ONESIGNAL_APP_ID;
    const oneSignalKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!oneSignalAppId || !oneSignalKey) return res.status(503).json({ error: "OneSignal not configured on server" });

    const payload: Record<string, unknown> = {
      app_id: oneSignalAppId,
      headings: { en: title },
      contents: { en: message },
      include_aliases: { external_id: [targetUserId] },
      target_channel: "push",
    };
    if (url) payload.url = url;

    try {
      const r = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { Authorization: `Basic ${oneSignalKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await r.json();
      res.status(r.ok ? 200 : 502).json({ success: r.ok, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/functions/livekit-token", isAuthenticated, async (req, res) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) return res.status(503).json({ error: "LiveKit not configured" });

    const { room, name } = req.body ?? {};
    if (!room) return res.status(400).json({ error: "room is required" });

    const userId = currentUserId(req)!;
    const user = (req.user as any)?.claims;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 6;

    const payload = {
      iss: apiKey,
      sub: userId,
      iat: now,
      nbf: now,
      exp,
      name: name || user?.email || "SmartzConnect User",
      video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true },
    };

    try {
      const token = await signJwtHS256(payload, apiSecret);
      const wsUrl = process.env.LIVEKIT_WS_URL || process.env.VITE_LIVEKIT_WS_URL || "";
      res.json({ token, wsUrl, room, identity: userId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/functions/stream-token", isAuthenticated, async (req, res) => {
    const streamSecret = process.env.STREAM_API_SECRET;
    if (!streamSecret) return res.status(503).json({ error: "Stream not configured" });

    const userId = currentUserId(req)!;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 24;

    try {
      const token = await signJwtHS256({ user_id: userId, iat: now, exp }, streamSecret);
      await db
        .insert(schema.streamTokens)
        .values({ userId, token, tokenType: "stream" })
        .onConflictDoUpdate({ target: schema.streamTokens.userId, set: { token, tokenType: "stream" } });
      res.json({ token, userId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
