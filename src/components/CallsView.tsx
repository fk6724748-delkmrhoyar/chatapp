"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  User as UserIcon,
  Plus,
} from "lucide-react";

export default function CallsView() {
  const { currentUser, activeCall, setActiveCall } = useApp();
  const [callsHistory, setCallsHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [loading, setLoading] = useState(true);

  // Call duration counter
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const fetchCalls = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/call?user_id=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setCallsHistory(json.data.calls || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [currentUser]);

  useEffect(() => {
    let timer: any = null;
    if (activeCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  const filtered = callsHistory.filter((c) => {
    if (filter === "missed") return c.status === "missed";
    return true;
  });

  const startNewCall = async (otherUserId: string, type: "voice" | "video") => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_id: currentUser.id,
          callee_id: otherUserId,
          type,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveCall({
          ...json.data.call,
          other_user: { name: "Calling Contact...", photo_url: null },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      try {
        await fetch("/api/call/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            call_id: activeCall.id,
            action: "end",
            duration_seconds: callDuration,
          }),
        });
      } catch (e) {}
    }
    setActiveCall(null);
    fetchCalls();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-y-auto relative">
      {/* Segmented Filter */}
      <div className="p-3 bg-gray-50 dark:bg-[#111B21] border-b border-gray-100 dark:border-gray-800 flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
            filter === "all"
              ? "bg-[#25D366] text-white"
              : "bg-gray-100 dark:bg-[#202C33] text-gray-600 dark:text-gray-300"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("missed")}
          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
            filter === "missed"
              ? "bg-red-500 text-white"
              : "bg-gray-100 dark:bg-[#202C33] text-gray-600 dark:text-gray-300"
          }`}
        >
          Missed
        </button>
      </div>

      {/* Call History List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading call history...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No call history found.</div>
        ) : (
          filtered.map((c) => {
            const isOutgoing = c.is_outgoing;
            const isMissed = c.status === "missed";

            return (
              <div
                key={c.id}
                className="p-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#202C33] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {c.other_user?.photo_url ? (
                      <img src={c.other_user.photo_url} alt="Caller" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        isMissed ? "text-red-500" : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {c.other_user?.name || "WhatsApp User"}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      {isOutgoing ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-sky-500" />
                      )}
                      <span>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startNewCall(c.other_user?.id || c.caller_id, c.type || "voice")}
                  className="p-2 text-[#075E54] dark:text-[#25D366] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer"
                >
                  {c.type === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Active WebRTC Live Call Screen Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-[#0B141A] text-white flex flex-col justify-between p-6">
          <div className="text-center pt-8 space-y-2">
            <p className="text-xs text-[#25D366] font-bold uppercase tracking-widest animate-pulse">
              {activeCall.type === "video" ? "HD Video Call" : "End-to-End Encrypted Voice Call"}
            </p>
            <h2 className="text-2xl font-bold">{activeCall.other_user?.name || "WhatsApp Contact"}</h2>
            <p className="text-sm text-gray-300 font-mono">{formatDuration(callDuration)}</p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {activeCall.type === "video" ? (
              <div className="relative w-full max-w-sm h-80 bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center">
                <p className="text-xs text-gray-400">Remote Video Feed Active</p>
                {/* Self PiP */}
                <div className="absolute bottom-3 right-3 w-24 h-32 bg-gray-800 rounded-xl border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
                  <span className="text-[10px] text-gray-300">You</span>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-[#25D366] p-1 animate-bounce">
                <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                  <UserIcon className="w-16 h-16 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pb-8">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full cursor-pointer transition-colors ${
                isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-transform hover:scale-110 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              type="button"
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`p-4 rounded-full cursor-pointer transition-colors ${
                isSpeaker ? "bg-[#25D366] text-white" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
