import { NextResponse } from "next/server";
import { db } from "@/db";
import { userChatMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, chat_id, action, value, label_id } = body;

    if (!user_id || !chat_id || !action) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "user_id, chat_id, action required." } },
        { status: 400 }
      );
    }

    const metaId = `${user_id}_${chat_id}`;
    const existing = await db
      .select()
      .from(userChatMetadata)
      .where(and(eq(userChatMetadata.user_id, user_id), eq(userChatMetadata.chat_id, chat_id)))
      .limit(1);

    let currentMeta = existing[0] || {
      id: metaId,
      user_id,
      chat_id,
      is_pinned: false,
      is_muted: false,
      is_archived: false,
      is_favorite: false,
      is_unread_manual: false,
      label_ids: [],
      updated_at: new Date(),
    };

    if (action === "pin") currentMeta.is_pinned = Boolean(value);
    if (action === "mute") currentMeta.is_muted = Boolean(value);
    if (action === "archive") currentMeta.is_archived = Boolean(value);
    if (action === "favorite") currentMeta.is_favorite = Boolean(value);
    if (action === "mark_unread") currentMeta.is_unread_manual = Boolean(value);
    if (action === "toggle_label" && label_id) {
      const labels = currentMeta.label_ids || [];
      if (labels.includes(label_id)) {
        currentMeta.label_ids = labels.filter((id) => id !== label_id);
      } else {
        currentMeta.label_ids = [...labels, label_id];
      }
    }

    if (existing.length === 0) {
      await db.insert(userChatMetadata).values(currentMeta);
    } else {
      await db
        .update(userChatMetadata)
        .set({
          is_pinned: currentMeta.is_pinned,
          is_muted: currentMeta.is_muted,
          is_archived: currentMeta.is_archived,
          is_favorite: currentMeta.is_favorite,
          is_unread_manual: currentMeta.is_unread_manual,
          label_ids: currentMeta.label_ids,
          updated_at: new Date(),
        })
        .where(eq(userChatMetadata.id, metaId));
    }

    return NextResponse.json({
      success: true,
      data: { metadata: currentMeta },
    });
  } catch (error: any) {
    console.error("Chat metadata error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
