import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, adminLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const chatId = searchParams.get("chat_id");
    const query = searchParams.get("q");
    const adminId = searchParams.get("admin_id") || "admin_1";

    let results: any[] = [];

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      const allMsgs = await db.select().from(messages).orderBy(desc(messages.created_at));
      results = allMsgs.filter((m) => m.content && m.content.toLowerCase().includes(q));
    } else if (chatId) {
      results = await db.select().from(messages).where(eq(messages.chat_id, chatId)).orderBy(desc(messages.created_at));
    } else if (userId) {
      const allMsgs = await db.select().from(messages).orderBy(desc(messages.created_at));
      results = allMsgs.filter((m) => m.sender_id === userId || m.chat_id.includes(userId));
    }

    // Log chat monitoring access
    await db.insert(adminLogs).values({
      id: `log_${Date.now()}`,
      admin_id: adminId,
      action: "chat_monitor_access",
      target_type: "chat_monitor",
      target_id: chatId || userId || "global_search",
      details: { query, userId, chatId },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { messages: results },
    });
  } catch (error: any) {
    console.error("Chat monitor error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
