"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Crown,
  Palette,
  EyeOff,
  Clock,
  Bot,
  Sparkles,
  Users,
  Shield,
  Zap,
  Check,
  Plus,
  Trash2,
} from "lucide-react";

export default function ProToolsView() {
  const { currentUser, setCurrentUser, applyTheme } = useApp();
  const [activeSection, setActiveTab] = useState<"privacy" | "themes" | "scheduler" | "ai" | "accounts">("privacy");

  // Privacy toggles state
  const privacy = (currentUser?.privacy || {}) as any;
  const [ghostMode, setGhostMode] = useState(Boolean(privacy.ghost_mode));
  const [hideOnline, setHideOnline] = useState(Boolean(privacy.hide_online));
  const [freezeLastSeen, setFreezeLastSeen] = useState(Boolean(privacy.freeze_last_seen));
  const [hideBlueTick, setHideBlueTick] = useState(Boolean(privacy.hide_blue_tick));
  const [hideSecondTick, setHideSecondTick] = useState(Boolean(privacy.hide_second_tick));
  const [hideTyping, setHideTyping] = useState(Boolean(privacy.hide_typing));
  const [hideStatusViews, setHideStatusViews] = useState(Boolean(privacy.hide_status_views));
  const [antiDeleteMsg, setAntiDeleteMsg] = useState(Boolean(privacy.anti_delete_messages ?? true));
  const [antiViewOnce, setAntiViewOnce] = useState(Boolean(privacy.anti_view_once ?? true));
  const [disableForwarded, setDisableForwarded] = useState(Boolean(privacy.disable_forwarded_tag));

  // Custom Theme Color Pickers
  const [primaryColor, setPrimaryColor] = useState("#075E54");
  const [accentColor, setAccentColor] = useState("#25D366");
  const [sentBubbleColor, setSentBubbleColor] = useState("#DCF8C6");

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handleSavePrivacyFlags = async (updatedObj: Record<string, boolean>) => {
    if (!currentUser) return;
    try {
      const newPrivacy = { ...privacy, ...updatedObj };
      await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          privacy: newPrivacy,
        }),
      });
      setCurrentUser({ ...currentUser, privacy: newPrivacy });
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyCustomTheme = () => {
    applyTheme({
      primary: primaryColor,
      accent: accentColor,
      bubble_sent: sentBubbleColor,
      bubble_received: "#FFFFFF",
      background: "#ECE5DD",
      header_text: "#FFFFFF",
    });
    alert("Custom theme applied live across the app!");
  };

  const handleAskAi = async () => {
    if (!aiPrompt.trim() || !currentUser) return;
    try {
      const res = await fetch("/api/pro/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_chat",
          user_id: currentUser.id,
          prompt: aiPrompt,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAiResponse(json.data.response);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-y-auto">
      {/* Top Pro Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400 text-gray-900 rounded-xl shadow-md">
            <Crown className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-base font-bold">Pro Mod Power Tools</h1>
            <p className="text-xs text-purple-200">Unlocked Advanced Privacy & Customization Suite</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#202C33] overflow-x-auto text-xs font-bold text-gray-600 dark:text-gray-300">
        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex-1 min-w-[90px] py-3 text-center border-b-2 cursor-pointer ${
            activeSection === "privacy" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent"
          }`}
        >
          Ghost Privacy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("themes")}
          className={`flex-1 min-w-[90px] py-3 text-center border-b-2 cursor-pointer ${
            activeSection === "themes" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent"
          }`}
        >
          Theme Store
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex-1 min-w-[90px] py-3 text-center border-b-2 cursor-pointer ${
            activeSection === "ai" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent"
          }`}
        >
          AI Tools
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 flex-1">
        {activeSection === "privacy" && (
          <div className="space-y-4 max-w-lg">
            {/* Ghost Mode Master Switch */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-purple-600" />
                  <span>Ghost Mode (Master Switch)</span>
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Browse invisibly: disables online status, last seen, typing, and recording indicators all at once.
                </p>
              </div>

              <input
                type="checkbox"
                checked={ghostMode}
                onChange={(e) => {
                  setGhostMode(e.target.checked);
                  handleSavePrivacyFlags({ ghost_mode: e.target.checked });
                }}
                className="w-6 h-6 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* Individual Privacy Toggles */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-2">
              {[
                { label: "Hide Blue Tick (Read Receipt)", state: hideBlueTick, set: setHideBlueTick, key: "hide_blue_tick" },
                { label: "Hide Second Grey Tick (Delivered)", state: hideSecondTick, set: setHideSecondTick, key: "hide_second_tick" },
                { label: "Freeze Last Seen Timestamp", state: freezeLastSeen, set: setFreezeLastSeen, key: "freeze_last_seen" },
                { label: "Hide Typing & Recording Indicator", state: hideTyping, set: setHideTyping, key: "hide_typing" },
                { label: "Anti-Status View (Hide status views)", state: hideStatusViews, set: setHideStatusViews, key: "hide_status_views" },
                { label: "Anti-Delete Messages (See deleted messages)", state: antiDeleteMsg, set: setAntiDeleteMsg, key: "anti_delete_messages" },
                { label: "Anti-View-Once (Save view-once media)", state: antiViewOnce, set: setAntiViewOnce, key: "anti_view_once" },
                { label: "Disable Forwarded Tag on sent messages", state: disableForwarded, set: setDisableForwarded, key: "disable_forwarded_tag" },
              ].map((item) => (
                <div key={item.key} className="pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => {
                      item.set(e.target.checked);
                      handleSavePrivacyFlags({ [item.key]: e.target.checked });
                    }}
                    className="w-5 h-5 accent-[#25D366] cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "themes" && (
          <div className="space-y-5 max-w-lg">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Live Custom CSS Theme Builder</h2>

            <div className="space-y-3 p-4 bg-gray-50 dark:bg-[#202C33] rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Header Primary Color</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Accent / FAB Color</span>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Sent Message Bubble</span>
                <input
                  type="color"
                  value={sentBubbleColor}
                  onChange={(e) => setSentBubbleColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyCustomTheme}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer text-xs"
              >
                Apply Theme Instantly
              </button>
            </div>
          </div>
        )}

        {activeSection === "ai" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <Bot className="w-5 h-5 text-purple-600" />
              <span>AI Chat Assistant</span>
            </h2>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl space-y-3">
              <textarea
                placeholder="Ask AI assistant to write a response, summarize a topic, or generate ideas..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full p-3 bg-white dark:bg-[#111B21] border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
                rows={3}
              />
              <button
                type="button"
                onClick={handleAskAi}
                className="bg-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </button>

              {aiResponse && (
                <div className="p-3 bg-white dark:bg-[#111B21] rounded-xl text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {aiResponse}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
