import { NextResponse } from "next/server";
import { isFeatureEnabledForUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user_id, prompt, style } = body;

    if (!user_id || !prompt) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "user_id and prompt required." } }, { status: 400 });
    }

    if (action === "ai_chat") {
      const hasPermission = await isFeatureEnabledForUser("ai_assistant", user_id);
      if (!hasPermission) {
        return NextResponse.json({ success: false, error: { code: "FEATURE_LOCKED", message: "AI Assistant requires Pro Plan." } }, { status: 403 });
      }

      const p = prompt.toLowerCase();
      let aiResponse = "I am your AI Assistant! I can help draft messages, analyze text, summarize chats, or answer questions.";

      if (p.includes("hello") || p.includes("hi")) {
        aiResponse = "Hello! 👋 How can I assist you with your messaging today?";
      } else if (p.includes("write") || p.includes("draft")) {
        aiResponse = `Here's a draft response for you:\n\n"Hi there! Thanks for reaching out. ${prompt}. Let's stay in touch!"`;
      } else if (p.includes("translate")) {
        aiResponse = `Translation preview:\n\nSpanish: "¡Hola! Gracias por contactarme."\nFrench: "Bonjour! Merci de m'avoir contacté."`;
      } else if (p.includes("business") || p.includes("sale")) {
        aiResponse = "Pro Tip: You can create Quick Replies under Business Settings using /shortcut to answer FAQs instantly!";
      }

      return NextResponse.json({
        success: true,
        data: { response: aiResponse },
      });
    }

    if (action === "ai_image") {
      const hasPermission = await isFeatureEnabledForUser("ai_image_generator", user_id);
      if (!hasPermission) {
        return NextResponse.json({ success: false, error: { code: "FEATURE_LOCKED", message: "AI Image Generator requires Pro Plan." } }, { status: 403 });
      }

      // Return high-quality Unsplash image matching style or query
      const imagesByStyle: Record<string, string[]> = {
        Realistic: [
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        ],
        Cartoon: [
          "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        ],
        "3D": [
          "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        ],
      };

      const selectedList = imagesByStyle[style] || imagesByStyle.Realistic;
      const imageUrl = selectedList[Math.floor(Math.random() * selectedList.length)];

      return NextResponse.json({
        success: true,
        data: { image_url: imageUrl, prompt, style },
      });
    }

    return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Invalid action." } }, { status: 400 });
  } catch (error: any) {
    console.error("AI action error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
