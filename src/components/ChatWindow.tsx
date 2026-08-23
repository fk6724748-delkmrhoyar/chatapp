"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  MapPin,
  User as UserIcon,
  BarChart2,
  Trash2,
  Star,
  CornerUpLeft,
  Flame,
  AlertCircle,
  X,
  Play,
  CheckCircle2,
} from "lucide-react";

export default function ChatWindow({
  chatId,
  onBack,
  onOpenInfo,
  onStartCall,
}: {
  chatId: string;
  onBack: () => void;
  onOpenInfo: () => void;
  onStartCall: (type: "voice" | "video") => void;
}) {
  const { currentUser, setActiveCall } = useApp();

  const [chatInfo, setChatInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // Attachments modal
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollMultiple, setPollMultiple] = useState(false);

  // Reply & Edit state
  const [replyToMsg, setReplyToMsg] = useState<any>(null);
  const [selectedMsgForMenu, setSelectedMsgForMenu] = useState<any>(null);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!currentUser || !chatId) return;
    try {
      const res = await fetch(`/api/chat/messages?chat_id=${chatId}&user_id=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500); // Live poll for chat messages
    return () => clearInterval(interval);
  }, [chatId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice Recording Timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSendMessage = async (payload: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          sender_id: currentUser.id,
          reply_to: replyToMsg ? replyToMsg.id : null,
          ...payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setText("");
        setReplyToMsg(null);
        setShowAttachmentMenu(false);
        setShowPollBuilder(false);
        fetchMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMsgAction = async (action: string, extraData: any = {}) => {
    if (!selectedMsgForMenu || !currentUser) return;
    try {
      await fetch("/api/chat/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message_id: selectedMsgForMenu.id,
          user_id: currentUser.id,
          ...extraData,
        }),
      });
      setSelectedMsgForMenu(null);
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePollVote = async (messageId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/chat/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote_poll",
          message_id: messageId,
          user_id: currentUser.id,
          poll_option_id: optionId,
        }),
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const isGroup = chatId.startsWith("g_");

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ECE5DD] dark:bg-[#0B141A] relative overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#075E54] dark:bg-[#1F2C34] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={onOpenInfo}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="p-1 hover:bg-white/10 rounded-full text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold truncate text-white">
              {chatId.includes("ai_bot") ? "AI Assistant 🤖" : isGroup ? "Group Chat" : "Direct Message"}
            </h2>
            <p className="text-[11px] text-emerald-100 truncate">
              {chatId.includes("ai_bot") ? "online • Always active" : "online"}
            </p>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={() => onStartCall("video")}
            className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onStartCall("voice")}
            className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenInfo}
            className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer"
            title="Chat info"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {/* Date pill */}
        <div className="flex justify-center my-2">
          <span className="bg-white/80 dark:bg-[#182229]/80 text-gray-600 dark:text-gray-300 text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-800">
            Today
          </span>
        </div>

        {loading ? (
          <div className="text-center text-xs text-gray-400 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-emerald-100 dark:bg-emerald-950/60 p-4 rounded-full mb-3 text-[#075E54] dark:text-[#25D366]">
              <Smile className="w-8 h-8" />
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              No messages yet
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Say hi 👋 or send a photo to start conversation.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUser?.id;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMsgForMenu(selectedMsgForMenu?.id === m.id ? null : m)}
                className={`flex flex-col group ${isMe ? "items-end" : "items-start"} relative`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[82%] sm:max-w-[70%] p-2.5 rounded-2xl shadow-sm relative text-sm ${
                    isMe
                      ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-gray-900 dark:text-gray-100 rounded-tr-none"
                      : "bg-white dark:bg-[#202C33] text-gray-900 dark:text-gray-100 rounded-tl-none"
                  }`}
                >
                  {/* Quoted Reply Snippet */}
                  {m.reply_to && (
                    <div className="mb-1.5 p-2 bg-black/5 dark:bg-white/5 border-l-4 border-[#25D366] rounded text-xs text-gray-600 dark:text-gray-300">
                      <p className="font-bold text-[10px] text-[#075E54] dark:text-[#25D366]">Replied Message</p>
                      <p className="truncate">Prior message</p>
                    </div>
                  )}

                  {/* Anti-Delete Notice for Pro Users */}
                  {m.is_anti_deleted_view && (
                    <div className="mb-1.5 px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 text-[10px] font-bold rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Sender deleted this message</span>
                    </div>
                  )}

                  {/* Media Content */}
                  {m.type === "image" && (
                    <div className="rounded-xl overflow-hidden mb-1.5 border border-black/5">
                      <img src={m.content} alt="Photo" className="max-h-60 w-full object-cover" />
                    </div>
                  )}

                  {m.type === "audio" && (
                    <div className="flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-xl">
                      <button type="button" className="w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                      <div className="flex-1">
                        <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-[#25D366]" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">0:14 Voice note</p>
                      </div>
                    </div>
                  )}

                  {/* Poll Content */}
                  {m.type === "poll" && m.poll_data && (
                    <div className="space-y-2 p-1">
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-[#25D366]" />
                        <span>{m.poll_data.question}</span>
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {m.poll_data.options.map((opt: any) => {
                          const votes = opt.votes || [];
                          const hasVoted = currentUser && votes.includes(currentUser.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handlePollVote(m.id, opt.id)}
                              className={`w-full p-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                                hasVoted
                                  ? "bg-emerald-100 dark:bg-emerald-950/80 border-[#25D366] text-[#075E54] dark:text-[#25D366]"
                                  : "bg-gray-50 dark:bg-[#111B21] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <span>{opt.text}</span>
                              <span className="text-[10px] opacity-80">{votes.length} votes</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {m.type !== "poll" && (
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  )}

                  {/* Timestamp & Tick */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMe && (
                      m.status === "read" ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      ) : m.status === "delivered" ? (
                        <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-gray-400" />
                      )
                    )}
                  </div>
                </div>

                {/* Quick Emoji Reaction Context Popup */}
                {selectedMsgForMenu?.id === m.id && (
                  <div className="mt-1 bg-white dark:bg-[#202C33] p-1.5 rounded-full shadow-xl flex items-center gap-2 border border-gray-200 dark:border-gray-700 z-30 animate-in fade-in zoom-in-95">
                    {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleMsgAction("react", { emoji })}
                        className="text-lg hover:scale-125 transition-transform cursor-pointer p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                    <button
                      type="button"
                      onClick={() => handleMsgAction("delete_for_me")}
                      className="p-1 hover:text-red-500 cursor-pointer"
                      title="Delete for me"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                    </button>
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => handleMsgAction("delete_for_everyone")}
                        className="p-1 hover:text-red-600 text-xs font-bold text-red-500 cursor-pointer"
                        title="Delete for everyone"
                      >
                        Everyone
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Reply Preview Bar (above input bar) */}
      {replyToMsg && (
        <div className="bg-white dark:bg-[#202C33] p-2 px-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="border-l-4 border-[#25D366] pl-2 text-xs">
            <p className="font-bold text-[#075E54] dark:text-[#25D366]">Replying to message</p>
            <p className="text-gray-600 dark:text-gray-300 truncate max-w-xs">{replyToMsg.content}</p>
          </div>
          <button type="button" onClick={() => setReplyToMsg(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Poll Builder Popup Modal */}
      {showPollBuilder && (
        <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#202C33] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#25D366]" />
                <span>Create Poll</span>
              </h3>
              <button type="button" onClick={() => setShowPollBuilder(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">
                Question
              </label>
              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Options
              </label>
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...pollOptions];
                    newOpts[idx] = e.target.value;
                    setPollOptions(newOpts);
                  }}
                  className="w-full p-2 text-xs bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none text-gray-800 dark:text-gray-100"
                />
              ))}
              {pollOptions.length < 12 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-xs font-bold text-[#075E54] dark:text-[#25D366] cursor-pointer"
                >
                  + Add Option
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Allow multiple answers
              </label>
              <input
                type="checkbox"
                checked={pollMultiple}
                onChange={(e) => setPollMultiple(e.target.checked)}
                className="w-4 h-4 accent-[#25D366] cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const validOptions = pollOptions.filter((o) => o.trim()).map((o, i) => ({ id: `opt_${i}`, text: o.trim(), votes: [] }));
                if (pollQuestion.trim() && validOptions.length >= 2) {
                  handleSendMessage({
                    type: "poll",
                    content: pollQuestion,
                    poll_data: {
                      question: pollQuestion.trim(),
                      options: validOptions,
                      multiple: pollMultiple,
                    },
                  });
                }
              }}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl shadow-md cursor-pointer"
            >
              Send Poll
            </button>
          </div>
        </div>
      )}

      {/* Slide-Up Attachment Menu */}
      {showAttachmentMenu && (
        <div className="p-4 bg-white dark:bg-[#202C33] border-t border-gray-200 dark:border-gray-800 grid grid-cols-3 gap-4 text-center z-30 animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => {
              const url = prompt("Enter image URL or photo link:");
              if (url) handleSendMessage({ type: "image", content: url });
            }}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPollBuilder(true)}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Poll</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSendMessage({
                type: "location",
                content: "Shared Live Location: 31.5204° N, 74.3587° E",
              });
            }}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Location</span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-2.5 bg-[#F0F2F5] dark:bg-[#202C33] flex items-center gap-2 z-20 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full cursor-pointer"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {isRecording ? (
          <div className="flex-1 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-full flex items-center justify-between px-4 text-red-600 dark:text-red-300 text-xs font-bold animate-pulse">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-red-500" />
              <span>Recording audio ({recordingSeconds}s)...</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRecording(false)}
              className="text-xs text-gray-500 hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                handleSendMessage({ type: "text", content: text.trim() });
              }
            }}
            className="flex-1 bg-white dark:bg-[#111B21] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-2xl px-4 py-2.5 focus:outline-none"
          />
        )}

        {text.trim() ? (
          <button
            type="button"
            onClick={() => handleSendMessage({ type: "text", content: text.trim() })}
            className="p-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        ) : isRecording ? (
          <button
            type="button"
            onClick={() => {
              setIsRecording(false);
              handleSendMessage({ type: "audio", content: "Voice message clip" });
            }}
            className="p-3 bg-[#25D366] text-white rounded-full shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={() => setIsRecording(true)}
            className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full cursor-pointer hover:bg-[#25D366] hover:text-white transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
