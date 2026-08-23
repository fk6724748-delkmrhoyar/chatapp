"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  User as UserIcon,
  Shield,
  Key,
  MessageSquare,
  Bell,
  Database,
  Briefcase,
  Crown,
  ChevronRight,
  LogOut,
  Sparkles,
  Camera,
  Check,
} from "lucide-react";

export default function SettingsView({
  onOpenUpgradeModal,
}: {
  onOpenUpgradeModal: () => void;
}) {
  const { currentUser, setCurrentUser, setActiveTab, logout } = useApp();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [about, setAbout] = useState(currentUser?.about || "");
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photo_url || "");

  const handleSaveProfile = async () => {
    if (!currentUser || !name.trim()) return;
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          name: name.trim(),
          about: about.trim(),
          photo_url: photoUrl || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.data.user);
        setIsEditingProfile(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-y-auto">
      {/* Profile Header Card */}
      <div
        onClick={() => setIsEditingProfile(true)}
        className="p-4 bg-gray-50 dark:bg-[#202C33] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/60 cursor-pointer transition-colors"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-[#25D366]">
          {currentUser?.photo_url ? (
            <img src={currentUser.photo_url} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
            {currentUser?.name || "Your Name"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {currentUser?.about || "Hey there! I am using WhatsApp Clone"}
          </p>
          <p className="text-[11px] text-[#075E54] dark:text-[#25D366] font-semibold mt-1">
            {currentUser?.phone}
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {/* Upgrade Plan Banner (for Free or Business users) */}
      {currentUser?.plan !== "pro" && (
        <div
          onClick={onOpenUpgradeModal}
          className="m-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex items-center justify-between cursor-pointer hover:opacity-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Crown className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-sm font-bold">Upgrade to Pro Mod Tier</p>
              <p className="text-xs text-amber-100">Unlock Ghost Mode, Custom Themes & AI Tools</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>
      )}

      {/* Profile Edit Inline Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#202C33] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Edit Profile</h3>

            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                {photoUrl ? (
                  <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                About
              </label>
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={139}
                className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 bg-[#25D366] text-white font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab("pro")}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#202C33] text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <Crown className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Pro Mod Settings</p>
              <p className="text-xs text-gray-400">Ghost Mode, Custom CSS Themes, AI Assistant</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#202C33] text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <Briefcase className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Business Tools</p>
              <p className="text-xs text-gray-400">Catalog, Quick Replies, Greeting & Away Messages</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={onOpenUpgradeModal}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#202C33] text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <Key className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Subscription & Billing</p>
              <p className="text-xs text-gray-400">Manage plan tier, JazzCash / EasyPaisa / Bank payments</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <Shield className="w-5 h-5 text-[#25D366]" />
            <div>
              <p className="text-sm font-bold text-[#075E54] dark:text-[#25D366]">Admin Control Panel</p>
              <p className="text-xs text-gray-400">Full system admin dashboard & feature toggles</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#25D366]" />
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/30 text-left cursor-pointer text-red-600 dark:text-red-400"
        >
          <div className="flex items-center gap-3.5">
            <LogOut className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">Log Out</p>
              <p className="text-xs text-red-400">Log out of current session</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
