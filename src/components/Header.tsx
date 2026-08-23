"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Camera,
  Search,
  MoreVertical,
  Users,
  MessageCircle,
  Phone,
  Radio,
  Briefcase,
  Crown,
  Shield,
  Plus,
  Star,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function Header({
  onSearchToggle,
  isSearchOpen,
  onOpenContactPicker,
  onOpenCreateGroup,
}: {
  onSearchToggle: () => void;
  isSearchOpen: boolean;
  onOpenContactPicker: () => void;
  onOpenCreateGroup: () => void;
}) {
  const { currentUser, activeTab, setActiveTab, logout } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const planBadge = currentUser?.plan === "pro" ? "PRO" : currentUser?.plan === "business" ? "BIZ" : "FREE";

  return (
    <header className="sticky top-0 z-30 bg-[#075E54] dark:bg-[#1F2C34] text-white shadow-md select-none transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-wide text-white">WhatsApp</h1>

          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
              currentUser?.plan === "pro"
                ? "bg-amber-400 text-gray-900 shadow-sm"
                : currentUser?.plan === "business"
                ? "bg-emerald-400 text-gray-900"
                : "bg-white/20 text-white"
            }`}
          >
            {currentUser?.plan === "pro" && <Crown className="w-2.5 h-2.5 fill-current" />}
            {planBadge}
          </span>
        </div>

        {/* Action Icon Cluster */}
        <div className="flex items-center gap-4 text-white/90">
          <button
            type="button"
            onClick={onOpenContactPicker}
            title="Start new chat / camera"
            className="hover:text-white transition-colors cursor-pointer p-1"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onSearchToggle}
            title="Search chats"
            className={`hover:text-white transition-colors cursor-pointer p-1 ${
              isSearchOpen ? "text-[#25D366]" : ""
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* More Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="hover:text-white transition-colors cursor-pointer p-1"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#202C33] text-gray-800 dark:text-gray-100 rounded-xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenCreateGroup();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                  <span>New Group</span>
                </button>

                {(currentUser?.plan === "business" || currentUser?.plan === "pro") && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setActiveTab("business");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    <span>Business Tools</span>
                  </button>
                )}

                {currentUser?.plan === "pro" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setActiveTab("pro");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 cursor-pointer text-purple-600 dark:text-purple-400 font-semibold"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Pro Mod Tools</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setActiveTab("settings");
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Settings</span>
                </button>

                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setActiveTab("admin");
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#075E54] dark:text-[#25D366] font-bold flex items-center gap-2.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[#25D366]" />
                  <span>Admin Control Center</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center justify-around border-t border-white/10 text-xs font-semibold uppercase tracking-wider text-white/80 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("chats")}
          className={`flex-1 min-w-[70px] py-2.5 text-center border-b-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === "chats"
              ? "border-[#25D366] text-white font-bold"
              : "border-transparent text-white/70 hover:text-white"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={`flex-1 min-w-[70px] py-2.5 text-center border-b-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === "status"
              ? "border-[#25D366] text-white font-bold"
              : "border-transparent text-white/70 hover:text-white"
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Status</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calls")}
          className={`flex-1 min-w-[70px] py-2.5 text-center border-b-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === "calls"
              ? "border-[#25D366] text-white font-bold"
              : "border-transparent text-white/70 hover:text-white"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Calls</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("channels")}
          className={`flex-1 min-w-[70px] py-2.5 text-center border-b-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
            activeTab === "channels"
              ? "border-[#25D366] text-white font-bold"
              : "border-transparent text-white/70 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Channels</span>
        </button>

        {(currentUser?.plan === "business" || currentUser?.plan === "pro") && (
          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className={`flex-1 min-w-[70px] py-2.5 text-center border-b-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === "business"
                ? "border-amber-400 text-amber-300 font-bold"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Business</span>
          </button>
        )}

        {currentUser?.plan === "pro" && (
          <button
            type="button"
            onClick={() => setActiveTab("pro")}
            className={`flex-1 min-w-[70px] py-2.5 text-center border-b-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === "pro"
                ? "border-purple-400 text-purple-200 font-bold"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Pro Tools</span>
          </button>
        )}
      </div>
    </header>
  );
}
