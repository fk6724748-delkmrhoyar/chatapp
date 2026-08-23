import { NextResponse } from "next/server";
import { db } from "@/db";
import { statuses, users } from "@/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import { isFeatureEnabledForUser } from "@/lib/auth";

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

    const hasAntiDeleteStatus = await isFeatureEnabledForUser("anti_delete_status", userId);
    const now = new Date();

    // Fetch active statuses (or expired if Pro user has Anti-Delete Status enabled)
    let allStatuses = await db.select().from(statuses).orderBy(desc(statuses.created_at));

    if (!hasAntiDeleteStatus) {
      allStatuses = allStatuses.filter((s) => new Date(s.expires_at) > now);
    }

    // Fetch user details for each status owner
    const userIds = Array.from(new Set(allStatuses.map((s) => s.user_id)));
    const allUsers = await db.select().from(users);
    const userMap = new Map<string, typeof allUsers[0]>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Group statuses by user
    const groupedByUser = new Map<string, typeof allStatuses>();
    allStatuses.forEach((stat) => {
      if (!groupedByUser.has(stat.user_id)) {
        groupedByUser.set(stat.user_id, []);
      }
      groupedByUser.get(stat.user_id)!.push(stat);
    });

    const statusList: any[] = [];
    groupedByUser.forEach((items, uId) => {
      const u = userMap.get(uId);
      if (!u) return;

      const hasUnviewed = items.some((item) =>
        !(item.viewers || []).some((v) => v.user_id === userId)
      );

      statusList.push({
        user: {
          id: u.id,
          name: u.name,
          photo_url: u.photo_url,
          is_me: u.id === userId,
        },
        has_unviewed: hasUnviewed,
        items,
      });
    });

    // Sort statusList: My status first, then by most recent item date
    statusList.sort((a, b) => {
      if (a.user.is_me) return -1;
      if (b.user.is_me) return 1;
      const latestA = new Date(a.items[0]?.created_at || 0).getTime();
      const latestB = new Date(b.items[0]?.created_at || 0).getTime();
      return latestB - latestA;
    });

    return NextResponse.json({
      success: true,
      data: { status_groups: statusList },
    });
  } catch (error: any) {
    console.error("Fetch statuses error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, type = "text", content, background_color, font_style, caption, privacy } = body;

    if (!user_id || !content) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "user_id and content required." } },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours expiry

    const newStatus = {
      id: `s_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id,
      type,
      content,
      background_color: background_color || "#075E54",
      font_style: font_style || "default",
      caption: caption || null,
      viewers: [],
      likes: [],
      replies: [],
      privacy: privacy || "contacts",
      except_ids: [],
      created_at: now,
      expires_at: expiresAt,
    };

    await db.insert(statuses).values(newStatus);

    return NextResponse.json({
      success: true,
      data: { status: newStatus },
    });
  } catch (error: any) {
    console.error("Post status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
