"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, Check, Users, Camera, Search, X, User as UserIcon } from "lucide-react";

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { currentUser, setActiveChatId, refreshChats } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchContacts() {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/users?current_user_id=${currentUser.id}`);
        const json = await res.json();
        if (json.success) setContacts(json.data.users || []);
      } catch (e) {
        console.error(e);
      }
    }
    fetchContacts();
  }, [currentUser]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !currentUser || selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          photo_url: photoUrl,
          description: "New group chat",
          member_ids: selectedIds,
          created_by: currentUser.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        refreshChats();
        setActiveChatId(json.data.group.id);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#111B21] flex flex-col">
      {/* Header */}
      <div className="bg-[#075E54] dark:bg-[#1F2C34] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="p-1 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">New Group</h1>
            <p className="text-xs text-emerald-100">
              {step === 1 ? `${selectedIds.length} of ${contacts.length} selected` : "Type group name"}
            </p>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Selected Chips Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-[#202C33] border-b border-gray-200 dark:border-gray-800 flex gap-2 overflow-x-auto">
              {selectedIds.map((id) => {
                const u = contacts.find((c) => c.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  >
                    <span>{u?.name || id}</span>
                    <button type="button" onClick={() => toggleSelect(id)} className="cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="p-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#111B21] px-3 py-2 rounded-xl">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((u) => {
              const isSelected = selectedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelect(u.id)}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#202C33] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {u.photo_url ? (
                        <img src={u.photo_url} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.about || u.phone}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "bg-[#25D366] border-[#25D366] text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <div className="p-4 bg-white dark:bg-[#202C33] border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl shadow-lg cursor-pointer"
              >
                Next Step
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative cursor-pointer border-2 border-[#25D366]">
              {photoUrl ? (
                <img src={photoUrl} alt="Group" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Users className="w-10 h-10 text-gray-400" />
              )}
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
              Group Name / Subject
            </label>
            <input
              type="text"
              placeholder="Type group subject..."
              maxLength={25}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold focus:outline-none text-gray-800 dark:text-gray-100"
              autoFocus
            />
          </div>

          <button
            type="button"
            disabled={loading || !groupName.trim()}
            onClick={handleCreateGroup}
            className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
          >
            {loading ? "Creating Group..." : "Create Group"}
          </button>
        </div>
      )}
    </div>
  );
}
