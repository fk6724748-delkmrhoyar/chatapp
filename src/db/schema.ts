import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

// 1. Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  about: text("about").default("Hey there! I am using WhatsApp Clone"),
  photo_url: text("photo_url"),
  is_business: boolean("is_business").default(false).notNull(),
  plan: text("plan").default("free").notNull(), // 'free' | 'business' | 'pro'
  plan_expiry: timestamp("plan_expiry"),
  trial_ends_at: timestamp("trial_ends_at"),
  badges: jsonb("badges").$type<string[]>().default([]).notNull(), // ['verified', 'business', 'verified_channel']
  two_step_pin: text("two_step_pin"),
  two_step_recovery_email: text("two_step_recovery_email"),
  privacy: jsonb("privacy").$type<{
    last_seen: "everyone" | "contacts" | "except" | "nobody";
    except_list: string[];
    profile_photo: "everyone" | "contacts" | "except" | "nobody";
    about: "everyone" | "contacts" | "except" | "nobody";
    read_receipts: boolean;
    groups_add: "everyone" | "contacts" | "except";
    ghost_mode: boolean;
    hide_online: boolean;
    freeze_last_seen: boolean;
    hide_blue_tick: boolean;
    hide_second_tick: boolean;
    hide_typing: boolean;
    hide_recording: boolean;
    hide_status_views: boolean;
    per_contact_overrides: Record<string, Record<string, boolean>>;
    silence_unknown_callers: boolean;
    blocked_calls: string[];
  }>().default({
    last_seen: "everyone",
    except_list: [],
    profile_photo: "everyone",
    about: "everyone",
    read_receipts: true,
    groups_add: "everyone",
    ghost_mode: false,
    hide_online: false,
    freeze_last_seen: false,
    hide_blue_tick: false,
    hide_second_tick: false,
    hide_typing: false,
    hide_recording: false,
    hide_status_views: false,
    per_contact_overrides: {},
    silence_unknown_callers: false,
    blocked_calls: [],
  }).notNull(),
  settings: jsonb("settings").$type<{
    theme_id: string;
    custom_theme?: Record<string, string>;
    font_size: "small" | "medium" | "large";
    bubble_style?: string;
    tick_style?: string;
    notification_prefs: Record<string, any>;
    auto_download: Record<string, any>;
    linked_devices: Array<{ device_id: string; name: string; last_active: string }>;
  }>().default({
    theme_id: "default",
    font_size: "medium",
    notification_prefs: {},
    auto_download: {},
    linked_devices: [],
  }).notNull(),
  status: text("status").default("active").notNull(), // 'active' | 'banned'
  ban_reason: text("ban_reason"),
  ban_expires_at: timestamp("ban_expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_seen_at: timestamp("last_seen_at").defaultNow().notNull(),
});

// 2. Plans Table
export const plans = pgTable("plans", {
  id: text("id").primaryKey(), // 'free' | 'business' | 'pro'
  name: text("name").notNull(),
  price: integer("price").notNull(),
  billing_cycle: text("billing_cycle").default("monthly").notNull(), // 'monthly' | 'yearly' | 'lifetime' | 'none'
  trial_days: integer("trial_days").default(0).notNull(),
});

// 3. Feature Flags Table
export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  category: text("category").notNull(),
  scope: text("scope").default("plan").notNull(), // 'global' | 'plan' | 'user'
  enabled: boolean("enabled").default(true).notNull(),
  enabled_for: jsonb("enabled_for").$type<string[]>().default([]).notNull(), // ['pro', 'business']
  user_overrides: jsonb("user_overrides").$type<Record<string, boolean>>().default({}).notNull(),
  description: text("description"),
});

// 4. Payments Table
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  plan_id: text("plan_id").notNull(),
  method: text("method").notNull(), // 'jazzcash' | 'easypaisa' | 'bank'
  transaction_id: text("transaction_id").notNull(),
  proof_url: text("proof_url").notNull(),
  note: text("note"),
  status: text("status").default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  reason: text("reason"),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
  reviewed_by: text("reviewed_by"),
  reviewed_at: timestamp("reviewed_at"),
});

