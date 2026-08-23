"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Pin,
  VolumeX,
  Check,
  CheckCheck,
  Camera,
  Mic,
  FileText,
  MapPin,
  User as UserIcon,
  BarChart2,
  Plus,
  Star,
  Users,
  Search,
  Lock,
  Crown,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";

export default function ChatList({
  onOpenContactPicker,
  isSearchOpen,
  onCloseSearch,
}: {
  onOpenContactPicker: () => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
}) {
  const { currentUser, chats, activeChatId, setActiveChatId, refreshChats } = useApp();

  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatForMenu, setSelectedChatForMenu] = useState<string | null>(null);

  // Pro feature check for custom chat tabs
  const isPro = currentUser?.plan === "pro";

  // Filter chats based on query and active filter
  const filteredChats = chats.filter((c) => {
    // 1. Text search
    const title = c.is_group ? c.group?.name : c.contact?.name;
    const phone = c.contact?.phone || "";
    const matchesSearch =
      !searchQuery ||
      (title && title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      phone.includes(searchQuery);

    if (!matchesSearch) return false;

    // 2. Custom filter tabs (Pro unlocked)
    if (activeFilter === "unread") return c.unread_count > 0 || c.is_unread_manual;
    if (activeFilter === "groups") return c.is_group;
    if (activeFilter === "favorites") return c.is_favorite;

    return true;
  });

  const handleMetadataAction = async (chatId: string, action: string, value: any) => {
    if (!currentUser) return;
    try {
      await fetch("/api/chat/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          chat_id: chatId,
          action,
          value,
        }),
      });
      setSelectedChatForMenu(null);
      refreshChats();
    } catch (e) {
      console.error(e);
    }
  };

  const renderLastMessageSnippet = (lastMsg: any, isMe: boolean) => {
    if (!lastMsg) return <span className="italic text-gray-400">No messages yet</span>;

    const tick =
      lastMsg.status === "read" ? (
        <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline mr-1" />
      ) : lastMsg.status === "delivered" ? (
        <CheckCheck className="w-3.5 h-3.5 text-gray-400 inline mr-1" />
      ) : (
        <Check className="w-3.5 h-3.5 text-gray-400 inline mr-1" />
      );

    let prefix = null;
    if (lastMsg.type === "image") prefix = <span className="inline-flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Photo</span>;
    else if (lastMsg.type === "video") prefix = <span className="inline-flex items-center gap-1">🎥 Video</span>;
    else if (lastMsg.type === "audio") prefix = <span className="inline-flex items-center gap-1"><Mic className="w-3.5 h-3.5" /> Voice note</span>;
    else if (lastMsg.type === "document") prefix = <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Document</span>;
    else if (lastMsg.type === "location") prefix = <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location</span>;
    else if (lastMsg.type === "contact") prefix = <span className="inline-flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Contact card</span>;
    else if (lastMsg.type === "poll") prefix = <span className="inline-flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> Poll</span>;

    return (
      <span className="flex items-center truncate text-xs text-gray-600 dark:text-gray-400">
        {isMe && tick}
        {prefix ? <span className="mr-1">{prefix}</span> : null}
        <span className="truncate">{lastMsg.content}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] relative overflow-hidden">
      {/* Search Bar (if active) */}
      {isSearchOpen && (
        <div className="p-2.5 bg-gray-50 dark:bg-[#202C33] border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#111B21] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start new chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={onCloseSearch}
            className="text-xs font-semibold text-[#075E54] dark:text-[#25D366] px-2 py-1 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pro Filter Chips (All / Unread / Groups / Favorites) */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
        {(["all", "unread", "groups", "favorites"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all flex items-center gap-1 cursor-pointer ${
              activeFilter === filter
                ? "bg-[#25D366] text-white shadow-sm"
                : "bg-gray-100 dark:bg-[#202C33] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {filter === "favorites" && <Star className="w-3 h-3 fill-current text-amber-300" />}
            {filter === "groups" && <Users className="w-3 h-3" />}
            <span>{filter}</span>
            {!isPro && filter !== "all" && <Crown className="w-2.5 h-2.5 text-amber-500 ml-0.5" />}
          </button>
        ))}
      </div>

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No chats found</p>
            <p className="text-xs text-gray-400 mt-1">Tap the + button to start messaging contacts.</p>
          </div>
        ) : (
          filteredChats.map((c) => {
            const isGroup = c.is_group;
            const title = isGroup ? c.group?.name : c.contact?.name;
            const photo = isGroup ? c.group?.photo_url : c.contact?.photo_url;
            const isOnline = !isGroup && c.contact?.is_online;
            const lastMsg = c.last_message;
            const isMe = lastMsg && lastMsg.sender_id === currentUser?.id;
            const isActive = activeChatId === c.chat_id;

            return (
              <div
                key={c.chat_id}
                onClick={() => setActiveChatId(c.chat_id)}
                className={`flex items-center gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-[#202C33]/70 transition-all cursor-pointer relative group ${
                  isActive ? "bg-emerald-50/60 dark:bg-[#202C33]" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt={title} className="w-full h-full object-cover" />
                    ) : isGroup ? (
                      <Users className="w-6 h-6 text-gray-400" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Online Dot */}
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25D366] rounded-full border-2 border-white dark:border-[#111B21]" />
                  )}
                </div>

                {/* Info Center */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2
                        className={`text-sm font-semibold truncate text-gray-900 dark:text-gray-100 ${
                          c.unread_count > 0 ? "font-bold" : ""
                        }`}
                      >
                        {title}
                      </h2>

                      {/* Badges */}
                      {!isGroup && c.contact?.badges?.includes("verified") && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white flex-shrink-0" />
                      )}
                      {!isGroup && c.contact?.badges?.includes("business") && (
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] font-bold px-1.5 py-0.2 rounded flex-shrink-0">
                          BIZ
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {lastMsg
                        ? new Date(lastMsg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  {/* Snippet & Badges */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="min-w-0 flex-1">
                      {renderLastMessageSnippet(lastMsg, isMe)}
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      {c.is_pinned && <Pin className="w-3.5 h-3.5 text-gray-400 fill-gray-400 rotate-45" />}
                      {c.is_muted && <VolumeX className="w-3.5 h-3.5 text-gray-400" />}

                      {c.unread_count > 0 ? (
                        <span className="bg-[#25D366] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                          {c.unread_count}
                        </span>
                      ) : c.is_unread_manual ? (
                        <span className="w-2.5 h-2.5 bg-[#25D366] rounded-full" />
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Menu options button */}
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChatForMenu(selectedChatForMenu === c.chat_id ? null : c.chat_id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {selectedChatForMenu === c.chat_id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-6 w-44 bg-white dark:bg-[#202C33] shadow-2xl rounded-xl py-1.5 z-50 text-xs text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700"
                    >
                      <button
                        type="button"
                        onClick={() => handleMetadataAction(c.chat_id, "pin", !c.is_pinned)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Pin className="w-3.5 h-3.5 text-gray-500" />
                        <span>{c.is_pinned ? "Unpin Chat" : "Pin Chat"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMetadataAction(c.chat_id, "mute", !c.is_muted)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <VolumeX className="w-3.5 h-3.5 text-gray-500" />
                        <span>{c.is_muted ? "Unmute Notifications" : "Mute Notifications"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMetadataAction(c.chat_id, "favorite", !c.is_favorite)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{c.is_favorite ? "Remove Favorite" : "Add Favorite"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMetadataAction(c.chat_id, "mark_unread", !c.is_unread_manual)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-gray-500" />
                        <span>{c.is_unread_manual ? "Mark as Read" : "Mark as Unread"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={onOpenContactPicker}
        title="New Chat"
        className="absolute bottom-5 right-5 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer z-20"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
