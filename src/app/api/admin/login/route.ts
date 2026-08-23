import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Username and password required." } },
        { status: 400 }
      );
    }

    const admin = (await db.select().from(adminUsers).where(eq(adminUsers.username, username.trim())).limit(1))[0];

    if (!admin || admin.password_hash !== password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid admin username or password." } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          permissions: admin.permissions,
        },
      },
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