// 5. Chats / Messages Table
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  chat_id: text("chat_id").notNull(), // Format: 'c_user1_user2' or group ID 'g_xxx'
  sender_id: text("sender_id").notNull(),
  type: text("type").default("text").notNull(), // 'text'|'image'|'video'|'document'|'audio'|'location'|'contact'|'poll'
  content: text("content").notNull(),
  media_meta: jsonb("media_meta").$type<Record<string, any>>(),
  poll_data: jsonb("poll_data").$type<{
    question: string;
    options: Array<{ id: string; text: string; votes: string[] }>;
    multiple: boolean;
  }>(),
  reply_to: text("reply_to"),
  forwarded: boolean("forwarded").default(false).notNull(),
  starred_by: jsonb("starred_by").$type<string[]>().default([]).notNull(),
  status: text("status").default("sent").notNull(), // 'sent' | 'delivered' | 'read'
  deleted_for: jsonb("deleted_for").$type<string[]>().default([]).notNull(),
  deleted_for_everyone: boolean("deleted_for_everyone").default(false).notNull(),
  edited: boolean("edited").default(false).notNull(),
  view_once: boolean("view_once").default(false).notNull(),
  view_once_opened_by: jsonb("view_once_opened_by").$type<string[]>().default([]).notNull(),
  reactions: jsonb("reactions").$type<Record<string, string>>().default({}).notNull(), // user_id -> emoji
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 6. User Chat Settings / Conversation Metadata (Pin, Mute, Archive, Unread override)
export const userChatMetadata = pgTable("user_chat_metadata", {
  id: text("id").primaryKey(), // user_id + '_' + chat_id
  user_id: text("user_id").notNull(),
  chat_id: text("chat_id").notNull(),
  is_pinned: boolean("is_pinned").default(false).notNull(),
  is_muted: boolean("is_muted").default(false).notNull(),
  is_archived: boolean("is_archived").default(false).notNull(),
  is_favorite: boolean("is_favorite").default(false).notNull(),
  is_unread_manual: boolean("is_unread_manual").default(false).notNull(),
  label_ids: jsonb("label_ids").$type<string[]>().default([]).notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Groups Table
export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  photo_url: text("photo_url"),
  description: text("description"),
  members: jsonb("members").$type<Array<{ user_id: string; role: "admin" | "member"; joined_at: string }>>().default([]).notNull(),
  settings: jsonb("settings").$type<{
    who_can_send: "everyone" | "admins";
    who_can_edit_info: "everyone" | "admins";
    disappearing_messages: { enabled: boolean; duration_hours: number };
  }>().default({
    who_can_send: "everyone",
    who_can_edit_info: "everyone",
    disappearing_messages: { enabled: false, duration_hours: 24 },
  }).notNull(),
  created_by: text("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 8. Status / Stories Table
export const statuses = pgTable("statuses", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  type: text("type").default("text").notNull(), // 'text' | 'image' | 'video'
  content: text("content").notNull(),
  background_color: text("background_color").default("#075E54"),
  font_style: text("font_style").default("default"),
  caption: text("caption"),
  viewers: jsonb("viewers").$type<Array<{ user_id: string; viewed_at: string }>>().default([]).notNull(),
  likes: jsonb("likes").$type<string[]>().default([]).notNull(),
  replies: jsonb("replies").$type<Array<{ user_id: string; text: string; at: string }>>().default([]).notNull(),
  privacy: text("privacy").default("contacts").notNull(), // 'contacts' | 'except' | 'only_share_with'
  except_ids: jsonb("except_ids").$type<string[]>().default([]).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(),
});

// 9. Calls Table
export const calls = pgTable("calls", {
  id: text("id").primaryKey(),
  caller_id: text("caller_id").notNull(),
  callee_id: text("callee_id").notNull(),
  type: text("type").default("voice").notNull(), // 'voice' | 'video'
  status: text("status").default("calling").notNull(), // 'calling' | 'ongoing' | 'missed' | 'completed' | 'declined'
  duration_seconds: integer("duration_seconds").default(0).notNull(),
  sdp_offer: jsonb("sdp_offer"),
  sdp_answer: jsonb("sdp_answer"),
  ice_candidates: jsonb("ice_candidates").$type<Array<{ from: string; candidate: any }>>().default([]).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 10. Themes Table
export const themes = pgTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  preview_url: text("preview_url"),
  colors: jsonb("colors").$type<{
    primary: string;
    accent: string;
    bubble_sent: string;
    bubble_received: string;
    background: string;
    header_text?: string;
  }>().notNull(),
  font: text("font").default("system-ui").notNull(),
  category: text("category").default("Minimal").notNull(),
  approved: boolean("approved").default(true).notNull(),
  uploaded_by: text("uploaded_by").default("system").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 11. Business Catalog & Tools Table
export const catalogProducts = pgTable("catalog_products", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  image_url: text("image_url"),
  collection: text("collection").default("General"),
  is_available: boolean("is_available").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const businessProfiles = pgTable("business_profiles", {
  user_id: text("user_id").primaryKey(),
  category: text("category").default("Shopping & Retail").notNull(),
  address: text("address"),
  website: text("website"),
  email: text("email"),
  business_hours: jsonb("business_hours").$type<Record<string, { open: string; close: string; closed: boolean }>>().default({}).notNull(),
  quick_replies: jsonb("quick_replies").$type<Array<{ id: string; shortcut: string; message: string }>>().default([]).notNull(),
  greeting_message: jsonb("greeting_message").$type<{ enabled: boolean; text: string; inactivity_hours: number }>().default({
    enabled: true,
    text: "Thank you for reaching out! How can we assist you today?",
    inactivity_hours: 24,
  }).notNull(),
  away_message: jsonb("away_message").$type<{ enabled: boolean; text: string; schedule: string; audience: string }>().default({
    enabled: false,
    text: "We are currently away. We will respond as soon as possible!",
    schedule: "always",
    audience: "everyone",
  }).notNull(),
  labels: jsonb("labels").$type<Array<{ id: string; name: string; color: string }>>().default([
    { id: "lbl_new", name: "New Customer", color: "#3B82F6" },
    { id: "lbl_pending", name: "Pending Payment", color: "#F59E0B" },
    { id: "lbl_paid", name: "Order Paid", color: "#10B981" },
    { id: "lbl_vip", name: "VIP Customer", color: "#8B5CF6" },
  ]).notNull(),
});

// 12. Pro Features Data Tables (Scheduled messages, Auto replies)
export const scheduledMessages = pgTable("scheduled_messages", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  chat_id: text("chat_id").notNull(),
  content: text("content").notNull(),
  type: text("type").default("text").notNull(),
  send_at: timestamp("send_at").notNull(),
  repeat: text("repeat").default("none").notNull(), // 'none'|'daily'|'weekly'
  status: text("status").default("pending").notNull(), // 'pending'|'sent'|'cancelled'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const autoReplies = pgTable("auto_replies", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  trigger_type: text("trigger_type").default("contains").notNull(), // 'contains'|'all'|'offline'
  keyword: text("keyword"),
  response: text("response").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 13. Reports Table
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporter_id: text("reporter_id").notNull(),
  target_type: text("target_type").notNull(), // 'user' | 'message' | 'status'
  target_id: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending").notNull(), // 'pending' | 'resolved' | 'dismissed'
  action_taken: text("action_taken"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 14. Announcements / Broadcasts Table
export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  image_url: text("image_url"),
  audience: text("audience").default("all").notNull(), // 'all'|'free'|'business'|'pro'|'custom'
  custom_user_ids: jsonb("custom_user_ids").$type<string[]>().default([]).notNull(),
  sent_by: text("sent_by").notNull(),
  sent_at: timestamp("sent_at").defaultNow().notNull(),
});

// 15. Admin Log Table
export const adminLogs = pgTable("admin_logs", {
  id: text("id").primaryKey(),
  admin_id: text("admin_id").notNull(),
  action: text("action").notNull(),
  target_type: text("target_type").notNull(),
  target_id: text("target_id").notNull(),
  details: jsonb("details").$type<Record<string, any>>().default({}).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// 16. App Settings Table
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(), // 'default'
  app_name: text("app_name").default("WhatsApp").notNull(),
  logo_url: text("logo_url"),
  primary_color: text("primary_color").default("#075E54").notNull(),
  max_upload_mb: jsonb("max_upload_mb").$type<{ free: number; business: number; pro: number }>().default({
    free: 16,
    business: 32,
    pro: 100,
  }).notNull(),
  allowed_file_types: jsonb("allowed_file_types").$type<string[]>().default([
    "jpg", "jpeg", "png", "gif", "mp4", "pdf", "docx", "mp3", "zip"
  ]).notNull(),
  maintenance_mode: boolean("maintenance_mode").default(false).notNull(),
  maintenance_message: text("maintenance_message").default("System is under maintenance. Please check back shortly.").notNull(),
  default_language: text("default_language").default("en").notNull(),
  session_timeout_minutes: integer("session_timeout_minutes").default(10080).notNull(),
  max_linked_devices: integer("max_linked_devices").default(4).notNull(),
  payment_accounts: jsonb("payment_accounts").$type<{
    jazzcash: { number: string; title: string };
    easypaisa: { number: string; title: string };
    bank: { bank_name: string; account_title: string; account_number: string; iban: string };
  }>().default({
    jazzcash: { number: "03001234567", title: "WhatsApp Admin JazzCash" },
    easypaisa: { number: "03119876543", title: "WhatsApp Admin EasyPaisa" },
    bank: {
      bank_name: "Meezan Bank Ltd",
      account_title: "WhatsApp Platform Enterprise",
      account_number: "01010102938481",
      iban: "PK36MEZN0001010102938481",
    },
  }).notNull(),
});

// 17. Admin Users Table (For C.1 Admin Auth)
export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").default("super_admin").notNull(), // 'super_admin' | 'moderator' | 'support'
  permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
