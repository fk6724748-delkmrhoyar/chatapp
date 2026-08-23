import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements, users, messages, adminLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const history = await db.select().from(announcements).orderBy(desc(announcements.sent_at));
    return NextResponse.json({ success: true, data: { announcements: history } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, image_url, audience = "all", custom_user_ids = [], admin_id = "admin_1" } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Message content required." } }, { status: 400 });
    }

    const annId = `ann_${Date.now()}`;
    const newAnn = {
      id: annId,
      message,
      image_url: image_url || null,
      audience,
      custom_user_ids,
      sent_by: admin_id,
      sent_at: new Date(),
    };

    await db.insert(announcements).values(newAnn);

    // Send broadcast as system messages to target users
    const allUsers = await db.select().from(users);
    let targetUsers = allUsers;

    if (audience !== "all") {
      if (audience === "custom" && custom_user_ids.length > 0) {
        targetUsers = allUsers.filter((u) => custom_user_ids.includes(u.id));
      } else {
        targetUsers = allUsers.filter((u) => u.plan === audience);
      }
    }

    for (const u of targetUsers) {
      await db.insert(messages).values({
        id: `m_broadcast_${Date.now()}_${u.id}`,
        chat_id: `c_system_${u.id}`,
        sender_id: "u_ai_bot",
        type: image_url ? "image" : "text",
        content: `📢 [System Announcement]\n\n${message}`,
        media_meta: image_url ? { image_url } : null,
        poll_data: null,
        reply_to: null,
        forwarded: false,
        starred_by: [],
        status: "delivered",
        deleted_for: [],
        deleted_for_everyone: false,
        edited: false,
        view_once: false,
        view_once_opened_by: [],
        reactions: {},
        created_at: new Date(),
      });
    }

    await db.insert(adminLogs).values({
      id: `log_${Date.now()}`,
      admin_id,
      action: "send_broadcast",
      target_type: "announcement",
      target_id: annId,
      details: { audience, recipient_count: targetUsers.length },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { announcement: newAnn, recipient_count: targetUsers.length },
    });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
