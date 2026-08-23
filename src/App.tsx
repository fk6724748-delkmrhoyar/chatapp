/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import ChatLayout from './components/ChatLayout'; 
import InstallScreen from './components/InstallScreen';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import { useAppStore } from './lib/store';

export default function App() {
  const isInstalled = useAppStore(state => state.systemSettings.isInstalled);
  const systemSettings = useAppStore(state => state.systemSettings);
  const currentUser = useAppStore(state => state.currentUser);
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    if (systemSettings?.appName) {
      document.title = systemSettings.appName;
    } else {
      document.title = "Umar Chat";
    }
  }, [systemSettings?.appName]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!isInstalled) {
    return <InstallScreen />;
  }

  // Handle Admin Route exclusively
  if (route === '#/admin') {
    if (!currentUser) {
      return <AuthScreen isAdminRoute={true} />;
    }
    if (!currentUser.isAdmin) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100 flex-col">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have administrator privileges to view this area.</p>
          <a href="#/" className="text-blue-500 hover:underline">Return to Chat</a>
        </div>
      );
    }
    return <AdminPanel currentUser={currentUser} />;
  }

  // Normal Chat Route
  if (!currentUser) {
    return <AuthScreen />;
  }

  return <ChatLayout currentUser={currentUser} />;
}

