import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, businessProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, name, about, photo_url, is_business } = body;

    if (!user_id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name is required." } },
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

    const user = existingUsers[0];
    const updateData: any = {
      name: name.trim().substring(0, 25),
      about: (about || "Hey there! I am using WhatsApp Clone").trim().substring(0, 139),
      photo_url: photo_url || null,
      is_business: Boolean(is_business),
    };

    // Add business badge if business enabled
    if (is_business && !user.badges.includes("business")) {
      updateData.badges = [...user.badges, "business"];
    }

    await db.update(users).set(updateData).where(eq(users.id, user_id));

    if (is_business) {
      const bizProfile = await db.select().from(businessProfiles).where(eq(businessProfiles.user_id, user_id)).limit(1);
      if (bizProfile.length === 0) {
        await db.insert(businessProfiles).values({
          user_id,
          category: "General Business",
          address: "",
          website: "",
          email: "",
          business_hours: {},
          quick_replies: [],
          greeting_message: {
            enabled: true,
            text: "Hello! Thank you for contacting us. How can we help you?",
            inactivity_hours: 24,
          },
          away_message: {
            enabled: false,
            text: "We are away right now. We will respond as soon as possible!",
            schedule: "always",
            audience: "everyone",
          },
          labels: [
            { id: "lbl_new", name: "New Lead", color: "#3B82F6" },
            { id: "lbl_pending", name: "Pending", color: "#F59E0B" },
          ],
        });
      }
    }

    const updatedUser = (await db.select().from(users).where(eq(users.id, user_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error("Profile setup error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to setup profile." } },
      { status: 500 }
    );
  }
}
