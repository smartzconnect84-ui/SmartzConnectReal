import { db } from "./db";
import { users, profiles, type User, type UpsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";

export const storage = {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async upsertUser(data: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();

    // Ensure a matching app profile row exists for this user.
    await db
      .insert(profiles)
      .values({
        id: data.id!,
        fullName: [data.firstName, data.lastName].filter(Boolean).join(" ") || undefined,
        avatarUrl: data.profileImageUrl ?? undefined,
      })
      .onConflictDoNothing();

    return user;
  },
};
