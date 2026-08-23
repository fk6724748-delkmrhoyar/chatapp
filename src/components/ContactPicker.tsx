"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  ArrowLeft,
  Users,
  UserPlus,
  Radio,
  Send,
  User as UserIcon,
  CheckCircle2,
  Briefcase,
  PhoneCall,
  X,
} from "lucide-react";

export default function ContactPicker({
  onClose,
  onOpenCreateGroup,
}: {
  onClose: () => void;
  onOpenCreateGroup: () => void;
}) {
  const { currentUser, setActiveChatId } = useApp();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Quick Chat state
  const [quickPhone, setQuickPhone] = useState("");

  useEffect(() => {
    async function fetchContacts() {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/users?current_user_id=${currentUser.id}`);
        const json = await res.json();
        if (json.success) {
          setContacts(json.data.users || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, [currentUser]);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.about && c.about.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startChat = (otherUserId: string) => {
    if (!currentUser) return;
    const sorted = [currentUser.id, otherUserId].sort();
    const chatId = `c_${sorted[0]}_${sorted[1]}`;
    setActiveChatId(chatId);
    onClose();
  };

  const handleQuickChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone || !currentUser) return;
    const clean = quickPhone.replace(/\D/g, "");
    const tempId = `u_${clean}`;
    const sorted = [currentUser.id, tempId].sort();
    setActiveChatId(`c_${sorted[0]}_${sorted[1]}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#111B21] flex flex-col">
      {/* Top Header */}
      <div className="bg-[#075E54] dark:bg-[#1F2C34] text-white p-4 flex items-center gap-4 shadow-md">
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold">Select Contact</h1>
          <p className="text-xs text-emerald-100">{contacts.length} contacts available</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-gray-50 dark:bg-[#202C33] border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111B21] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Main List & Action Shortcuts */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
        {/* Shortcuts */}
        <div className="py-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateGroup();
            }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#202C33] text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">New Group</p>
              <p className="text-xs text-gray-400">Add multiple members</p>
            </div>
          </button>

          {/* Quick Chat without saving number */}
          <div className="px-4 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-y border-emerald-100 dark:border-emerald-900/50">
            <p className="text-xs font-bold text-[#075E54] dark:text-[#25D366] mb-1">
              Quick Chat (Without saving number)
            </p>
            <form onSubmit={handleQuickChatSubmit} className="flex gap-2">
              <input
                type="tel"
                placeholder="Type phone number with country code"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                className="flex-1 bg-white dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 text-xs rounded-lg p-2 focus:outline-none text-gray-800 dark:text-gray-100"
              />
              <button
                type="submit"
                className="bg-[#25D366] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span>Message</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="p-3 bg-gray-100 dark:bg-[#111B21] text-xs font-bold text-gray-500 uppercase tracking-wider">
          Contacts on WhatsApp
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No matching contacts found</div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              onClick={() => startChat(user.id)}
              className="px-4 py-3 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-[#202C33] cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {user.name}
                  </h2>
                  {user.badges?.includes("verified") && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                  )}
                  {user.badges?.includes("business") && (
                    <span className="text-[9px] bg-emerald-100 text-[#075E54] font-bold px-1 rounded">
                      BIZ
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {user.about || user.phone}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
