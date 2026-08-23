import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, messages, groups, userChatMetadata } from "@/db/schema";
import { eq, or, desc, and, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "User ID is required." } },
        { status: 400 }
      );
    }

    const currentUser = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    // Fetch user chat metadata (pinned, muted, archived, labels)
    const chatMeta = await db.select().from(userChatMetadata).where(eq(userChatMetadata.user_id, userId));
    const metaMap = new Map<string, typeof chatMeta[0]>();
    chatMeta.forEach((m) => metaMap.set(m.chat_id, m));

    // Fetch all 1-on-1 users except current user
    const allUsers = await db.select().from(users);
    const userMap = new Map<string, typeof allUsers[0]>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Fetch groups current user belongs to
    const allGroups = await db.select().from(groups);
    const myGroups = allGroups.filter((g) =>
      g.members.some((m) => m.user_id === userId)
    );

    // Fetch all messages to identify chats where current user has messages or interactions
    const allMessages = await db.select().from(messages).orderBy(desc(messages.created_at));

    // Group messages by chat_id
    const chatMessagesMap = new Map<string, typeof allMessages>();
    allMessages.forEach((msg) => {
      if (!chatMessagesMap.has(msg.chat_id)) {
        chatMessagesMap.set(msg.chat_id, []);
      }
      chatMessagesMap.get(msg.chat_id)!.push(msg);
    });

    const chatsList: any[] = [];

    // Helper to generate canonical chat ID for 1-on-1: sort user IDs
    const get1on1ChatId = (id1: string, id2: string) => {
      const sorted = [id1, id2].sort();
      return `c_${sorted[0]}_${sorted[1]}`;
    };

    // 1. Process 1-on-1 chats with all other contacts
    for (const otherUser of allUsers) {
      if (otherUser.id === userId) continue;

      const chatId = get1on1ChatId(userId, otherUser.id);
      const msgs = chatMessagesMap.get(chatId) || [];
      const meta = metaMap.get(chatId);

      // Skip empty 1-on-1 chats unless pinned, unread manual, or AI Bot
      if (msgs.length === 0 && !meta?.is_pinned && otherUser.id !== "u_ai_bot") {
        continue;
      }

      const lastMsg = msgs[0] || null;

      // Calculate unread count (messages sent by otherUser where status !== 'read' and not deleted for userId)
      const unreadCount = msgs.filter(
        (m) =>
          m.sender_id !== userId &&
          m.status !== "read" &&
          !m.deleted_for.includes(userId)
      ).length;

      // Check online / presence status respecting ghost_mode & privacy
      let isOnline = false;
      let statusSubtitle = "";

      const otherPrivacy = otherUser.privacy || {};
      const ghostMode = otherPrivacy.ghost_mode || false;
      const hideOnline = otherPrivacy.hide_online || false;

      // Show online if active in last 3 minutes and ghost_mode/hide_online is false
      const lastActiveMs = otherUser.last_seen_at ? new Date(otherUser.last_seen_at).getTime() : 0;
      const nowMs = Date.now();
      const isActiveRecently = nowMs - lastActiveMs < 3 * 60 * 1000;

      if (isActiveRecently && !ghostMode && !hideOnline) {
        isOnline = true;
        statusSubtitle = "online";
      } else if (!ghostMode && otherPrivacy.last_seen === "everyone") {
        statusSubtitle = otherUser.last_seen_at
          ? `last seen ${new Date(otherUser.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : "offline";
      }

      chatsList.push({
        chat_id: chatId,
        is_group: false,
        contact: {
          id: otherUser.id,
          name: otherUser.name,
          phone: otherUser.phone,
          about: otherUser.about,
          photo_url: otherUser.photo_url,
          is_business: otherUser.is_business,
          badges: otherUser.badges,
          is_online: isOnline,
          status_subtitle: statusSubtitle,
        },
        last_message: lastMsg,
        unread_count: unreadCount,
        is_pinned: meta?.is_pinned || false,
        is_muted: meta?.is_muted || false,
        is_archived: meta?.is_archived || false,
        is_favorite: meta?.is_favorite || false,
        is_unread_manual: meta?.is_unread_manual || false,
        label_ids: meta?.label_ids || [],
        updated_at: lastMsg ? lastMsg.created_at : otherUser.created_at,
      });
    }

    // 2. Process Group chats
    for (const groupObj of myGroups) {
      const chatId = groupObj.id;
      const msgs = chatMessagesMap.get(chatId) || [];
      const meta = metaMap.get(chatId);

      const lastMsg = msgs[0] || null;
      const unreadCount = msgs.filter(
        (m) => m.sender_id !== userId && !m.deleted_for.includes(userId) && m.status !== "read"
      ).length;

      chatsList.push({
        chat_id: chatId,
        is_group: true,
        group: {
          id: groupObj.id,
          name: groupObj.name,
          photo_url: groupObj.photo_url,
          description: groupObj.description,
          members: groupObj.members,
          settings: groupObj.settings,
          created_by: groupObj.created_by,
        },
        last_message: lastMsg,
        unread_count: unreadCount,
        is_pinned: meta?.is_pinned || false,
        is_muted: meta?.is_muted || false,
        is_archived: meta?.is_archived || false,
        is_favorite: meta?.is_favorite || false,
        is_unread_manual: meta?.is_unread_manual || false,
        label_ids: meta?.label_ids || [],
        updated_at: lastMsg ? lastMsg.created_at : groupObj.created_at,
      });
    }

    // Sort chats: Pinned first, then by updated_at descending
    chatsList.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return NextResponse.json({
      success: true,
      data: { chats: chatsList },
    });
  } catch (error: any) {
    console.error("Chat list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
