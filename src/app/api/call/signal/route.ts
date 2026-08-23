import { NextResponse } from "next/server";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { call_id, action, sdp_answer, ice_candidate, from_id, duration_seconds } = body;

    if (!call_id || !action) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "call_id and action required." } },
        { status: 400 }
      );
    }

    const callResult = await db.select().from(calls).where(eq(calls.id, call_id)).limit(1);
    if (callResult.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Call not found." } }, { status: 404 });
    }

    const callObj = callResult[0];

    if (action === "answer" && sdp_answer) {
      await db
        .update(calls)
        .set({ status: "ongoing", sdp_answer })
        .where(eq(calls.id, call_id));
    } else if (action === "ice" && ice_candidate && from_id) {
      const candidates = callObj.ice_candidates || [];
      candidates.push({ from: from_id, candidate: ice_candidate });
      await db.update(calls).set({ ice_candidates: candidates }).where(eq(calls.id, call_id));
    } else if (action === "decline") {
      await db.update(calls).set({ status: "declined" }).where(eq(calls.id, call_id));
    } else if (action === "end") {
      await db
        .update(calls)
        .set({ status: "completed", duration_seconds: duration_seconds || 0 })
        .where(eq(calls.id, call_id));
    }

    const updatedCall = (await db.select().from(calls).where(eq(calls.id, call_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { call: updatedCall },
    });
  } catch (error: any) {
    console.error("Call signal error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
