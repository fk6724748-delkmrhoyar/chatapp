export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  myStatus?: string;
  myStatusTime?: number;
  myStatusViews?: string[];
  createdAt: number;
  lastSeen: number;
  isAdmin?: boolean;
  isBanned?: boolean;
  isVerified?: boolean;
  password?: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string; // empty if direct
  avatarUrl?: string;
  members: string[]; // UIDs
  admins?: string[]; // UIDs of group admins
  createdAt: number;
  createdBy: string;
  recentMessage?: {
    text: string;
    createdAt: number;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'audio' | 'none';
  createdAt: number;
}

export interface SystemSettings {
  isInstalled: boolean;
  chatEnabled: boolean;
  disabledMessage: string;
  appName?: string;
}

