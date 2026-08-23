import React, { useEffect, useState, useRef } from "react";
import { UserProfile } from "../lib/types";
import { useAppStore } from "../lib/store";
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  MoreVertical,
  ArrowLeft,
  Search,
  Image as ImageIcon,
  X,
  Camera,
  BadgeCheck,
  Users,
  UserPlus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import EmojiPicker, { Theme } from "emoji-picker-react";

function GroupInfo({
  chatId,
  onClose,
  otherUser,
}: {
  chatId: string;
  onClose: () => void;
  otherUser: UserProfile | null;
}) {
  const { chats, users, updateGroup, currentUser, systemSettings } = useAppStore();
  const appName = systemSettings?.appName || "Umar Chat";
  const chatInfo = chats.find((c) => c.id === chatId);

  const [newGroupName, setNewGroupName] = useState(chatInfo?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  if (!chatInfo) return null;

  const isAdmin =
    chatInfo.type === "group" &&
    (chatInfo.admins?.includes(currentUser?.uid || "") ||
     chatInfo.createdBy === currentUser?.uid ||
     currentUser?.isAdmin);

  const handleUpdateAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin || !e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      updateGroup(chatId, { avatarUrl: event.target?.result as string });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSaveName = () => {
    if (newGroupName.trim() && newGroupName !== chatInfo.name) {
      updateGroup(chatId, { name: newGroupName });
    }
    setIsEditingName(false);
  };

  const handleRemoveMember = (uid: string) => {
    if (!isAdmin) return;
    const memberName = users.find(x => x.uid === uid)?.displayName || "this user";
    setConfirmDialog({
      isOpen: true,
      title: "Remove Participant",
      message: `Are you sure you want to remove ${memberName} from this group?`,
      onConfirm: () => {
        updateGroup(chatId, { members: chatInfo.members.filter((m) => m !== uid) });
      }
    });
  };

  const handleToggleAdmin = (uid: string) => {
    if (!isAdmin) return;
    const isCurrentlyAdmin = chatInfo.admins?.includes(uid);
    if (isCurrentlyAdmin) {
      updateGroup(chatId, {
        admins: chatInfo.admins?.filter((a) => a !== uid),
      });
    } else {
      updateGroup(chatId, { admins: [...(chatInfo.admins || []), uid] });
    }
  };

  const isGroup = chatInfo.type === "group";
  const displayAvatar = isGroup
    ? chatInfo.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(chatInfo.name)}&background=8696a0&color=fff`
    : otherUser?.photoURL;
  const displayName = isGroup ? chatInfo.name : otherUser?.displayName;

  const [addingMember, setAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const handleAddMember = (uid: string) => {
    if (!isAdmin) return;
    updateGroup(chatId, { members: [...chatInfo.members, uid] });
    setAddingMember(false);
    setMemberSearch("");
  };

  if (addingMember) {
    const availableUsers = users.filter(
      (u) =>
        !chatInfo.members.includes(u.uid) &&
        (u.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
          u.username.toLowerCase().includes(memberSearch.toLowerCase())),
    );
    return (
      <div className="w-full lg:w-[350px] h-full bg-white dark:bg-[#111b21] flex flex-col shrink-0 border-l border-[#f0f2f5] dark:border-[#202c33] z-20 absolute lg:relative right-0">
        <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#f0f2f5] dark:border-[#202c33] shrink-0">
          <button
            onClick={() => setAddingMember(false)}
            className="text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef]"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">
            Add Members
          </h2>
        </div>
        <div className="p-3 border-b border-[#f0f2f5] dark:border-[#202c33]">
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg flex items-center px-3 py-1">
            <Search size={18} className="text-[#54656f] dark:text-[#8696a0]" />
            <input
              autoFocus
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search users"
              className="bg-transparent w-full p-2 outline-none text-sm text-[#111b21] dark:text-[#e9edef]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {availableUsers.map((u) => (
            <div
              key={u.uid}
              onClick={() => handleAddMember(u.uid)}
              className="flex items-center px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer"
            >
              <img
                src={u.photoURL}
                className="w-10 h-10 rounded-full mr-4 object-cover"
              />
              <div className="flex-1">
                <div className="font-medium text-[#111b21] dark:text-[#e9edef]">
                  {u.displayName}
                </div>
                <div className="text-xs text-[#667781]">@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[350px] h-full bg-white dark:bg-[#0b141a] flex flex-col shrink-0 border-l border-[#f0f2f5] dark:border-[#202c33] z-20 absolute lg:relative right-0">
      <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#f0f2f5] dark:border-[#202c33] shrink-0">
        <button
          onClick={onClose}
          className="text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef]"
        >
          <X size={24} />
        </button>
        <h2 className="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">
          Contact info
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-[#111b21] p-6 flex flex-col items-center shadow-sm mb-2 relative group">
          <img
            src={displayAvatar}
            className={`w-48 h-48 rounded-full object-cover shadow-md mb-4 ${isAdmin && isGroup ? "cursor-pointer hover:opacity-80" : ""}`}
            onClick={() => isAdmin && isGroup && fileInputRef.current?.click()}
          />
          {isAdmin && isGroup && (
            <div className="absolute top-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2a3942] rounded-full p-2 text-gray-500 hover:text-gray-800 cursor-pointer shadow-xl hidden group-hover:block pointer-events-none">
              <Camera size={20} />
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUpdateAvatar}
          />

          {isEditingName && isGroup ? (
            <div className="flex items-center w-full gap-2 px-6">
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-transparent border-b-2 border-[#00a884] text-center text-[20px] outline-none"
              />
              <button onClick={handleSaveName} className="text-[#00a884]">
                <BadgeCheck size={24} />
              </button>
            </div>
          ) : (
            <h2
              className="text-[22px] font-medium text-[#111b21] dark:text-[#e9edef] flex items-center gap-1 cursor-pointer"
              onClick={() => isAdmin && isGroup && setIsEditingName(true)}
            >
              {displayName}
              {isGroup && isAdmin && (
                <span className="text-gray-400 opacity-50 ml-1">
                  <Camera size={16} />
                </span>
              )}
              {!isGroup && otherUser?.isVerified && (
                <BadgeCheck
                  size={18}
                  className="text-white fill-[#1da1f2] shrink-0"
                />
              )}
            </h2>
          )}

          {!isGroup && (
            <p className="text-[15px] font-medium text-[#667781] mt-1">
              {otherUser?.email}
            </p>
          )}
          {!isGroup && otherUser?.phone && (
            <p className="text-[15px] text-[#667781]">{otherUser?.phone}</p>
          )}
          {isGroup && (
            <p className="text-[15px] text-[#667781] mt-1">
              Group · {chatInfo.members.length} participants
            </p>
          )}
        </div>

        {!isGroup && (
          <div className="bg-white dark:bg-[#111b21] p-4 shadow-sm mb-2">
            <div className="text-[14px] text-[#00a884] font-medium mb-1">
              About
            </div>
            <div className="text-[16px] text-[#111b21] dark:text-[#e9edef]">
              {otherUser?.bio || `Hey there! I am using ${appName}.`}
            </div>
          </div>
        )}

        {isGroup && (
          <div className="bg-white dark:bg-[#111b21] shadow-sm mb-2 flex flex-col">
            <div className="text-[14px] text-[#8696a0] font-medium px-6 py-4 flex items-center justify-between">
              <span>{chatInfo.members.length} participants</span>
            </div>
            <div className="flex flex-col">
              {isAdmin && (
                <div
                  onClick={() => setAddingMember(true)}
                  className="flex items-center px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white mr-4">
                    <UserPlus size={20} />
                  </div>
                  <div className="font-medium text-[16px] text-[#111b21] dark:text-[#e9edef]">
                    Add members
                  </div>
                </div>
              )}
              {chatInfo.members.map((memberId) => {
                const u = users.find((x) => x.uid === memberId);
                if (!u) return null;
                const memberIsAdmin = chatInfo.admins?.includes(u.uid);
                const isMe = u.uid === currentUser?.uid;

                return (
                  <div
                    key={u.uid}
                    className="flex items-center px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] group transition-colors cursor-pointer"
                  >
                    <img
                      src={u.photoURL}
                      className="w-10 h-10 rounded-full mr-4 object-cover"
                    />
                    <div className="flex-1 truncate">
                      <div className="font-medium text-[16px] text-[#111b21] dark:text-[#e9edef] flex items-center gap-1">
                        {isMe ? "You" : u.displayName}
                        {u.isVerified && (
                          <BadgeCheck
                            size={14}
                            className="text-white fill-[#1da1f2] shrink-0"
                          />
                        )}
                      </div>
                      <div className="text-[13px] text-[#667781] truncate">
                        {u.bio || "Available"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {memberIsAdmin && (
                        <span className="text-[11px] font-medium text-[#00a884] border border-[#00a884] px-1 rounded truncate">
                          Group Admin
                        </span>
                      )}
                      {isAdmin && !isMe && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAdmin(u.uid);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-[#00a884] transition-colors"
                            title={memberIsAdmin ? "Demote Admin" : "Make Admin"}
                          >
                            <ShieldCheck size={16} className={memberIsAdmin ? "text-[#00a884]" : ""} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(u.uid);
                            }}
                            className="p-1.5 hover:bg-red-50 to-transparent dark:hover:bg-red-950/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove from Group"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isGroup && (
          <div className="p-4 bg-white dark:bg-[#111b21] shadow-sm flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: "Leave Group",
                  message: "Are you sure you want to leave this group? You will no longer receive or send messages here.",
                  onConfirm: () => {
                    useAppStore.getState().leaveGroup(chatId, currentUser?.uid || "");
                    onClose();
                  }
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors font-medium text-sm"
            >
              <LogOut size={16} />
              Leave Group
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: "Delete Group permanently",
                    message: "Are you sure you want to delete this group permanently? All history and data will be gone forever.",
                    onConfirm: () => {
                      useAppStore.getState().deleteGroup(chatId);
                      onClose();
                    }
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm shadow-sm"
              >
                <Trash2 size={16} />
                Delete Group
              </button>
            )}
          </div>
        )}

        {!isGroup && (
          <div className="p-4 bg-white dark:bg-[#111b21] shadow-sm flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: "Delete Chat Conversation",
                  message: "Are you sure you want to delete this chat conversation? All messages will be permanently cleared from your view.",
                  onConfirm: () => {
                    useAppStore.getState().deleteChat(chatId);
                    onClose();
                  }
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm shadow-sm"
            >
              <Trash2 size={16} />
              Delete Chat
            </button>
          </div>
        )}
      </div>

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-[#222e35] rounded-2xl max-w-xs w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MainChat({
  currentUser,
  chatId,
}: {
  currentUser: UserProfile;
  chatId: string;
}) {
  const {
    chats,
    messages,
    users,
    addMessage,
    setSidebarOpen,
    systemSettings,
    isDarkMode,
  } = useAppStore();
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const chatInfo = chats.find((c) => c.id === chatId);

  let otherUser: UserProfile | null = null;
  if (chatInfo?.type === "direct") {
    const otherId = chatInfo.members.find((m) => m !== currentUser.uid);
    otherUser = users.find((u) => u.uid === otherId) || null;
  }

  const chatName =
    chatInfo?.type === "group"
      ? chatInfo.name
      : otherUser?.displayName || "User";
  const chatAvatar =
    chatInfo?.type === "group"
      ? chatInfo.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(chatInfo.name)}&background=8696a0&color=fff`
      : otherUser?.photoURL;
  const isInputMuted = !systemSettings.chatEnabled && !currentUser.isAdmin;

  const chatMessages = messages
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => a.createdAt - b.createdAt);

  useEffect(() => {
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [chatMessages.length, chatId]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isInputMuted) return;
    addMessage(chatId, text);
    setText("");
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInputMuted || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      addMessage(chatId, "Image", "image", result);
    };
    reader.readAsDataURL(file);
    setMenuOpen(false);
  };

  const startRecording = async () => {
    if (isInputMuted) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        clearInterval(recordingTimerRef.current);
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = (e) => {
          addMessage(
            chatId,
            `Voice message (${formatDuration(recordingDuration)})`,
            "audio",
            e.target?.result as string,
          );
        };
        reader.readAsDataURL(audioBlob);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
    } catch (error: any) {
      console.error("Microphone access denied or error occurred", error);
      alert(
        "Could not access microphone. If you are in a preview, please open the application in a new tab to enable microphone access.",
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.onstop = null; // Prevent sending
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex w-full h-full relative overflow-hidden">
      <div
        className={`flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative flex-1 transition-all ${showGroupInfo ? "hidden border-r dark:border-[#202c33] border-[#f0f2f5] lg:flex lg:w-[calc(100%-350px)]" : "w-full"} overflow-hidden`}
      >
        <div
          className="absolute inset-0 z-0 opacity-[0.06] dark:opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'url("https://www.transparenttextures.com/patterns/cubes.png")',
            backgroundRepeat: "repeat",
          }}
        />

        <div className="h-[60px] bg-white dark:bg-[#0b141a] px-4 flex items-center justify-between z-10 border-b border-[#f0f2f5] dark:border-[#202c33] shrink-0">
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => setShowGroupInfo(true)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(true);
              }}
              className="lg:hidden text-[#111b21] dark:text-white mr-3"
            >
              <ArrowLeft size={24} />
            </button>
            <img
              src={chatAvatar}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover mr-3 shrink-0 shadow-sm"
            />
            <div className="flex-1 truncate">
              <h3 className="text-[17px] font-medium text-[#111b21] dark:text-[#e9edef] leading-tight flex items-center gap-1">
                {chatName}
                {chatInfo?.type === "direct" && otherUser?.isVerified && (
                  <BadgeCheck
                    size={16}
                    className="text-white fill-[#1da1f2] shrink-0"
                  />
                )}
              </h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] truncate">
                {chatInfo?.type === "group"
                  ? chatInfo.members
                      .map(
                        (mid) => users.find((u) => u.uid === mid)?.displayName,
                      )
                      .join(", ")
                  : "Tap here for contact info"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[#54656f] dark:text-white shrink-0">
            <MoreVertical
              size={22}
              className="cursor-pointer hover:opacity-80 disabled:opacity-50"
            />
          </div>
        </div>

        {isInputMuted && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-600 px-4 py-2 text-sm text-center font-medium z-10 shadow-sm border-b border-yellow-200 dark:border-yellow-800/50">
            {systemSettings.disabledMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 flex flex-col gap-2 min-h-0">
          <div className="self-center bg-[#d1f4ff] dark:bg-[#182229] px-3 py-1 rounded-lg shadow-sm text-[11px] text-[#54656f] dark:text-[#8696a0] mb-2 uppercase">
            Started on{" "}
            {chatInfo ? format(new Date(chatInfo.createdAt), "PP") : ""}
          </div>
          {chatMessages.map((msg) => {
            const isMine = msg.senderId === currentUser.uid;
            const msgSender = users.find((u) => u.uid === msg.senderId);
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setConfirmDialog({
                    isOpen: true,
                    title: "Delete Message",
                    message: "Are you sure you want to delete this message? This action is instant.",
                    onConfirm: () => {
                      useAppStore.getState().deleteMessage(msg.id);
                      if (activeMsgId === msg.id) {
                        setActiveMsgId(null);
                      }
                    }
                  });
                }}
              >
                <div
                  onClick={() => {
                    setActiveMsgId(activeMsgId === msg.id ? null : msg.id);
                  }}
                  className={`max-w-[85%] sm:max-w-[75%] p-1.5 pb-2 rounded-lg shadow-sm relative group cursor-pointer hover:opacity-95 transition-all select-none ${
                    isMine
                      ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none"
                      : "bg-white dark:bg-[#202c33] rounded-tl-none"
                  }`}
                >
                  {activeMsgId === msg.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialog({
                          isOpen: true,
                          title: "Delete Message",
                          message: "Are you sure you want to delete this message? This action is instant.",
                          onConfirm: () => {
                            useAppStore.getState().deleteMessage(msg.id);
                            setActiveMsgId(null);
                          }
                        });
                      }}
                      className="absolute -top-3 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg z-[40] hover:bg-red-600 transition-transform scale-100 active:scale-95 animate-bounce"
                      title="Delete message"
                    >
                      <Trash2 size={13} className="shrink-0" />
                    </button>
                  )}
                  {!isMine && chatInfo?.type === "group" && (
                    <p className="text-[13px] font-medium text-[#e542a3] mb-0.5 px-1 pt-0.5">
                      {msgSender?.displayName || "User"}
                    </p>
                  )}

                  {msg.mediaType === "image" && msg.mediaUrl && (
                    <div className="mb-1 rounded overflow-hidden">
                      <img
                        src={msg.mediaUrl}
                        alt="Attached"
                        className="w-[300px] max-w-full h-auto rounded-md object-cover"
                      />
                    </div>
                  )}

                  {msg.mediaType === "audio" && (
                    <div className="flex items-center gap-3 mb-1 min-w-[200px] text-[#54656f] dark:text-[#8696a0] px-1 py-1">
                      <audio
                        controls
                        src={msg.mediaUrl}
                        className="w-full max-w-[240px] h-10"
                      />
                    </div>
                  )}

                  <div
                    className={`text-[14.2px] text-[#111b21] dark:text-[#e9edef] px-1.5 break-words w-full`}
                  >
                    {msg.text !== "Image" ? msg.text : ""}
                    <span className="inline-block w-[70px] h-1" />
                  </div>
                  <div
                    className={`text-[11px] text-[#667781] dark:text-[#ffffff99] flex items-center justify-end px-1.5 ${msg.mediaType !== "none" ? "mt-1" : "absolute bottom-1 right-1.5"}`}
                  >
                    {msg.createdAt
                      ? format(new Date(msg.createdAt), "HH:mm")
                      : "..."}
                    {isMine && (
                      <span className="ml-1 text-[#8696a0] font-bold tracking-tighter">
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-[70px] left-4 z-50 shadow-xl border border-[#f0f2f5] dark:border-[#202c33] rounded-lg">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setText((prev) => prev + emojiData.emoji);
                setShowEmojiPicker(false);
              }}
              theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
            />
          </div>
        )}
        <div className="bg-white dark:bg-[#0b141a] px-2 py-2 flex items-center gap-2 z-10 w-full shrink-0 relative">
          <div className="flex-1 bg-[#f0f2f5] dark:bg-[#202c33] rounded-[24px] flex items-center px-2 py-1 min-h-[44px]">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-2 text-[#54656f] dark:text-[#aebac1]">
              <Smile
                size={24}
                className="cursor-pointer ml-1 hover:text-[#00a884] transition-colors"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
            </div>

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between text-[#54656f] dark:text-[#aebac1]">
                <div className="flex items-center gap-3 animate-pulse text-red-500 font-medium tracking-widest pl-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  {formatDuration(recordingDuration)}
                </div>
                <button
                  onClick={cancelRecording}
                  className="text-red-500 hover:text-red-600 font-medium px-4"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex-1 mx-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isInputMuted}
                  placeholder={
                    isInputMuted ? "Messaging is disabled" : "Message"
                  }
                  className="w-full bg-transparent outline-none text-[16px] text-[#111b21] dark:text-[#e9edef] disabled:opacity-75 placeholder-[#8696a0]"
                />
              </form>
            )}

            {!isRecording && (
              <div className="flex items-center gap-4 mr-2 text-[#54656f] dark:text-[#aebac1]">
                <button
                  disabled={isInputMuted}
                  onClick={() => fileInputRef.current?.click()}
                  className="focus:outline-none disabled:opacity-50"
                >
                  <Paperclip
                    size={22}
                    className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300 transform -rotate-45"
                  />
                </button>
                <Camera
                  size={22}
                  className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
                />
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-center">
            {text.trim() && !isInputMuted ? (
              <button
                onClick={handleSend}
                className="w-[44px] h-[44px] bg-[#25d366] rounded-full flex items-center justify-center text-white hover:bg-[#20c359] focus:outline-none shadow-sm transition-transform active:scale-95"
              >
                <Send size={20} className="translate-x-0.5" />
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                className="w-[44px] h-[44px] bg-[#25d366] text-white rounded-full flex items-center justify-center animate-bounce shadow-sm focus:outline-none transition-transform active:scale-95"
              >
                <Send size={20} className="translate-x-[2px]" />
              </button>
            ) : (
              <button
                disabled={isInputMuted}
                onClick={startRecording}
                className="w-[44px] h-[44px] bg-[#25d366] text-white rounded-full flex items-center justify-center focus:outline-none hover:bg-[#20c359] shadow-sm transition-transform active:scale-95"
              >
                <Mic size={22} />
              </button>
            )}
          </div>
        </div>
      </div>{" "}
      {/* End Main Chat Content */}
      {showGroupInfo && (
        <GroupInfo
          chatId={chatId}
          otherUser={otherUser}
          onClose={() => setShowGroupInfo(false)}
        />
      )}

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-[#222e35] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
