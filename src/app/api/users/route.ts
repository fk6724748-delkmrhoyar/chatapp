import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ne, like, or } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("current_user_id");
    const query = searchParams.get("q");

    let allUsers = await db.select().from(users);

    // Filter out current user & AI Bot if needed
    if (currentUserId) {
      allUsers = allUsers.filter((u) => u.id !== currentUserId);
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      allUsers = allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          (u.about && u.about.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      data: { users: allUsers },
    });
  } catch (error: any) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
