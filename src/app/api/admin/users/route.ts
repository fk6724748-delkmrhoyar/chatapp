import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, adminLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const planFilter = searchParams.get("plan");
    const statusFilter = searchParams.get("status");

    let userList = await db.select().from(users);

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      userList = userList.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    if (planFilter && planFilter !== "all") {
      userList = userList.filter((u) => u.plan === planFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      userList = userList.filter((u) => u.status === statusFilter);
    }

    return NextResponse.json({
      success: true,
      data: { users: userList },
    });
  } catch (error: any) {
    console.error("Admin user list error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, admin_id = "admin_1", user_id, plan, badges, status, ban_reason, name, phone, about } = body;

    if (!action || !user_id) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "action and user_id required." } }, { status: 400 });
    }

    const targetUser = (await db.select().from(users).where(eq(users.id, user_id)).limit(1))[0];
    if (!targetUser) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 });
    }

    if (action === "change_plan" && plan) {
      await db.update(users).set({ plan }).where(eq(users.id, user_id));
    } else if (action === "update_badges" && Array.isArray(badges)) {
      await db.update(users).set({ badges }).where(eq(users.id, user_id));
    } else if (action === "ban") {
      await db
        .update(users)
        .set({ status: "banned", ban_reason: ban_reason || "Banned by administrator" })
        .where(eq(users.id, user_id));
    } else if (action === "unban") {
      await db.update(users).set({ status: "active", ban_reason: null }).where(eq(users.id, user_id));
    } else if (action === "edit_details") {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (about) updateData.about = about;
      await db.update(users).set(updateData).where(eq(users.id, user_id));
    } else if (action === "delete") {
      await db.delete(users).where(eq(users.id, user_id));
      return NextResponse.json({ success: true, data: { deleted_user_id: user_id } });
    }

    // Log admin audit action
    await db.insert(adminLogs).values({
      id: `log_${Date.now()}`,
      admin_id,
      action: `user_${action}`,
      target_type: "user",
      target_id: user_id,
      details: { action, plan, badges, status, ban_reason },
      timestamp: new Date(),
    });

    const updatedUser = (await db.select().from(users).where(eq(users.id, user_id)).limit(1))[0] || null;

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
