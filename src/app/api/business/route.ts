import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessProfiles, users, catalogProducts, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "user_id required." } }, { status: 400 });
    }

    const profile = (await db.select().from(businessProfiles).where(eq(businessProfiles.user_id, userId)).limit(1))[0] || null;
    const products = await db.select().from(catalogProducts).where(eq(catalogProducts.user_id, userId));

    // Analytics computation
    const allMsgs = await db.select().from(messages);
    const sentByMe = allMsgs.filter((m) => m.sender_id === userId);
    const readByOthers = sentByMe.filter((m) => m.status === "read");

    const analytics = {
      messages_sent: sentByMe.length,
      messages_delivered: sentByMe.filter((m) => m.status === "delivered" || m.status === "read").length,
      messages_read: readByOthers.length,
      read_rate_pct: sentByMe.length > 0 ? Math.round((readByOthers.length / sentByMe.length) * 100) : 100,
    };

    return NextResponse.json({
      success: true,
      data: {
        profile,
        products,
        analytics,
      },
    });
  } catch (error: any) {
    console.error("Fetch business profile error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, category, address, website, email, business_hours, quick_replies, greeting_message, away_message, labels } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "user_id required." } }, { status: 400 });
    }

    const existing = await db.select().from(businessProfiles).where(eq(businessProfiles.user_id, user_id)).limit(1);

    const data: any = {};
    if (category !== undefined) data.category = category;
    if (address !== undefined) data.address = address;
    if (website !== undefined) data.website = website;
    if (email !== undefined) data.email = email;
    if (business_hours !== undefined) data.business_hours = business_hours;
    if (quick_replies !== undefined) data.quick_replies = quick_replies;
    if (greeting_message !== undefined) data.greeting_message = greeting_message;
    if (away_message !== undefined) data.away_message = away_message;
    if (labels !== undefined) data.labels = labels;

    if (existing.length === 0) {
      await db.insert(businessProfiles).values({
        user_id,
        category: category || "General Business",
        address: address || "",
        website: website || "",
        email: email || "",
        business_hours: business_hours || {},
        quick_replies: quick_replies || [],
        greeting_message: greeting_message || { enabled: true, text: "Hello! How can we help?", inactivity_hours: 24 },
        away_message: away_message || { enabled: false, text: "We are currently away.", schedule: "always", audience: "everyone" },
        labels: labels || [],
      });
    } else {
      await db.update(businessProfiles).set(data).where(eq(businessProfiles.user_id, user_id));
    }

    const updatedProfile = (await db.select().from(businessProfiles).where(eq(businessProfiles.user_id, user_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { profile: updatedProfile },
    });
  } catch (error: any) {
    console.error("Update business profile error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
