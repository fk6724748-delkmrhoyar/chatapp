"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Plus,
  Radio,
  Image as ImageIcon,
  Type,
  Eye,
  Heart,
  Send,
  Download,
  X,
  User as UserIcon,
  Crown,
  ChevronUp,
} from "lucide-react";

const BG_COLORS = ["#075E54", "#128C7E", "#25D366", "#34B7F1", "#9C27B0", "#E91E63", "#FF5722"];

export default function StatusView() {
  const { currentUser } = useApp();
  const [statusGroups, setStatusGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Composer modal
  const [showComposer, setShowComposer] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [selectedBg, setSelectedBg] = useState("#075E54");

  // Fullscreen Viewer
  const [activeViewerGroup, setActiveViewerGroup] = useState<any | null>(null);
  const [viewerItemIndex, setViewerItemIndex] = useState(0);
  const [replyText, setReplyText] = useState("");

  const isPro = currentUser?.plan === "pro";

  const fetchStatuses = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/status?user_id=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setStatusGroups(json.data.status_groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [currentUser]);

  const handlePostStatus = async () => {
    if (!composerText.trim() || !currentUser) return;
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          type: "text",
          content: composerText.trim(),
          background_color: selectedBg,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setComposerText("");
        setShowComposer(false);
        fetchStatuses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkViewed = async (statusId: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/status/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "view",
          status_id: statusId,
          user_id: currentUser.id,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const myGroup = statusGroups.find((g) => g.user.is_me);
  const otherGroups = statusGroups.filter((g) => !g.user.is_me);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-y-auto">
      {/* My Status Section */}
      <div
        onClick={() => {
          if (myGroup && myGroup.items.length > 0) {
            setActiveViewerGroup(myGroup);
            setViewerItemIndex(0);
          } else {
            setShowComposer(true);
          }
        }}
        className="p-4 flex items-center gap-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#202C33] cursor-pointer"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-[#25D366] p-0.5 overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            {currentUser?.photo_url ? (
              <img src={currentUser.photo_url} alt="My Status" className="w-full h-full object-cover rounded-full" />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#25D366] text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#111B21]">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">My Status</h2>
          <p className="text-xs text-gray-400">
            {myGroup && myGroup.items.length > 0 ? "Tap to view active status updates" : "Tap to add status update"}
          </p>
        </div>
      </div>

      {/* Recent Updates Header */}
      <div className="p-3 bg-gray-50 dark:bg-[#111B21] text-xs font-bold text-gray-500 uppercase tracking-wider">
        Recent updates
      </div>

      {/* Contacts Status List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading statuses...</div>
        ) : otherGroups.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No recent updates from contacts.</div>
        ) : (
          otherGroups.map((group) => {
            const latest = group.items[0];
            return (
              <div
                key={group.user.id}
                onClick={() => {
                  setActiveViewerGroup(group);
                  setViewerItemIndex(0);
                  if (latest) handleMarkViewed(latest.id);
                }}
                className="p-3.5 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-[#202C33] cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-full border-2 p-0.5 flex items-center justify-center overflow-hidden ${
                  group.has_unviewed ? "border-[#25D366]" : "border-gray-300 dark:border-gray-700"
                }`}>
                  {group.user.photo_url ? (
                    <img src={group.user.photo_url} alt={group.user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{group.user.name}</h3>
                  <p className="text-xs text-gray-400">
                    {latest ? new Date(latest.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status Composer Popup */}
      {showComposer && (
        <div className="fixed inset-0 z-50 bg-[#075E54] flex flex-col justify-between p-6" style={{ backgroundColor: selectedBg }}>
          <div className="flex items-center justify-between text-white">
            <button type="button" onClick={() => setShowComposer(false)} className="p-2 cursor-pointer">
              <X className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedBg(color)}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                    selectedBg === color ? "border-white scale-110" : "border-transparent opacity-80"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <textarea
              placeholder="Type a status..."
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              className="w-full bg-transparent text-white text-2xl font-bold text-center placeholder-white/60 focus:outline-none resize-none"
              rows={4}
              autoFocus
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePostStatus}
              disabled={!composerText.trim()}
              className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer disabled:opacity-50"
            >
              <Send className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Story Viewer */}
      {activeViewerGroup && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between p-4"
          style={{
            backgroundColor: activeViewerGroup.items[viewerItemIndex]?.background_color || "#0B141A",
          }}
        >
          {/* Top Progress Segment Bar & Info Header */}
          <div className="space-y-3 z-20">
            <div className="flex gap-1.5">
              {activeViewerGroup.items.map((item: any, idx: number) => (
                <div key={item.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all ${
                      idx < viewerItemIndex ? "w-full" : idx === viewerItemIndex ? "w-full animate-pulse" : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200">
                  {activeViewerGroup.user.photo_url ? (
                    <img src={activeViewerGroup.user.photo_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{activeViewerGroup.user.name}</p>
                  <p className="text-[10px] text-white/80">
                    {new Date(activeViewerGroup.items[viewerItemIndex]?.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isPro && (
                  <button
                    type="button"
                    onClick={() => alert("Downloading status media to local device gallery (Pro feature)...")}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer"
                    title="Download Status (Pro Mod)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button type="button" onClick={() => setActiveViewerGroup(null)} className="p-1 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Story Body */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-white">
            {activeViewerGroup.items[viewerItemIndex]?.type === "image" ? (
              <img
                src={activeViewerGroup.items[viewerItemIndex]?.content}
                alt="Status Media"
                className="max-h-96 max-w-full rounded-2xl shadow-2xl object-cover"
              />
            ) : (
              <p className="text-2xl font-bold max-w-md leading-relaxed">
                {activeViewerGroup.items[viewerItemIndex]?.content}
              </p>
            )}
          </div>

          {/* Bottom Action / Viewers overlay */}
          <div className="z-20">
            {activeViewerGroup.user.is_me ? (
              <div className="flex flex-col items-center gap-1 text-white/80">
                <ChevronUp className="w-5 h-5 animate-bounce" />
                <span className="text-xs font-bold flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Viewed by {activeViewerGroup.items[viewerItemIndex]?.viewers?.length || 0}</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Reply to status..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-white/20 text-white placeholder-white/70 text-xs rounded-full p-3 px-4 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (replyText.trim()) {
                      await fetch("/api/status/action", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "reply",
                          status_id: activeViewerGroup.items[viewerItemIndex]?.id,
                          user_id: currentUser?.id,
                          text: replyText.trim(),
                        }),
                      });
                      setReplyText("");
                      alert("Reply sent as direct message!");
                    }
                  }}
                  className="p-3 bg-[#25D366] text-white rounded-full cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
