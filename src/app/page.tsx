"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import Splash from "@/components/Splash";
import AuthFlow from "@/components/AuthFlow";
import Header from "@/components/Header";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import ContactPicker from "@/components/ContactPicker";
import CreateGroupModal from "@/components/CreateGroupModal";
import StatusView from "@/components/StatusView";
import CallsView from "@/components/CallsView";
import ChannelsView from "@/components/ChannelsView";
import BusinessToolsView from "@/components/BusinessToolsView";
import ProToolsView from "@/components/ProToolsView";
import SettingsView from "@/components/SettingsView";
import UpgradePlanModal from "@/components/UpgradePlanModal";
import AdminPanel from "@/components/AdminPanel";
import { MessageSquare, ShieldCheck, Crown } from "lucide-react";

export default function Home() {
  const { currentUser, activeTab, setActiveTab, activeChatId, setActiveChatId } = useApp();

  const [showSplash, setShowSplash] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <AuthFlow />;
  }

  if (showAdminPanel || activeTab === "admin") {
    return <AdminPanel onExit={() => { setShowAdminPanel(false); setActiveTab("chats"); }} />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#D1D7DB] dark:bg-[#0B141A] overflow-hidden">
      {/* Outer Web Container - WhatsApp Web Desktop Wrapper Style */}
      <div className="w-full h-full max-w-[1600px] mx-auto flex shadow-2xl overflow-hidden relative">
        {/* LEFT PANEL (Tabs, List, Contacts, Navigation) */}
        <div
          className={`w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-white dark:bg-[#111B21] border-r border-gray-200 dark:border-gray-800 transition-all ${
            activeChatId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <Header
            onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
            isSearchOpen={isSearchOpen}
            onOpenContactPicker={() => setShowContactPicker(true)}
            onOpenCreateGroup={() => setShowCreateGroup(true)}
          />

          {/* Active Tab View */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === "chats" && (
              <ChatList
                onOpenContactPicker={() => setShowContactPicker(true)}
                isSearchOpen={isSearchOpen}
                onCloseSearch={() => setIsSearchOpen(false)}
              />
            )}

            {activeTab === "status" && <StatusView />}

            {activeTab === "calls" && <CallsView />}

            {activeTab === "channels" && <ChannelsView />}

            {activeTab === "business" && <BusinessToolsView />}

            {activeTab === "pro" && <ProToolsView />}

            {activeTab === "settings" && (
              <SettingsView onOpenUpgradeModal={() => setShowUpgradeModal(true)} />
            )}
          </div>
        </div>

        {/* RIGHT PANEL (Chat Window or Empty Placeholder) */}
        <div
          className={`flex-1 h-full bg-[#ECE5DD] dark:bg-[#0B141A] flex flex-col ${
            !activeChatId ? "hidden md:flex" : "flex"
          }`}
        >
          {activeChatId ? (
            <ChatWindow
              chatId={activeChatId}
              onBack={() => setActiveChatId(null)}
              onOpenInfo={() => {}}
              onStartCall={(type) => {
                alert(`Initiating ${type} call...`);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F0F2F5] dark:bg-[#222E35] border-b-8 border-[#25D366]">
              <div className="w-20 h-20 bg-[#25D366] text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <MessageSquare className="w-10 h-10 fill-current" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                WhatsApp Web
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
                Send and receive messages with instant OTP-free phone authentication, Business tools, and Pro mod superpowers.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span>End-to-end Style Private Messaging</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showContactPicker && (
        <ContactPicker
          onClose={() => setShowContactPicker(false)}
          onOpenCreateGroup={() => {
            setShowContactPicker(false);
            setShowCreateGroup(true);
          }}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}

      {showUpgradeModal && (
        <UpgradePlanModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
