import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, UserProfile, SystemSettings } from './types';

interface AppState {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  
  // Data State for Local Backend
  systemSettings: SystemSettings;
  currentUser: UserProfile | null;
  users: UserProfile[];
  chats: Chat[];
  messages: Message[];

  // Actions
  installSystem: (adminData: Partial<UserProfile>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  login: (identifier: string, pass: string) => void;
  signup: (email: string, phone: string, username: string, name: string, password?: string) => void;
  logout: () => void;
  addMessage: (chatId: string, text: string, mediaType?: 'image' | 'video' | 'audio' | 'none', mediaUrl?: string) => void;
  deleteMessage: (msgId: string) => void;
  startChat: (otherUserId: string) => void;
  createGroup: (name: string, members: string[], avatarUrl?: string) => void;
  deleteUser: (uid: string) => void;
  toggleBanUser: (uid: string, isBanned: boolean) => void;
  toggleVerifyUser: (uid: string, isVerified: boolean) => void;
  updateGroup: (chatId: string, data: Partial<Chat>) => void;
  deleteGroup: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  leaveGroup: (chatId: string, userId: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addStatusView: (uid: string, viewerId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentChatId: null,
      setCurrentChatId: (id) => set({ currentChatId: id, isSidebarOpen: false }),
      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      isDarkMode: false,
      setDarkMode: (dark) => set({ isDarkMode: dark }),

      systemSettings: {
        isInstalled: false,
        chatEnabled: true,
        disabledMessage: 'The system is currently undergoing maintenance. Messaging is temporarily disabled.',
        appName: 'Umar Chat'
      },
      currentUser: null,
      users: [],
      chats: [],
      messages: [],

      installSystem: (adminData) => {
        const admin: UserProfile = {
          uid: 'admin-' + Date.now(),
          email: adminData.email || '',
          phone: adminData.phone || '',
          username: adminData.username || 'admin',
          displayName: adminData.displayName || 'Super Admin',
          photoURL: `https://ui-avatars.com/api/?name=Admin&background=00a884&color=fff`,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          isAdmin: true,
          isBanned: false,
          password: adminData.password || (adminData as any).pass || 'admin123',
        };
        set({
          users: [admin],
          currentUser: admin,
          systemSettings: { ...get().systemSettings, isInstalled: true }
        });
      },

      updateSystemSettings: (settings) => {
        set({ systemSettings: { ...get().systemSettings, ...settings } });
      },

      login: (identifier, pass) => {
        const { users } = get();
        // Login by email, phone, or username
        let user = users.find(u => 
          u.email === identifier || u.username === identifier || u.phone === identifier
        );
        
        if (!user) {
          throw new Error('User not found. Please check your credentials.');
        }
        if (user.isBanned) {
          throw new Error('Your account has been banned by the administrator.');
        }
        // Enforce password if set (users created on earlier/initial templates have empty/no passwords)
        if (user.password && user.password !== pass) {
          throw new Error('Incorrect password. Please try again.');
        }
        set({ currentUser: user });
      },

      signup: (email, phone, username, name, password) => {
        const { users } = get();
        if (users.some(u => u.username === username)) {
          throw new Error('Username already exists.');
        }
        if (users.some(u => u.email === email)) {
          throw new Error('Email already registered.');
        }
        const newUser: UserProfile = {
          uid: 'user-' + Date.now(),
          email,
          phone,
          username,
          displayName: name || username,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username)}&background=00a884&color=fff`,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          isAdmin: false,
          isBanned: false,
          password: password || '',
        };
        set({ users: [...users, newUser], currentUser: newUser });
      },

      logout: () => set({ currentUser: null, currentChatId: null, isSidebarOpen: true }),

      addMessage: (chatId, text, mediaType = 'none', mediaUrl) => {
        const { currentUser, messages, chats, systemSettings } = get();
        if (!currentUser) return;
        if (!systemSettings.chatEnabled && !currentUser.isAdmin) {
          throw new Error(systemSettings.disabledMessage);
        }
        
        const newMessage: Message = {
          id: 'msg-' + Date.now(),
          chatId,
          senderId: currentUser.uid,
          text,
          mediaType,
          mediaUrl,
          createdAt: Date.now(),
        };

        const updatedChats = chats.map(c => 
          c.id === chatId 
            ? { ...c, recentMessage: { text: mediaType !== 'none' ? `Sent ${mediaType}` : text, createdAt: Date.now() } }
            : c
        );

        set({ messages: [...messages, newMessage], chats: updatedChats });
      },

      deleteMessage: (msgId) => {
        const { messages, currentUser } = get();
        if (!currentUser) return;
        set({ messages: messages.filter(m => m.id !== msgId) });
      },

      startChat: (otherUserId) => {
        const { currentUser, chats } = get();
        if (!currentUser) return;

        const existing = chats.find(c => c.type === 'direct' && c.members.includes(currentUser.uid) && c.members.includes(otherUserId));
        if (existing) {
          set({ currentChatId: existing.id, isSidebarOpen: false });
          return;
        }

        const newChat: Chat = {
          id: 'chat-' + Date.now(),
          type: 'direct',
          name: '',
          members: [currentUser.uid, otherUserId],
          createdAt: Date.now(),
          createdBy: currentUser.uid,
        };

        set({ chats: [...chats, newChat], currentChatId: newChat.id, isSidebarOpen: false });
      },

      createGroup: (name, members, avatarUrl) => {
        const { currentUser, chats } = get();
        if (!currentUser) return;
        
        const newChat: Chat = {
          id: 'group-' + Date.now(),
          type: 'group',
          name,
          avatarUrl,
          members: [currentUser.uid, ...members],
          admins: [currentUser.uid],
          createdAt: Date.now(),
          createdBy: currentUser.uid,
        };
        set({ chats: [...chats, newChat], currentChatId: newChat.id, isSidebarOpen: false });
      },

      deleteUser: (uid) => {
        const { users, currentUser } = get();
        if (currentUser?.uid === uid) return;
        set({ users: users.filter(u => u.uid !== uid) });
      },

      toggleBanUser: (uid, isBanned) => {
        const { users, currentUser } = get();
        if (currentUser?.uid === uid) return;
        set({ users: users.map(u => u.uid === uid ? { ...u, isBanned } : u) });
      },

      toggleVerifyUser: (uid, isVerified) => {
        const { users, currentUser } = get();
        if (!currentUser?.isAdmin) return;
        set({ users: users.map(u => u.uid === uid ? { ...u, isVerified } : u) });
      },

      updateGroup: (chatId, data) => {
        const { chats } = get();
        set({
          chats: chats.map(c => c.id === chatId && c.type === 'group' ? { ...c, ...data } : c)
        });
      },

      deleteGroup: (chatId) => {
        const { chats, currentChatId } = get();
        const nextId = currentChatId === chatId ? null : currentChatId;
        set({
          chats: chats.filter(c => c.id !== chatId),
          currentChatId: nextId,
          ...(nextId === null ? { isSidebarOpen: true } : {})
        });
      },

      deleteChat: (chatId) => {
        const { chats, messages, currentChatId } = get();
        const nextId = currentChatId === chatId ? null : currentChatId;
        set({
          chats: chats.filter(c => c.id !== chatId),
          messages: messages.filter(m => m.chatId !== chatId),
          currentChatId: nextId,
          ...(nextId === null ? { isSidebarOpen: true } : {})
        });
      },

      leaveGroup: (chatId, userId) => {
        const { chats, currentChatId, currentUser } = get();
        const updatedChats = chats.map(c => {
          if (c.id === chatId && c.type === 'group') {
            return {
              ...c,
              members: c.members.filter(m => m !== userId),
              admins: c.admins ? c.admins.filter(a => a !== userId) : []
            };
          }
          return c;
        });

        const nextChatId = currentChatId === chatId && currentUser?.uid === userId ? null : currentChatId;

        set({
          chats: updatedChats,
          currentChatId: nextChatId,
          ...(nextChatId === null ? { isSidebarOpen: true } : {})
        });
      },

      updateProfile: (data) => {
        const { users, currentUser } = get();
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...data };
        set({
          currentUser: updatedUser,
          users: users.map(u => u.uid === currentUser.uid ? updatedUser : u)
        });
      },

      addStatusView: (uid, viewerId) => {
        const { users, currentUser } = get();
        const updatedUsers = users.map(u => {
          if (u.uid === uid) {
             const views = u.myStatusViews || [];
             if (!views.includes(viewerId)) {
               return { ...u, myStatusViews: [...views, viewerId] };
             }
          }
          return u;
        });
        
        const updatedCurrentUser = currentUser && currentUser.uid === uid
          ? updatedUsers.find(u => u.uid === uid) || currentUser
          : currentUser;

        set({
          users: updatedUsers,
          currentUser: updatedCurrentUser
        });
      }
    }),
    {
      name: 'umarchat-db-v2', // bumped version to clear old incompatible state
    }
  )
);
