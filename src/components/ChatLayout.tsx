import React from 'react';
import { UserProfile } from '../lib/types';
import { useAppStore } from '../lib/store';
import Sidebar from './Sidebar';
import MainChat from './MainChat';

interface ChatLayoutProps {
  currentUser: UserProfile;
}

export default function ChatLayout({ currentUser }: ChatLayoutProps) {
  const { currentChatId, isSidebarOpen, systemSettings } = useAppStore();
  const isAdmin = !!currentUser.isAdmin;
  const appName = systemSettings?.appName || "Umar Chat";
  const avatarInitials = appName ? appName.split(' ').filter(Boolean).map(n => n[0]).join('+') : "U+C";

  return (
    <div className="flex h-screen w-full bg-[#e4e1de] dark:bg-[#0b141a] overflow-hidden justify-center items-center font-sans">
      
      <div className="flex w-full h-full lg:max-w-[-webkit-fill-available] lg:max-w-[1240px] lg:h-full lg:py-6 bg-transparent overflow-hidden flex-row">
          
          {/* Main App Container for Desktop constraints */}
          <div className="flex flex-row w-full h-full bg-white dark:bg-[#111b21] shadow-2xl lg:rounded-xl overflow-hidden mx-auto lg:h-[calc(100vh-48px)]">
            {/* Sidebar */}
            <div className={`w-full lg:w-[400px] flex-shrink-0 border-r border-[#d1d7db] dark:border-[#202c33] bg-white dark:bg-[#111b21] flex-col ${!isSidebarOpen ? 'hidden lg:flex' : 'flex'}`}>
              <Sidebar currentUser={currentUser} isAdmin={isAdmin} />
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative ${isSidebarOpen ? 'hidden lg:flex' : 'flex'}`}>
              {currentChatId ? (
                <MainChat currentUser={currentUser} chatId={currentChatId} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5] dark:bg-[#202c33] border-b-[6px] border-[#25d366]">
                  <div className="w-[300px] h-[300px] relative mt-10">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(avatarInitials)}&background=25d366&color=fff&rounded=true&size=300`} alt={appName} className="mb-8 opacity-90 rounded-full shadow-2xl saturate-150" />
                  </div>
                  <h2 className="text-[32px] font-light text-[#41525d] dark:text-[#e9edef] mt-8 mb-4 tracking-wide">{appName} for Web</h2>
                  <p className="text-[#667781] dark:text-[#8696a0] max-w-md text-[15px] leading-relaxed">
                    Send and receive messages without keeping your phone online.<br/>
                    Use {appName} on up to 4 linked devices and 1 phone at the same time.
                  </p>
                  <div className="mt-16 flex items-center justify-center gap-2 text-sm text-[#8696a0] font-medium">
                     <svg viewBox="0 0 10 12" height="13" width="11" preserveAspectRatio="xMidYMid meet" className="opacity-80"><path d="M5.008 1.456c-.958 0-1.727.77-1.727 1.72v.6h3.454v-.6c0-.95-.77-1.72-1.727-1.72zm-2.927 2.32v-.6c0-1.574 1.272-2.846 2.927-2.846 1.655 0 2.927 1.272 2.927 2.845v.6h.464c.915 0 1.666.742 1.666 1.657v4.717c0 .915-.751 1.658-1.666 1.658H2.545c-.915 0-1.666-.743-1.666-1.658V5.433c0-.915.751-1.657 1.666-1.657h-.464z" fill="currentColor"></path></svg>
                     End-to-end encrypted
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
  );
}
