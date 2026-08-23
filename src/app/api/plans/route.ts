import { NextResponse } from "next/server";
import { db } from "@/db";
import { plans, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const planList = await db.select().from(plans);
    const settings = (await db.select().from(appSettings).where(eq(appSettings.id, "default")).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: {
        plans: planList,
        payment_accounts: settings?.payment_accounts || {},
      },
    });
  } catch (error: any) {
    console.error("Fetch plans error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
