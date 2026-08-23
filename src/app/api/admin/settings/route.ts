import { NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings, adminLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const settings = (await db.select().from(appSettings).where(eq(appSettings.id, "default")).limit(1))[0];
    return NextResponse.json({ success: true, data: { settings } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { app_name, logo_url, primary_color, max_upload_mb, allowed_file_types, maintenance_mode, maintenance_message, payment_accounts, admin_id = "admin_1" } = body;

    const data: any = {};
    if (app_name !== undefined) data.app_name = app_name;
    if (logo_url !== undefined) data.logo_url = logo_url;
    if (primary_color !== undefined) data.primary_color = primary_color;
    if (max_upload_mb !== undefined) data.max_upload_mb = max_upload_mb;
    if (allowed_file_types !== undefined) data.allowed_file_types = allowed_file_types;
    if (maintenance_mode !== undefined) data.maintenance_mode = Boolean(maintenance_mode);
    if (maintenance_message !== undefined) data.maintenance_message = maintenance_message;
    if (payment_accounts !== undefined) data.payment_accounts = payment_accounts;

    await db.update(appSettings).set(data).where(eq(appSettings.id, "default"));

    await db.insert(adminLogs).values({
      id: `log_${Date.now()}`,
      admin_id,
      action: "update_app_settings",
      target_type: "app_settings",
      target_id: "default",
      details: data,
      timestamp: new Date(),
    });

    const updated = (await db.select().from(appSettings).where(eq(appSettings.id, "default")).limit(1))[0];

    return NextResponse.json({ success: true, data: { settings: updated } });
  } catch (error: any) {
    console.error("Update app settings error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
