import { db } from "./index";
import {
  users,
  plans,
  featureFlags,
  appSettings,
  adminUsers,
  themes,
  businessProfiles,
  catalogProducts,
  statuses,
  messages,
} from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // 1. Seed App Settings
    const existingSettings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, "default"));
    if (existingSettings.length === 0) {
      await db.insert(appSettings).values({
        id: "default",
        app_name: "WhatsApp",
        logo_url: "/images/whatsapp-logo.svg",
        primary_color: "#075E54",
        max_upload_mb: { free: 16, business: 32, pro: 100 },
        allowed_file_types: ["jpg", "jpeg", "png", "gif", "mp4", "pdf", "docx", "mp3", "zip"],
        maintenance_mode: false,
        maintenance_message: "System is undergoing scheduled maintenance.",
        default_language: "en",
        session_timeout_minutes: 10080,
        max_linked_devices: 4,
        payment_accounts: {
          jazzcash: { number: "03001234567", title: "WhatsApp Admin JazzCash" },
          easypaisa: { number: "03119876543", title: "WhatsApp Admin EasyPaisa" },
          bank: {
            bank_name: "Meezan Bank Ltd",
            account_title: "WhatsApp Platform Enterprise",
            account_number: "01010102938481",
            iban: "PK36MEZN0001010102938481",
          },
        },
      });
    }

    // 2. Seed Admin User
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, "admin"));
    if (existingAdmin.length === 0) {
      await db.insert(adminUsers).values({
        id: "admin_1",
        username: "admin",
        password_hash: "admin123", // Simple hash for demo
        role: "super_admin",
        permissions: ["all"],
      });
    }

    // 3. Seed Plans
    const existingPlans = await db.select().from(plans);
    if (existingPlans.length === 0) {
      await db.insert(plans).values([
        { id: "free", name: "Free Plan", price: 0, billing_cycle: "none", trial_days: 0 },
        { id: "business", name: "Business Tier", price: 500, billing_cycle: "monthly", trial_days: 7 },
        { id: "pro", name: "Pro Mod Tier", price: 1200, billing_cycle: "monthly", trial_days: 7 },
      ]);
    }

    // 4. Seed Feature Flags
    const existingFlags = await db.select().from(featureFlags);
    if (existingFlags.length === 0) {
      await db.insert(featureFlags).values([
        {
          key: "ghost_mode",
          category: "privacy",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Browse invisibly: disables online status, last seen, typing, and recording indicators all at once.",
        },
        {
          key: "anti_delete_messages",
          category: "privacy",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "See messages even after the sender deletes them for everyone.",
        },
        {
          key: "anti_delete_status",
          category: "privacy",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "View expired or deleted statuses from contacts.",
        },
        {
          key: "anti_view_once",
          category: "privacy",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Automatically save view-once photos/videos when opened.",
        },
        {
          key: "disable_forwarded_tag",
          category: "privacy",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Forwarded messages you send will not show the Forwarded label.",
        },
        {
          key: "theme_store",
          category: "customization",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Access full Theme Store and custom CSS color picker builder.",
        },
        {
          key: "custom_chat_tabs",
          category: "customization",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Filter chats with All / Unread / Groups / Favorites chips.",
        },
        {
          key: "message_scheduler",
          category: "messaging",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Schedule messages to send automatically at future dates.",
        },
        {
          key: "auto_reply",
          category: "messaging",
          scope: "plan",
          enabled: true,
          enabled_for: ["business", "pro"],
          user_overrides: {},
          description: "Automated keyword and offline replies for messages.",
        },
        {
          key: "bulk_broadcast",
          category: "messaging",
          scope: "plan",
          enabled: true,
          enabled_for: ["business", "pro"],
          user_overrides: {},
          description: "Send broadcast messages to mass contact lists.",
        },
        {
          key: "message_translation",
          category: "messaging",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Auto-translate incoming and outgoing chat messages.",
        },
        {
          key: "ai_assistant",
          category: "ai",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Pinned AI Chat Assistant thread for quick answers and task help.",
        },
        {
          key: "ai_image_generator",
          category: "ai",
          scope: "plan",
          enabled: true,
          enabled_for: ["pro"],
          user_overrides: {},
          description: "Generate images with AI directly inside chat.",
        },
        {
          key: "business_tools",
          category: "business",
          scope: "plan",
          enabled: true,
          enabled_for: ["business", "pro"],
          user_overrides: {},
          description: "Catalog, Quick Replies, Away/Greeting Messages, Analytics.",
        },
      ]);
    }

    // 5. Seed Themes
    const existingThemes = await db.select().from(themes);
    if (existingThemes.length === 0) {
      await db.insert(themes).values([
        {
          id: "default",
          name: "WhatsApp Emerald",
          category: "Minimal",
          colors: {
            primary: "#075E54",
            accent: "#25D366",
            bubble_sent: "#DCF8C6",
            bubble_received: "#FFFFFF",
            background: "#ECE5DD",
            header_text: "#FFFFFF",
          },
          font: "system-ui",
          approved: true,
          uploaded_by: "system",
        },
        {
          id: "dark_oled",
          name: "OLED Midnight",
          category: "Dark",
          colors: {
            primary: "#1F2C34",
            accent: "#00A884",
            bubble_sent: "#005C4B",
            bubble_received: "#202C33",
            background: "#0B141A",
            header_text: "#E9EDEF",
          },
          font: "Roboto, sans-serif",
          approved: true,
          uploaded_by: "system",
        },
        {
          id: "ios_glass",
          name: "iOS Modern Glass",
          category: "iOS-Style",
          colors: {
            primary: "#007AFF",
            accent: "#34C759",
            bubble_sent: "#34C759",
            bubble_received: "#E9E9EB",
            background: "#F2F2F7",
            header_text: "#FFFFFF",
          },
          font: "-apple-system, BlinkMacSystemFont, sans-serif",
          approved: true,
          uploaded_by: "system",
        },
        {
          id: "cyberpunk_neon",
          name: "Cyberpunk Glow",
          category: "Colorful",
          colors: {
            primary: "#2D006B",
            accent: "#FF007F",
            bubble_sent: "#3D0099",
            bubble_received: "#1A0033",
            background: "#0A0014",
            header_text: "#00FFFF",
          },
          font: "monospace",
          approved: true,
          uploaded_by: "system",
        },
      ]);
    }

    // 6. Seed Sample Users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      await db.insert(users).values([
        {
          id: "u_ai_bot",
          phone: "+00000000000",
          name: "AI Assistant",
          about: "Your personal WhatsApp AI Bot 🤖",
          photo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
          is_business: false,
          plan: "pro",
          badges: ["verified"],
          status: "active",
        },
        {
          id: "u_sarah",
          phone: "+923001112233",
          name: "Sarah Connor",
          about: "Living life one coffee at a time ☕",
          photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          is_business: false,
          plan: "pro",
          badges: ["verified"],
          status: "active",
        },
        {
          id: "u_techmart",
          phone: "+923004445566",
          name: "TechMart Electronics",
          about: "Official TechMart Store - Gadgets & Accessories 📱💻",
          photo_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
          is_business: true,
          plan: "business",
          badges: ["business"],
          status: "active",
        },
        {
          id: "u_alex",
          phone: "+923007778899",
          name: "Alex Rivera",
          about: "Hey there! I am using WhatsApp Clone",
          photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          is_business: false,
          plan: "free",
          badges: [],
          status: "active",
        },
      ]);

      // Business Profile for TechMart
      await db.insert(businessProfiles).values({
        user_id: "u_techmart",
        category: "Electronics & Gadgets",
        address: "123 Innovation Boulevard, Suite 400, Tech City",
        website: "https://techmart.example.com",
        email: "support@techmart.example.com",
        business_hours: {
          monday: { open: "09:00", close: "18:00", closed: false },
          tuesday: { open: "09:00", close: "18:00", closed: false },
          wednesday: { open: "09:00", close: "18:00", closed: false },
          thursday: { open: "09:00", close: "18:00", closed: false },
          friday: { open: "09:00", close: "18:00", closed: false },
          saturday: { open: "10:00", close: "16:00", closed: false },
          sunday: { open: "10:00", close: "16:00", closed: true },
        },
        quick_replies: [
          { id: "qr_1", shortcut: "hours", message: "We are open Mon-Fri 9 AM to 6 PM, Sat 10 AM to 4 PM!" },
          { id: "qr_2", shortcut: "shipping", message: "Standard delivery takes 2-3 business days across Pakistan." },
          { id: "qr_3", shortcut: "catalog", message: "Check out our full product catalog right here in our business profile!" },
        ],
        greeting_message: {
          enabled: true,
          text: "Welcome to TechMart Electronics! 🚀 How can we assist you with your tech needs today?",
          inactivity_hours: 24,
        },
        away_message: {
          enabled: true,
          text: "Thanks for messaging TechMart! We are currently closed, but will reply first thing tomorrow morning.",
          schedule: "outside_hours",
          audience: "everyone",
        },
        labels: [
          { id: "lbl_new", name: "New Lead", color: "#3B82F6" },
          { id: "lbl_vip", name: "VIP Customer", color: "#8B5CF6" },
          { id: "lbl_pending", name: "Pending Order", color: "#F59E0B" },
        ],
      });

      // Products for TechMart
      await db.insert(catalogProducts).values([
        {
          id: "prod_1",
          user_id: "u_techmart",
          name: "Wireless ANC Headphones",
          price: 4999,
          description: "Active Noise Cancelling Bluetooth 5.3 Over-Ear Headphones with 40h battery life.",
          image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
          collection: "Audio",
          is_available: true,
        },
        {
          id: "prod_2",
          user_id: "u_techmart",
          name: "Ultra Smartwatch Pro v2",
          price: 7999,
          description: "AMOLED Display, Heart Rate & SpO2 Monitor, GPS, 100+ Sports Modes.",
          image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
          collection: "Wearables",
          is_available: true,
        },
      ]);

      // Sample Statuses
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await db.insert(statuses).values([
        {
          id: "stat_1",
          user_id: "u_sarah",
          type: "text",
          content: "Weekend trip to the mountains! 🏔️✨ Who's coming?",
          background_color: "#075E54",
          created_at: now,
          expires_at: tomorrow,
        },
        {
          id: "stat_2",
          user_id: "u_techmart",
          type: "image",
          content: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
          caption: "🔥 FLASH SALE: 20% OFF ANC Headphones today only! Use code TECH20",
          background_color: "#1F2C34",
          created_at: now,
          expires_at: tomorrow,
        },
      ]);

      // Sample Messages (in conversation with Alex Rivera)
      await db.insert(messages).values([
        {
          id: "m_1",
          chat_id: "c_u_alex_u_sarah",
          sender_id: "u_sarah",
          type: "text",
          content: "Hey Alex! Did you see the new WhatsApp update?",
          status: "read",
          created_at: new Date(now.getTime() - 3600 * 1000 * 3),
        },
        {
          id: "m_2",
          chat_id: "c_u_alex_u_sarah",
          sender_id: "u_alex",
          type: "text",
          content: "Yeah! The Pro mod tools and Ghost Mode look incredible 🔥",
          status: "read",
          created_at: new Date(now.getTime() - 3600 * 1000 * 2.5),
        },
        {
          id: "m_3",
          chat_id: "c_u_alex_u_sarah",
          sender_id: "u_sarah",
          type: "image",
          content: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
          media_meta: { caption: "Check out this mountain view!" },
          status: "read",
          created_at: new Date(now.getTime() - 3600 * 1000 * 2),
        },
        {
          id: "m_4",
          chat_id: "c_u_alex_u_techmart",
          sender_id: "u_techmart",
          type: "text",
          content: "Welcome to TechMart Electronics! 🚀 How can we assist you with your tech needs today?",
          status: "read",
          created_at: new Date(now.getTime() - 3600 * 1000 * 5),
        },
      ]);
    }

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
