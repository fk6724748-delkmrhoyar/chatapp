import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, businessProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { phone, is_business_intent } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Phone number is required." } },
        { status: 400 }
      );
    }

    // Clean phone string
    phone = phone.trim();
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    // Lookup user in DB
    const existingUsers = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      if (user.status === "banned") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "USER_BANNED",
              message: `This account has been banned. Reason: ${user.ban_reason || "Violation of terms"}`,
            },
          },
          { status: 403 }
        );
      }

      // Update last seen
      await db.update(users).set({ last_seen_at: new Date() }).where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        data: {
          is_new_user: false,
          user,
        },
      });
    }

    // Create new user instantly (No OTP verification performed)
    const userId = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const newUser = {
      id: userId,
      phone,
      name: "", // Will be filled in profile setup
      about: "Hey there! I am using WhatsApp Clone",
      photo_url: null,
      is_business: Boolean(is_business_intent),
      plan: "free",
      badges: [],
      privacy: {
        last_seen: "everyone" as const,
        except_list: [],
        profile_photo: "everyone" as const,
        about: "everyone" as const,
        read_receipts: true,
        groups_add: "everyone" as const,
        ghost_mode: false,
        hide_online: false,
        freeze_last_seen: false,
        hide_blue_tick: false,
        hide_second_tick: false,
        hide_typing: false,
        hide_recording: false,
        hide_status_views: false,
        per_contact_overrides: {},
        silence_unknown_callers: false,
        blocked_calls: [],
      },
      settings: {
        theme_id: "default",
        font_size: "medium" as const,
        notification_prefs: {},
        auto_download: {},
        linked_devices: [],
      },
      status: "active",
      created_at: new Date(),
      last_seen_at: new Date(),
    };

    await db.insert(users).values(newUser);

    if (is_business_intent) {
      await db.insert(businessProfiles).values({
        user_id: userId,
        category: "General Business",
        address: "",
        website: "",
        email: "",
        business_hours: {},
        quick_replies: [],
        greeting_message: {
          enabled: true,
          text: "Hello! Thanks for contacting us. How can we help you?",
          inactivity_hours: 24,
        },
        away_message: {
          enabled: false,
          text: "We are currently unavailable. We will get back to you soon!",
          schedule: "always",
          audience: "everyone",
        },
        labels: [
          { id: "lbl_new", name: "New Lead", color: "#3B82F6" },
          { id: "lbl_pending", name: "Pending", color: "#F59E0B" },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        is_new_user: true,
        user: newUser,
      },
    });
  } catch (error: any) {
    console.error("Auth lookup error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to process phone login." } },
      { status: 500 }
    );
  }
}
