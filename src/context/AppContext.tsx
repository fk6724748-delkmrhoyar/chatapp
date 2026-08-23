"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  phone: string;
  name: string;
  about: string;
  photo_url: string | null;
  is_business: boolean;
  plan: "free" | "business" | "pro";
  badges: string[];
  privacy: Record<string, any>;
  settings: Record<string, any>;
  status: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeTab: "chats" | "status" | "calls" | "channels" | "settings" | "business" | "pro" | "admin";
  setActiveTab: (tab: "chats" | "status" | "calls" | "channels" | "settings" | "business" | "pro" | "admin") => void;
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  chats: any[];
  refreshChats: () => Promise<void>;
  activeCall: any | null;
  setActiveCall: (call: any | null) => void;
  logout: () => void;
  switchAccount: (targetUser: User) => void;
  linkedAccounts: User[];
  addLinkedAccount: (user: User) => void;
  activeTheme: Record<string, string>;
  applyTheme: (colors: Record<string, string>) => void;
}

const defaultTheme = {
  primary: "#075E54",
  accent: "#25D366",
  bubble_sent: "#DCF8C6",
  bubble_received: "#FFFFFF",
  background: "#ECE5DD",
  header_text: "#FFFFFF",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "status" | "calls" | "channels" | "settings" | "business" | "pro" | "admin">("chats");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<User[]>([]);
  const [activeTheme, setActiveTheme] = useState<Record<string, string>>(defaultTheme);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("wa_current_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    const savedAccounts = localStorage.getItem("wa_linked_accounts");
    if (savedAccounts) {
      try {
        setLinkedAccounts(JSON.parse(savedAccounts));
      } catch (e) {}
    }
  }, []);

  // Update localStorage and theme when user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("wa_current_user", JSON.stringify(currentUser));

      // Inject custom theme variables if Pro
      const userSettings = currentUser.settings || {};
      const customColors = userSettings.custom_theme || defaultTheme;
      setActiveTheme(customColors);
    } else {
      localStorage.removeItem("wa_current_user");
    }
  }, [currentUser]);

  // Apply CSS variables to root
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--color-wa-primary", activeTheme.primary || "#075E54");
      root.style.setProperty("--color-wa-accent", activeTheme.accent || "#25D366");
      root.style.setProperty("--color-wa-bubble-sent", activeTheme.bubble_sent || "#DCF8C6");
      root.style.setProperty("--color-wa-bubble-received", activeTheme.bubble_received || "#FFFFFF");
      root.style.setProperty("--color-wa-bg", activeTheme.background || "#ECE5DD");
      root.style.setProperty("--color-wa-header-text", activeTheme.header_text || "#FFFFFF");
    }
  }, [activeTheme]);

  const refreshChats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat/list?user_id=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setChats(json.data.chats || []);
      }
    } catch (e) {
      console.error("Failed to refresh chats", e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshChats();
      const interval = setInterval(refreshChats, 4000); // Polling for live updates
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshChats]);

  const logout = () => {
    setCurrentUser(null);
    setActiveChatId(null);
    setChats([]);
    localStorage.removeItem("wa_current_user");
  };

  const switchAccount = (targetUser: User) => {
    setCurrentUser(targetUser);
    setActiveChatId(null);
  };

  const addLinkedAccount = (user: User) => {
    const updated = [...linkedAccounts.filter((a) => a.id !== user.id), user];
    setLinkedAccounts(updated);
    localStorage.setItem("wa_linked_accounts", JSON.stringify(updated));
  };

  const applyTheme = (colors: Record<string, string>) => {
    setActiveTheme(colors);
    if (currentUser) {
      const updated = {
        ...currentUser,
        settings: {
          ...currentUser.settings,
          custom_theme: colors,
        },
      };
      setCurrentUser(updated);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        activeChatId,
        setActiveChatId,
        chats,
        refreshChats,
        activeCall,
        setActiveCall,
        logout,
        switchAccount,
        linkedAccounts,
        addLinkedAccount,
        activeTheme,
        applyTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
