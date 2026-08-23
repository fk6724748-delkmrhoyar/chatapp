import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, name, about, photo_url, privacy, settings, is_business, phone } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "User ID required." } },
        { status: 400 }
      );
    }

    const existingUsers = await db.select().from(users).where(eq(users.id, user_id)).limit(1);
    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User account not found." } },
        { status: 404 }
      );
    }

    const current = existingUsers[0];
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim().substring(0, 25);
    if (about !== undefined) updateData.about = about.trim().substring(0, 139);
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    if (phone !== undefined) updateData.phone = phone.trim();
    if (is_business !== undefined) updateData.is_business = Boolean(is_business);

    if (privacy !== undefined) {
      updateData.privacy = {
        ...current.privacy,
        ...privacy,
      };
    }

    if (settings !== undefined) {
      updateData.settings = {
        ...current.settings,
        ...settings,
      };
    }

    await db.update(users).set(updateData).where(eq(users.id, user_id));
    const updatedUser = (await db.select().from(users).where(eq(users.id, user_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update profile." } },
      { status: 500 }
    );
  }
}
