import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, appSettings, adminLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const paymentList = await db.select().from(payments).orderBy(desc(payments.submitted_at));
    const allUsers = await db.select().from(users);
    const userMap = new Map<string, typeof allUsers[0]>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    const enriched = paymentList.map((p) => {
      const u = userMap.get(p.user_id);
      return {
        ...p,
        user_name: u ? u.name : "Unknown",
        user_phone: u ? u.phone : "",
      };
    });

    return NextResponse.json({
      success: true,
      data: { payments: enriched },
    });
  } catch (error: any) {
    console.error("Admin fetch payments error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payment_id, admin_id = "admin_1", reason, payment_accounts } = body;

    if (action === "update_payment_accounts" && payment_accounts) {
      await db
        .update(appSettings)
        .set({ payment_accounts })
        .where(eq(appSettings.id, "default"));

      return NextResponse.json({ success: true, data: { payment_accounts } });
    }

    if (!payment_id || !action) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "payment_id and action required." } }, { status: 400 });
    }

    const payObj = (await db.select().from(payments).where(eq(payments.id, payment_id)).limit(1))[0];
    if (!payObj) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Payment record not found." } }, { status: 404 });
    }

    if (action === "approve") {
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days plan

      await db
        .update(payments)
        .set({
          status: "approved",
          reviewed_by: admin_id,
          reviewed_at: now,
        })
        .where(eq(payments.id, payment_id));

      // Auto upgrade user plan
      await db
        .update(users)
        .set({
          plan: payObj.plan_id,
          plan_expiry: expiry,
        })
        .where(eq(users.id, payObj.user_id));
    } else if (action === "reject") {
      await db
        .update(payments)
        .set({
          status: "rejected",
          reason: reason || "Proof of payment could not be verified.",
          reviewed_by: admin_id,
          reviewed_at: new Date(),
        })
        .where(eq(payments.id, payment_id));
    }

    // Log admin action
    await db.insert(adminLogs).values({
      id: `log_${Date.now()}`,
      admin_id,
      action: `payment_${action}`,
      target_type: "payment",
      target_id: payment_id,
      details: { action, user_id: payObj.user_id, plan_id: payObj.plan_id, reason },
      timestamp: new Date(),
    });

    const updatedPayment = (await db.select().from(payments).where(eq(payments.id, payment_id)).limit(1))[0];

    return NextResponse.json({
      success: true,
      data: { payment: updatedPayment },
    });
  } catch (error: any) {
    console.error("Admin payment review error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
