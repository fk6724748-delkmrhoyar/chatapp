import { NextResponse } from "next/server";
import { db } from "@/db";
import { groups, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, group_id, user_id, target_user_id, name, description, photo_url, role, settings } = body;

    if (!group_id || !action || !user_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "group_id, action and user_id required." } },
        { status: 400 }
      );
    }

    const groupResult = await db.select().from(groups).where(eq(groups.id, group_id)).limit(1);
    if (groupResult.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Group not found." } }, { status: 404 });
    }

    const group = groupResult[0];
    let members = group.members || [];

    if (action === "update_info") {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim().substring(0, 25);
      if (description !== undefined) updateData.description = description;
      if (photo_url !== undefined) updateData.photo_url = photo_url;
      await db.update(groups).set(updateData).where(eq(groups.id, group_id));
    } else if (action === "add_members" && Array.isArray(target_user_id)) {
      const existingIds = members.map((m) => m.user_id);
      const newMembers = target_user_id
        .filter((id) => !existingIds.includes(id))
        .map((id) => ({ user_id: id, role: "member" as const, joined_at: new Date().toISOString() }));

      members = [...members, ...newMembers];
      await db.update(groups).set({ members }).where(eq(groups.id, group_id));
    } else if (action === "remove_member" && target_user_id) {
      members = members.filter((m) => m.user_id !== target_user_id);
      await db.update(groups).set({ members }).where(eq(groups.id, group_id));
    } else if (action === "set_role" && target_user_id && role) {
      members = members.map((m) => (m.user_id === target_user_id ? { ...m, role } : m));
      await db.update(groups).set({ members }).where(eq(groups.id, group_id));
    } else if (action === "update_settings" && settings) {
      await db
        .update(groups)
        .set({ settings: { ...group.settings, ...settings } })
        .where(eq(groups.id, group_id));
    } else if (action === "exit") {
      members = members.filter((m) => m.user_id !== user_id);
      await db.update(groups).set({ members }).where(eq(groups.id, group_id));
    }

    const updatedGroup = (await db.select().from(groups).where(eq(groups.id, group_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { group: updatedGroup },
    });
  } catch (error: any) {
    console.error("Group action error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
