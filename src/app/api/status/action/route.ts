import { NextResponse } from "next/server";
import { db } from "@/db";
import { statuses, users, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isFeatureEnabledForUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, status_id, user_id, text } = body;

    if (!action || !status_id || !user_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "action, status_id, user_id required." } },
        { status: 400 }
      );
    }

    const statResult = await db.select().from(statuses).where(eq(statuses.id, status_id)).limit(1);
    if (statResult.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Status not found." } }, { status: 404 });
    }

    const statusObj = statResult[0];
    const user = (await db.select().from(users).where(eq(users.id, user_id)).limit(1))[0];

    if (action === "view") {
      // Check viewer's privacy for Anti-Status-View (hide_status_views)
      const privacy = (user?.privacy || {}) as any;
      const hideViews = privacy.hide_status_views || false;

      if (!hideViews) {
        const viewers = statusObj.viewers || [];
        if (!viewers.some((v) => v.user_id === user_id)) {
          const updatedViewers = [...viewers, { user_id, viewed_at: new Date().toISOString() }];
          await db.update(statuses).set({ viewers: updatedViewers }).where(eq(statuses.id, status_id));
        }
      }
    } else if (action === "like") {
      const likes = statusObj.likes || [];
      const updatedLikes = likes.includes(user_id)
        ? likes.filter((id) => id !== user_id)
        : [...likes, user_id];
      await db.update(statuses).set({ likes: updatedLikes }).where(eq(statuses.id, status_id));
    } else if (action === "reply" && text) {
      const replies = statusObj.replies || [];
      const newReply = { user_id, text, at: new Date().toISOString() };
      await db.update(statuses).set({ replies: [...replies, newReply] }).where(eq(statuses.id, status_id));

      // Also send direct message reply in 1-on-1 chat
      const chatId = [user_id, statusObj.user_id].sort().join("_");
      await db.insert(messages).values({
        id: `m_reply_stat_${Date.now()}`,
        chat_id: `c_${chatId}`,
        sender_id: user_id,
        type: "text",
        content: `Replied to status: "${text}"`,
        media_meta: null,
        poll_data: null,
        reply_to: null,
        forwarded: false,
        starred_by: [],
        status: "sent",
        deleted_for: [],
        deleted_for_everyone: false,
        edited: false,
        view_once: false,
        view_once_opened_by: [],
        reactions: {},
        created_at: new Date(),
      });
    } else if (action === "delete") {
      if (statusObj.user_id !== user_id) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Cannot delete another user's status." } }, { status: 403 });
      }
      await db.delete(statuses).where(eq(statuses.id, status_id));
    }

    const updatedStat = (await db.select().from(statuses).where(eq(statuses.id, status_id)).limit(1))[0] || null;

    return NextResponse.json({
      success: true,
      data: { status: updatedStat },
    });
  } catch (error: any) {
    console.error("Status action error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
