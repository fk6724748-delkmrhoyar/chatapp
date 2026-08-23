import { NextResponse } from "next/server";
import { db } from "@/db";
import { featureFlags, adminLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const flags = await db.select().from(featureFlags);
    return NextResponse.json({ success: true, data: { flags } });
  } catch (error: any) {
    console.error("Fetch feature flags error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, admin_id = "admin_1", scope, enabled, enabled_for, user_overrides } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Feature key required." } }, { status: 400 });
    }

    const data: any = {};
    if (scope !== undefined) data.scope = scope;
    if (enabled !== undefined) data.enabled = Boolean(enabled);
    if (enabled_for !== undefined) data.enabled_for = enabled_for;
    if (user_overrides !== undefined) data.user_overrides = user_overrides;

    await db.update(featureFlags).set(data).where(eq(featureFlags.key, key));

    await db.insert(adminLogs).values({
      id: `log_${Date.now()}`,
      admin_id,
      action: "update_feature_flag",
      target_type: "feature_flag",
      target_id: key,
      details: data,
      timestamp: new Date(),
    });

    const updated = (await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1))[0];

    return NextResponse.json({ success: true, data: { flag: updated } });
  } catch (error: any) {
    console.error("Update feature flag error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
