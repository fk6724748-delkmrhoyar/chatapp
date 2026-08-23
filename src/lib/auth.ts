import { db } from "@/db";
import { users, featureFlags, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserById(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function isFeatureEnabledForUser(featureKey: string, userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  const flagResult = await db.select().from(featureFlags).where(eq(featureFlags.key, featureKey)).limit(1);
  if (flagResult.length === 0) return false;

  const flag = flagResult[0];

  // 1. Check user overrides first
  if (flag.user_overrides && typeof flag.user_overrides[userId] === "boolean") {
    return flag.user_overrides[userId];
  }

  // 2. Check global scope
  if (flag.scope === "global") {
    return flag.enabled;
  }

  // 3. Check plan scope
  if (flag.scope === "plan") {
    const userPlan = user.plan || "free";
    return Array.isArray(flag.enabled_for) && flag.enabled_for.includes(userPlan);
  }

  return false;
}

export async function getAppSettings() {
  const result = await db.select().from(appSettings).where(eq(appSettings.id, "default")).limit(1);
  return result[0] || null;
}
