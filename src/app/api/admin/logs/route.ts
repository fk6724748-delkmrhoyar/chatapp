import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db.select().from(adminLogs).orderBy(desc(adminLogs.timestamp)).limit(100);
    return NextResponse.json({ success: true, data: { logs } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
