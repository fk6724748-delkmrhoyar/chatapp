import { NextResponse } from "next/server";
import { db } from "@/db";
import { groups, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, photo_url, description, member_ids, created_by } = body;

    if (!name || !created_by || !Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Group name and member list are required." } },
        { status: 400 }
      );
    }

    const groupId = `g_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const memberList = [
      { user_id: created_by, role: "admin" as const, joined_at: new Date().toISOString() },
      ...member_ids.filter((id: string) => id !== created_by).map((id: string) => ({
        user_id: id,
        role: "member" as const,
        joined_at: new Date().toISOString(),
      })),
    ];

    const newGroup = {
      id: groupId,
      name: name.trim().substring(0, 25),
      photo_url: photo_url || null,
      description: description || "",
      members: memberList,
      settings: {
        who_can_send: "everyone" as const,
        who_can_edit_info: "everyone" as const,
        disappearing_messages: { enabled: false, duration_hours: 24 },
      },
      created_by,
      created_at: new Date(),
    };

    await db.insert(groups).values(newGroup);

    // Add initial system message
    await db.insert(messages).values({
      id: `m_sys_${Date.now()}`,
      chat_id: groupId,
      sender_id: created_by,
      type: "text",
      content: `System: Group "${name}" was created.`,
      status: "read",
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { group: newGroup },
    });
  } catch (error: any) {
    console.error("Group creation error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
