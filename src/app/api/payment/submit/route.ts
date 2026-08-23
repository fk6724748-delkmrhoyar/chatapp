import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, plan_id, method, transaction_id, proof_url, note } = body;

    if (!user_id || !plan_id || !method || !transaction_id || !proof_url) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "All payment verification fields are required." } },
        { status: 400 }
      );
    }

    const payId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newPayment = {
      id: payId,
      user_id,
      plan_id,
      method,
      transaction_id: transaction_id.trim(),
      proof_url: proof_url.trim(),
      note: note ? note.trim() : null,
      status: "pending" as const,
      reason: null,
      submitted_at: new Date(),
      reviewed_by: null,
      reviewed_at: null,
    };

    await db.insert(payments).values(newPayment);

    return NextResponse.json({
      success: true,
      data: { payment: newPayment },
    });
  } catch (error: any) {
    console.error("Submit payment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "AUTH_REQUIRED", message: "user_id required." } }, { status: 400 });
    }

    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.user_id, userId))
      .orderBy(desc(payments.submitted_at));

    return NextResponse.json({
      success: true,
      data: { payments: userPayments },
    });
  } catch (error: any) {
    console.error("Fetch payment status error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
