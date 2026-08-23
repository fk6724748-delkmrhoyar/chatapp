import React, { useState } from 'react';
import { UserProfile } from '../lib/types';
import { useAppStore } from '../lib/store';
import { ArrowLeft, Trash2, ShieldBan, Shield, Users, MessageSquare, Database, Settings, BarChart3, AlertCircle, BadgeCheck, Menu, X } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPanel({ currentUser }: { currentUser: UserProfile }) {
  const { users, chats, messages, systemSettings, updateSystemSettings, toggleBanUser, toggleVerifyUser, deleteUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ message: '', isError: false });
  const updateProfile = useAppStore(state => state.updateProfile);

  const handleChangeAdminPassword = () => {
    setPasswordStatus({ message: '', isError: false });
    if (!newAdminPassword) {
      setPasswordStatus({ message: 'Please enter a new password.', isError: true });
      return;
    }
    if (newAdminPassword.length < 4) {
      setPasswordStatus({ message: 'Password must be at least 4 characters long.', isError: true });
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordStatus({ message: 'Passwords do not match.', isError: true });
      return;
    }
    
    try {
      updateProfile({ password: newAdminPassword });
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setPasswordStatus({ message: 'Super Admin password updated successfully!', isError: false });
      setTimeout(() => setPasswordStatus({ message: '', isError: false }), 4000);
    } catch (err: any) {
      setPasswordStatus({ message: err.message || 'Something went wrong.', isError: true });
    }
  };

  const handleDeleteUser = (uid: string) => {
    const targetUser = users.find(u => u.uid === uid);
    const targetName = targetUser?.displayName || "this user";
    setConfirmDialog({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to delete ${targetName}? All their messages will remain but user profile data will be gone forever. This cannot be undone.`,
      onConfirm: () => {
        deleteUser(uid);
      }
    });
  };

  const handleToggleBan = (uid: string, isBanned: boolean) => {
    toggleBanUser(uid, !isBanned);
  };

  const handleToggleVerify = (uid: string, isVerified: boolean) => {
    toggleVerifyUser(uid, !isVerified);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f0f2f5] dark:bg-[#0b141a] font-sans overflow-hidden">
      
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="md:hidden h-[60px] bg-[#008069] dark:bg-[#202c33] flex items-center justify-between px-4 text-white shrink-0 shadow-sm z-20 relative">
         <div className="flex items-center gap-3">
           <button onClick={() => window.location.hash = '#/'} className="hover:opacity-80"><ArrowLeft size={24} /></button>
           <h2 className="text-lg font-medium">Admin Dashboard</h2>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
           {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
         </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`absolute md:relative z-10 w-[280px] h-[calc(100vh-60px)] md:h-screen bg-[#111b21] text-white flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}`}>
        <div className="hidden md:flex h-[108px] bg-[#008069] dark:bg-[#202c33] items-center px-6 shrink-0 shadow-sm border-b dark:border-[#313d45]">
           <button onClick={() => window.location.hash = '#/'} className="mr-4 hover:opacity-80"><ArrowLeft size={24} /></button>
           <div>
              <h2 className="text-xl font-medium">Dashboard</h2>
              <div className="text-[12px] opacity-80 font-mono tracking-wider">v2.1.0-umar</div>
           </div>
        </div>
        
        <div className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto">
           <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-[#00a884] text-white' : 'text-gray-300 hover:bg-[#202c33]'}`}>
             <BarChart3 size={20} /> <span className="font-medium">Overview</span>
           </button>
           <button onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-[#00a884] text-white' : 'text-gray-300 hover:bg-[#202c33]'}`}>
             <Users size={20} /> <span className="font-medium">Manage Users</span>
           </button>
           <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-[#00a884] text-white' : 'text-gray-300 hover:bg-[#202c33]'}`}>
             <Settings size={20} /> <span className="font-medium">System Settings</span>
           </button>
        </div>
        
        <div className="p-6 border-t border-gray-800 flex items-center gap-3 shrink-0">
           <img src={currentUser.photoURL} className="w-10 h-10 rounded-full" />
           <div>
             <div className="text-sm font-medium">{currentUser.displayName}</div>
             <div className="text-xs text-[#00a884] uppercase tracking-wider font-bold">Admin Privileges</div>
           </div>
        </div>
      </div>

      {/* Overlay for mobile when menu is open */}
      {mobileMenuOpen && (
         <div className="md:hidden absolute inset-0 bg-black/50 z-0 top-[60px]" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] dark:bg-[#111b21] relative w-full overflow-x-hidden">
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'overview' && (
            <div className="space-y-6">
               <h1 className="text-2xl font-semibold text-[#111b21] dark:text-[#e9edef] mb-6">System Overview</h1>
               
               {/* Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-[#202c33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45]">
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                         <Users size={24} />
                       </div>
                    </div>
                    <div className="text-4xl font-light text-[#111b21] dark:text-[#e9edef] mb-1">{users.length}</div>
                    <div className="text-[13px] font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wider">Total Registered Users</div>
                 </div>

                 <div className="bg-white dark:bg-[#202c33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45]">
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                         <MessageSquare size={24} />
                       </div>
                    </div>
                    <div className="text-4xl font-light text-[#111b21] dark:text-[#e9edef] mb-1">{chats.length}</div>
                    <div className="text-[13px] font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wider">Active Chat Sessions</div>
                 </div>

                 <div className="bg-white dark:bg-[#202c33] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45]">
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                         <Database size={24} />
                       </div>
                    </div>
                    <div className="text-4xl font-light text-[#111b21] dark:text-[#e9edef] mb-1">{messages.length}</div>
                    <div className="text-[13px] font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wider">Total Messages Sent</div>
                 </div>
               </div>

               {/* Recent Users */}
               <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45] mt-8 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 dark:border-[#313d45] bg-gray-50 dark:bg-[#182229]">
                    <h3 className="font-semibold text-[#111b21] dark:text-[#e9edef]">Newest Users</h3>
                 </div>
                 <div className="p-0">
                    {users.slice().reverse().slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center gap-4 px-6 py-4 border-b border-[#f0f2f5] dark:border-[#313d45] last:border-0 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                        <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        <div className="flex-1">
                           <div className="font-medium text-[#111b21] dark:text-[#e9edef] flex items-center gap-2">
                             {u.displayName}
                             {u.isAdmin && <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Admin</span>}
                           </div>
                           <div className="text-xs text-[#667781] dark:text-[#8696a0]">@{u.username} • {u.email}</div>
                        </div>
                        <div className="text-sm text-[#667781] dark:text-[#8696a0]">
                           {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
               <h1 className="text-2xl font-semibold text-[#111b21] dark:text-[#e9edef] mb-6">User Management</h1>
               <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45] overflow-x-auto w-full">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                   <thead>
                     <tr className="bg-gray-50 dark:bg-[#182229] border-b border-gray-200 dark:border-[#313d45]">
                       <th className="px-6 py-4 text-[12px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-widest">User</th>
                       <th className="px-6 py-4 text-[12px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-widest hidden sm:table-cell">Contact</th>
                       <th className="px-6 py-4 text-[12px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-[12px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-widest text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {users.map(u => (
                       <tr key={u.uid} className="border-b border-gray-100 dark:border-[#313d45] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                               <div>
                                 <div className="font-medium text-[#111b21] dark:text-[#e9edef] flex items-center gap-2">
                                   {u.displayName}
                                   {u.isVerified && <BadgeCheck size={16} className="text-white fill-[#1da1f2] shrink-0" />}
                                   {u.isAdmin && <Shield size={14} className="text-[#00a884]" />}
                                 </div>
                                 <div className="text-xs text-[#667781] dark:text-[#8696a0]">Joined {format(new Date(u.createdAt), 'PP')}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4 hidden sm:table-cell">
                            <div className="text-sm text-[#3b4a54] dark:text-[#e9edef]">{u.email}</div>
                            <div className="text-xs text-[#667781] dark:text-[#8696a0]">{u.phone || 'No phone'}</div>
                         </td>
                         <td className="px-6 py-4">
                            {u.isBanned ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                                  <ShieldBan size={12} /> Banned
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-[#00a884] border border-green-200 dark:border-green-800/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#00a884]"></span> Active
                               </span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.uid !== currentUser.uid && !u.isAdmin && (
                                <button 
                                  onClick={() => handleToggleVerify(u.uid, !!u.isVerified)} 
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${u.isVerified ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40' : 'bg-gray-100 dark:bg-[#313d45] border-gray-200 dark:border-[#313d45] text-gray-700 dark:text-[#e9edef] hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                >
                                  {u.isVerified ? 'Remove Tick' : 'Give Tick'}
                                </button>
                              )}
                              {u.uid !== currentUser.uid && !u.isAdmin && (
                                <button 
                                  onClick={() => handleToggleBan(u.uid, !!u.isBanned)} 
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${u.isBanned ? 'bg-gray-100 dark:bg-[#313d45] border-gray-200 dark:border-[#313d45] text-gray-700 dark:text-[#e9edef] hover:bg-gray-200 dark:hover:bg-gray-600' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                                >
                                  {u.isBanned ? 'Unban' : 'Ban'}
                                </button>
                              )}
                              {u.uid !== currentUser.uid && (
                                <button 
                                  onClick={() => handleDeleteUser(u.uid)} 
                                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
               <h1 className="text-2xl font-semibold text-[#111b21] dark:text-[#e9edef] mb-6">System Settings</h1>

               {/* Change Admin Password Card */}
               <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45] p-6 lg:p-8 mb-6">
                  <div className="flex items-start gap-4 mb-8">
                     <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center shrink-0">
                        <Settings size={22} className="rotate-45" />
                     </div>
                     <div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-[#e9edef]">Change Admin Password</h3>
                        <p className="text-sm text-[#667781] dark:text-[#8696a0] mt-1">
                           Set a new secure password for accessing the administrator dashboard and administrator login.
                        </p>
                     </div>
                  </div>

                  <div className="space-y-6 pl-0 md:pl-16 font-sans">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[13px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-wider mb-2">New Password *</label>
                           <input 
                              type="password"
                              className="w-full p-3 border border-[#d1d7db] dark:border-[#313d45] bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] transition-colors text-[15px]"
                              value={newAdminPassword}
                              onChange={(e) => setNewAdminPassword(e.target.value)}
                              placeholder="Min 4 characters"
                           />
                        </div>
                        <div>
                           <label className="block text-[13px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-wider mb-2">Confirm Password *</label>
                           <input 
                              type="password"
                              className="w-full p-3 border border-[#d1d7db] dark:border-[#313d45] bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] transition-colors text-[15px]"
                              value={confirmAdminPassword}
                              onChange={(e) => setConfirmAdminPassword(e.target.value)}
                              placeholder="Confirm new password"
                           />
                        </div>
                     </div>

                     {passwordStatus.message && (
                        <div className={`p-3 rounded-lg text-sm border ${passwordStatus.isError ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/10 dark:border-red-900/50' : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950/10 dark:border-green-900/50'}`}>
                           {passwordStatus.message}
                        </div>
                     )}

                     <button
                        onClick={handleChangeAdminPassword}
                        className="px-6 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold rounded-lg shadow-sm transition-colors text-sm hover:cursor-pointer"
                     >
                        Update Password
                     </button>
                  </div>
               </div>
               
               <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm border border-gray-100 dark:border-[#313d45] p-6 lg:p-8">
                  <div className="flex items-start gap-4 mb-8">
                     <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center shrink-0">
                        <AlertCircle size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-[#e9edef]">Global Messaging Kill Switch</h3>
                        <p className="text-sm text-[#667781] dark:text-[#8696a0] mt-1">
                          Turning this off will immediately prevent all non-admin users from sending messages anywhere on the platform. Useful for maintenance or security lockdowns.
                        </p>
                     </div>
                  </div>

                  <div className="space-y-6 pl-0 md:pl-16">
                     <div>
                        <label className="block text-[13px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-wider mb-2">Application Name</label>
                        <input 
                           type="text"
                           className="w-full p-3 border border-[#d1d7db] dark:border-[#313d45] bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] transition-colors text-[15px]"
                           value={systemSettings.appName || ""}
                           onChange={(e) => updateSystemSettings({ appName: e.target.value })}
                           placeholder="Enter Application Name (e.g., Umar Chat)"
                        />
                        <p className="mt-2 text-xs text-[#667781] dark:text-[#8696a0]">This name will display on headers, login screens, profiles, and welcome screens everywhere.</p>
                     </div>

                     <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#313d45] rounded-xl bg-gray-50 dark:bg-[#182229]">
                        <div>
                          <div className="font-medium text-[#111b21] dark:text-[#e9edef] mb-1">Instant Messaging Enabled</div>
                          <div className="text-[13px] text-[#667781] dark:text-[#8696a0]">Current status: {systemSettings.chatEnabled ? 'Active' : 'Disabled'}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={systemSettings.chatEnabled}
                            onChange={(e) => updateSystemSettings({ chatEnabled: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-[#313d45] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00a884]"></div>
                        </label>
                     </div>

                     <div>
                        <label className="block text-[13px] font-bold text-[#54656f] dark:text-[#aebac1] uppercase tracking-wider mb-2">Maintenance Message</label>
                        <textarea 
                           className="w-full h-24 p-3 border border-gray-300 dark:border-[#313d45] bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] transition-colors resize-none text-[15px]"
                           value={systemSettings.disabledMessage}
                           onChange={(e) => updateSystemSettings({ disabledMessage: e.target.value })}
                           placeholder="Message shown to users when chat is disabled..."
                        />
                        <p className="mt-2 text-xs text-[#667781] dark:text-[#8696a0]">This message will be displayed in chat windows when messaging is disabled.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-[#222e35] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-sans">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed font-sans mt-2">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end font-sans mt-4">
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
