import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, message_id, user_id, content, emoji, poll_option_id } = body;

    if (!action || !message_id || !user_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "action, message_id, user_id required." } },
        { status: 400 }
      );
    }

    const msgResult = await db.select().from(messages).where(eq(messages.id, message_id)).limit(1);
    if (msgResult.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Message not found." } }, { status: 404 });
    }

    const msg = msgResult[0];

    if (action === "edit") {
      if (msg.sender_id !== user_id) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Can only edit own messages." } }, { status: 403 });
      }
      await db.update(messages).set({ content, edited: true }).where(eq(messages.id, message_id));
    } else if (action === "delete_for_me") {
      const currentDeletedFor = msg.deleted_for || [];
      if (!currentDeletedFor.includes(user_id)) {
        await db
          .update(messages)
          .set({ deleted_for: [...currentDeletedFor, user_id] })
          .where(eq(messages.id, message_id));
      }
    } else if (action === "delete_for_everyone") {
      if (msg.sender_id !== user_id) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Can only delete for everyone if sender." } }, { status: 403 });
      }
      await db.update(messages).set({ deleted_for_everyone: true }).where(eq(messages.id, message_id));
    } else if (action === "star") {
      const currentStarred = msg.starred_by || [];
      const newStarred = currentStarred.includes(user_id)
        ? currentStarred.filter((id) => id !== user_id)
        : [...currentStarred, user_id];
      await db.update(messages).set({ starred_by: newStarred }).where(eq(messages.id, message_id));
    } else if (action === "react") {
      const currentReactions = { ...(msg.reactions || {}) };
      if (emoji) {
        currentReactions[user_id] = emoji;
      } else {
        delete currentReactions[user_id];
      }
      await db.update(messages).set({ reactions: currentReactions }).where(eq(messages.id, message_id));
    } else if (action === "vote_poll" && poll_option_id) {
      const poll = msg.poll_data;
      if (poll) {
        const updatedOptions = poll.options.map((opt) => {
          let votes = opt.votes || [];
          if (opt.id === poll_option_id) {
            if (votes.includes(user_id)) {
              votes = votes.filter((id) => id !== user_id);
            } else {
              votes = [...votes, user_id];
            }
          } else if (!poll.multiple) {
            // Remove user vote from other options if single choice
            votes = votes.filter((id) => id !== user_id);
          }
          return { ...opt, votes };
        });

        await db
          .update(messages)
          .set({ poll_data: { ...poll, options: updatedOptions } })
          .where(eq(messages.id, message_id));
      }
    } else if (action === "view_once_open") {
      const openedBy = msg.view_once_opened_by || [];
      if (!openedBy.includes(user_id)) {
        await db
          .update(messages)
          .set({ view_once_opened_by: [...openedBy, user_id] })
          .where(eq(messages.id, message_id));
      }
    }

    const updatedMsg = (await db.select().from(messages).where(eq(messages.id, message_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { message: updatedMsg },
    });
  } catch (error: any) {
    console.error("Message action error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
