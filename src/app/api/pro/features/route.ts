import { NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledMessages, autoReplies, themes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isFeatureEnabledForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "AUTH_REQUIRED", message: "user_id is required." } }, { status: 400 });
    }

    const scheduled = await db.select().from(scheduledMessages).where(eq(scheduledMessages.user_id, userId));
    const replies = await db.select().from(autoReplies).where(eq(autoReplies.user_id, userId));
    const themeList = await db.select().from(themes).where(eq(themes.approved, true));

    return NextResponse.json({
      success: true,
      data: {
        scheduled_messages: scheduled,
        auto_replies: replies,
        themes: themeList,
      },
    });
  } catch (error: any) {
    console.error("Pro features fetch error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user_id, chat_id, content, send_at, repeat, rule_id, trigger_type, keyword, response, enabled, theme_data } = body;

    if (!action || !user_id) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "action and user_id required." } }, { status: 400 });
    }

    // Schedule message
    if (action === "schedule_message") {
      const hasPermission = await isFeatureEnabledForUser("message_scheduler", user_id);
      if (!hasPermission) {
        return NextResponse.json({ success: false, error: { code: "FEATURE_LOCKED", message: "Message Scheduler requires Pro Plan." } }, { status: 403 });
      }

      const newScheduled = {
        id: `sch_${Date.now()}`,
        user_id,
        chat_id,
        content,
        type: "text",
        send_at: new Date(send_at),
        repeat: repeat || "none",
        status: "pending" as const,
        created_at: new Date(),
      };

      await db.insert(scheduledMessages).values(newScheduled);
      return NextResponse.json({ success: true, data: { scheduled: newScheduled } });
    }

    // Auto-Reply rules
    if (action === "add_auto_reply") {
      const newRule = {
        id: `rule_${Date.now()}`,
        user_id,
        trigger_type: trigger_type || "contains",
        keyword: keyword || null,
        response,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        created_at: new Date(),
      };

      await db.insert(autoReplies).values(newRule);
      return NextResponse.json({ success: true, data: { rule: newRule } });
    }

    if (action === "toggle_auto_reply" && rule_id) {
      await db.update(autoReplies).set({ enabled: Boolean(enabled) }).where(eq(autoReplies.id, rule_id));
      return NextResponse.json({ success: true, data: { rule_id, enabled } });
    }

    if (action === "delete_auto_reply" && rule_id) {
      await db.delete(autoReplies).where(eq(autoReplies.id, rule_id));
      return NextResponse.json({ success: true, data: { deleted_rule_id: rule_id } });
    }

    // Apply / Upload Custom Theme
    if (action === "apply_theme" && theme_data) {
      const hasPermission = await isFeatureEnabledForUser("theme_store", user_id);
      if (!hasPermission) {
        return NextResponse.json({ success: false, error: { code: "FEATURE_LOCKED", message: "Theme customization requires Pro Plan." } }, { status: 403 });
      }

      // Update user's settings.theme_id or custom_theme
      const user = (await db.select().from(users).where(eq(users.id, user_id)).limit(1))[0];
      if (user) {
        const settings = user.settings || {};
        await db
          .update(users)
          .set({
            settings: {
              ...settings,
              theme_id: theme_data.id || "custom",
              custom_theme: theme_data.colors ? theme_data.colors : undefined,
              font_size: theme_data.font_size || settings.font_size || "medium",
              bubble_style: theme_data.bubble_style || settings.bubble_style,
              tick_style: theme_data.tick_style || settings.tick_style,
            },
          })
          .where(eq(users.id, user_id));
      }

      return NextResponse.json({ success: true, data: { applied_theme: theme_data } });
    }

    return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Invalid action." } }, { status: 400 });
  } catch (error: any) {
    console.error("Pro feature action error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
