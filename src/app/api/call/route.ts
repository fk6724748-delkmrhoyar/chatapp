import { NextResponse } from "next/server";
import { db } from "@/db";
import { calls, users } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "user_id is required." } },
        { status: 400 }
      );
    }

    const allCalls = await db
      .select()
      .from(calls)
      .where(or(eq(calls.caller_id, userId), eq(calls.callee_id, userId)))
      .orderBy(desc(calls.created_at));

    const userIds = Array.from(
      new Set(allCalls.flatMap((c) => [c.caller_id, c.callee_id]))
    );
    const allUsers = await db.select().from(users);
    const userMap = new Map<string, typeof allUsers[0]>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    const formattedCalls = allCalls.map((c) => {
      const isCaller = c.caller_id === userId;
      const otherId = isCaller ? c.callee_id : c.caller_id;
      const otherUser = userMap.get(otherId);

      return {
        ...c,
        is_outgoing: isCaller,
        other_user: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              photo_url: otherUser.photo_url,
              phone: otherUser.phone,
            }
          : { id: otherId, name: "Unknown", photo_url: null, phone: "" },
      };
    });

    return NextResponse.json({
      success: true,
      data: { calls: formattedCalls },
    });
  } catch (error: any) {
    console.error("Fetch call history error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caller_id, callee_id, type = "voice", sdp_offer } = body;

    if (!caller_id || !callee_id) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "caller_id and callee_id required." } },
        { status: 400 }
      );
    }

    const callId = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newCall = {
      id: callId,
      caller_id,
      callee_id,
      type,
      status: "calling" as const,
      duration_seconds: 0,
      sdp_offer: sdp_offer || null,
      sdp_answer: null,
      ice_candidates: [],
      created_at: new Date(),
    };

    await db.insert(calls).values(newCall);

    return NextResponse.json({
      success: true,
      data: { call: newCall },
    });
  } catch (error: any) {
    console.error("Initiate call error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
