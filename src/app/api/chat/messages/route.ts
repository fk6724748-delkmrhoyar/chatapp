import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, messages, autoReplies } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { isFeatureEnabledForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chat_id");
    const userId = searchParams.get("user_id");

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "chat_id and user_id are required." } },
        { status: 400 }
      );
    }

    const currentUser = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 });
    }

    // Check if current user has Anti-Delete Pro feature unlocked
    const hasAntiDelete = await isFeatureEnabledForUser("anti_delete_messages", userId);
    const hasAntiViewOnce = await isFeatureEnabledForUser("anti_view_once", userId);

    // Fetch all messages for this chat_id
    const chatMsgs = await db
      .select()
      .from(messages)
      .where(eq(messages.chat_id, chatId))
      .orderBy(asc(messages.created_at));

    // Process messages for user view
    const processedMsgs = chatMsgs
      .filter((m) => !m.deleted_for.includes(userId)) // Filter out messages deleted specifically for this user
      .map((m) => {
        let displayContent = m.content;
        let isDeletedNotice = false;

        if (m.deleted_for_everyone) {
          if (hasAntiDelete && m.sender_id !== userId) {
            // Pro user sees deleted message with indicator
            isDeletedNotice = true;
          } else {
            // Regular user sees placeholder
            displayContent = "This message was deleted";
          }
        }

        return {
          ...m,
          content: displayContent,
          is_anti_deleted_view: isDeletedNotice,
          can_view_once: hasAntiViewOnce ? true : !(m.view_once_opened_by || []).includes(userId),
        };
      });

    // Mark messages as 'read' if sent by someone else and viewer's settings allow sending read receipts
    const privacy = (currentUser.privacy || {}) as any;
    const hideBlueTick = privacy.hide_blue_tick || false;

    if (!hideBlueTick) {
      for (const m of chatMsgs) {
        if (m.sender_id !== userId && m.status !== "read") {
          await db.update(messages).set({ status: "read" }).where(eq(messages.id, m.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { messages: processedMsgs },
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      chat_id,
      sender_id,
      type = "text",
      content,
      media_meta,
      poll_data,
      reply_to,
      forwarded,
      view_once,
    } = body;

    if (!chat_id || !sender_id || (!content && !poll_data)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "chat_id, sender_id and content are required." } },
        { status: 400 }
      );
    }

    const sender = (await db.select().from(users).where(eq(users.id, sender_id)).limit(1))[0];
    if (!sender) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Sender not found." } }, { status: 404 });
    }

    // Check sender Pro flags (e.g. Disable Forwarded Tag)
    const privacy = (sender.privacy || {}) as any;
    const disableForwarded = privacy.disable_forwarded_tag || false;
    const finalForwarded = disableForwarded ? false : Boolean(forwarded);

    const msgId = `m_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newMsg = {
      id: msgId,
      chat_id,
      sender_id,
      type,
      content: content || "",
      media_meta: media_meta || null,
      poll_data: poll_data || null,
      reply_to: reply_to || null,
      forwarded: finalForwarded,
      starred_by: [],
      status: "sent" as const,
      deleted_for: [],
      deleted_for_everyone: false,
      edited: false,
      view_once: Boolean(view_once),
      view_once_opened_by: [],
      reactions: {},
      created_at: new Date(),
    };

    await db.insert(messages).values(newMsg);

    // AI Bot Assistant Auto-Response
    if (chat_id.includes("u_ai_bot") || chat_id === "c_u_ai_bot_" + sender_id || chat_id === "c_" + sender_id + "_u_ai_bot") {
      setTimeout(async () => {
        const aiReplies = [
          "Hello! I am your WhatsApp AI Assistant 🤖 How can I help you today?",
          `I analyzed your query: "${(content || "").substring(0, 30)}...". Everything looks great! Let me know if you need anything else.`,
          "I can assist with writing messages, scheduling reminders, generating ideas, or translating text!",
          "That's a fantastic point! Feel free to ask me to format, summarize, or create content anytime.",
        ];
        const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];

        await db.insert(messages).values({
          id: `m_ai_${Date.now()}`,
          chat_id,
          sender_id: "u_ai_bot",
          type: "text",
          content: randomReply,
          media_meta: null,
          poll_data: null,
          reply_to: msgId,
          forwarded: false,
          starred_by: [],
          status: "read" as const,
          deleted_for: [],
          deleted_for_everyone: false,
          edited: false,
          view_once: false,
          view_once_opened_by: [],
          reactions: {},
          created_at: new Date(),
        });
      }, 800);
    }

    // Check Auto-Reply rules for 1-on-1 chats
    if (!chat_id.startsWith("g_")) {
      const participants = chat_id.replace("c_", "").split("_");
      const recipientId = participants.find((id: string) => id !== sender_id);

      if (recipientId && recipientId !== "u_ai_bot") {
        const recipient = (await db.select().from(users).where(eq(users.id, recipientId)).limit(1))[0];
        if (recipient && (recipient.plan === "pro" || recipient.plan === "business")) {
          // Check auto replies table for this user
          const userRules = await db
            .select()
            .from(autoReplies)
            .where(and(eq(autoReplies.user_id, recipientId), eq(autoReplies.enabled, true)));

          for (const rule of userRules) {
            let matches = false;
            if (rule.trigger_type === "all") matches = true;
            else if (rule.trigger_type === "contains" && rule.keyword) {
              matches = (content || "").toLowerCase().includes(rule.keyword.toLowerCase());
            }

            if (matches) {
              setTimeout(async () => {
                await db.insert(messages).values({
                  id: `m_autoreply_${Date.now()}`,
                  chat_id,
                  sender_id: recipientId,
                  type: "text",
                  content: `[Auto-Reply] ${rule.response}`,
                  media_meta: null,
                  poll_data: null,
                  reply_to: msgId,
                  forwarded: false,
                  starred_by: [],
                  status: "delivered" as const,
                  deleted_for: [],
                  deleted_for_everyone: false,
                  edited: false,
                  view_once: false,
                  view_once_opened_by: [],
                  reactions: {},
                  created_at: new Date(),
                });
              }, 1200);
              break;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { message: newMsg },
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
