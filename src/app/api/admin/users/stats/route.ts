import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, payments, messages, reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    const allPayments = await db.select().from(payments);
    const allMessages = await db.select().from(messages);
    const allReports = await db.select().from(reports);

    const totalUsers = allUsers.length;
    const freeCount = allUsers.filter((u) => u.plan === "free").length;
    const businessCount = allUsers.filter((u) => u.plan === "business").length;
    const proCount = allUsers.filter((u) => u.plan === "pro").length;

    const pendingPayments = allPayments.filter((p) => p.status === "pending");
    const approvedPayments = allPayments.filter((p) => p.status === "approved");

    // Total revenue from approved payments
    const totalRevenue = approvedPayments.reduce((acc, p) => {
      const planCost = p.plan_id === "pro" ? 1200 : p.plan_id === "business" ? 500 : 0;
      return acc + planCost;
    }, 0);

    const todayMs = new Date().setHours(0, 0, 0, 0);
    const msgsToday = allMessages.filter((m) => new Date(m.created_at).getTime() >= todayMs).length;
    const activeToday = allUsers.filter((u) => new Date(u.last_seen_at).getTime() >= todayMs).length;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total_users: totalUsers,
          free_users: freeCount,
          business_users: businessCount,
          pro_users: proCount,
          total_revenue: totalRevenue,
          pending_payments_count: pendingPayments.length,
          messages_today: msgsToday,
          active_users_today: activeToday,
          open_reports_count: allReports.filter((r) => r.status === "pending").length,
          storage_used_mb: Math.round(allMessages.length * 0.15 + allUsers.length * 0.5),
        },
      },
    });
  } catch (error: any) {
    console.error("Fetch admin stats error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
