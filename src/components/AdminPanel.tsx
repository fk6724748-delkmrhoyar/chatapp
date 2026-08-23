"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Shield,
  Users,
  CreditCard,
  Flag,
  MessageSquare,
  Megaphone,
  Settings,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Ban,
  Search,
  Crown,
  Briefcase,
  DollarSign,
  BarChart,
  LogOut,
  ArrowLeft,
  X,
} from "lucide-react";

export default function AdminPanel({ onExit }: { onClose?: () => void; onExit: () => void }) {
  const { setCurrentUser } = useApp();

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [adminAuthError, setAdminPasswordError] = useState("");

  const [activeSection, setActiveSection] = useState<
    "dashboard" | "users" | "payments" | "flags" | "chats" | "broadcast" | "settings" | "logs"
  >("dashboard");

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [flagsList, setFlagsList] = useState<any[]>([]);
  const [appSettingsData, setAppSettingsData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter
  const [userQuery, setUserQuery] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("all");

  // Payment proof lightbox
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Broadcast composer
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("all");

  // Chat monitor
  const [monitoredMsgs, setMonitoredMsgs] = useState<any[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAdminLoggedIn(true);
        loadDashboardData();
      } else {
        setAdminPasswordError(json.error?.message || "Invalid credentials");
      }
    } catch (e: any) {
      setAdminPasswordError(e.message || "Failed to login as admin");
    }
  };

  const loadDashboardData = async () => {
    try {
      const statsRes = await (await fetch("/api/admin/stats")).json();
      if (statsRes.success) setStats(statsRes.data.stats);

      const usersRes = await (await fetch("/api/admin/users")).json();
      if (usersRes.success) setUsersList(usersRes.data.users || []);

      const paymentsRes = await (await fetch("/api/admin/payments")).json();
      if (paymentsRes.success) setPaymentsList(paymentsRes.data.payments || []);

      const flagsRes = await (await fetch("/api/admin/flags")).json();
      if (flagsRes.success) setFlagsList(flagsRes.data.flags || []);

      const settingsRes = await (await fetch("/api/admin/settings")).json();
      if (settingsRes.success) setAppSettingsData(settingsRes.data.settings);

      const logsRes = await (await fetch("/api/admin/logs")).json();
      if (logsRes.success) setAuditLogs(logsRes.data.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadDashboardData();
    }
  }, [isAdminLoggedIn]);

  const handleUserAction = async (action: string, userId: string, extra: any = {}) => {
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, user_id: userId, ...extra }),
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaymentReview = async (paymentId: string, action: "approve" | "reject", reason?: string) => {
    try {
      await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payment_id: paymentId, reason }),
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFlag = async (key: string, enabled_for: string[]) => {
    try {
      await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, scope: "plan", enabled_for }),
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg.trim(), audience: broadcastAudience }),
      });
      alert("Broadcast announcement sent successfully!");
      setBroadcastMsg("");
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchChats = async () => {
    if (!chatSearchQuery.trim()) return;
    try {
      const res = await fetch(`/api/admin/chats?q=${encodeURIComponent(chatSearchQuery)}`);
      const json = await res.json();
      if (json.success) {
        setMonitoredMsgs(json.data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B141A] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1F2C34] p-8 rounded-3xl shadow-2xl border border-gray-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#25D366] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Shield className="w-9 h-9" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Control Center</h1>
            <p className="text-xs text-gray-400">Sign in with system administrator credentials</p>
          </div>

          {adminAuthError && (
            <div className="p-3 text-xs bg-red-900/40 text-red-300 rounded-xl border border-red-800 text-center">
              {adminAuthError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full p-3 bg-[#111B21] border border-gray-700 text-white text-sm rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-3 bg-[#111B21] border border-gray-700 text-white text-sm rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl shadow-lg cursor-pointer"
            >
              Sign In to Admin
            </button>
          </form>

          <button
            type="button"
            onClick={onExit}
            className="w-full text-center text-xs text-gray-400 hover:underline cursor-pointer"
          >
            ← Exit to WhatsApp Client
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesQuery = !userQuery || u.name.toLowerCase().includes(userQuery.toLowerCase()) || u.phone.includes(userQuery);
    const matchesPlan = userPlanFilter === "all" || u.plan === userPlanFilter;
    return matchesQuery && matchesPlan;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#111B21] text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-[#1F2C34] p-4 flex flex-col justify-between border-r border-gray-800 flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#25D366] text-white rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-wide text-white">Platform Admin</span>
            </div>
            <button
              type="button"
              onClick={onExit}
              title="Return to User App"
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart },
              { id: "users", label: "User Management", icon: Users },
              { id: "payments", label: "Payments Queue", icon: CreditCard },
              { id: "flags", label: "Feature Flags", icon: Flag },
              { id: "chats", label: "Chat Monitoring", icon: MessageSquare },
              { id: "broadcast", label: "Announcements", icon: Megaphone },
              { id: "settings", label: "App Settings", icon: Settings },
              { id: "logs", label: "Audit Logs", icon: FileText },
            ].map((item: any) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? "bg-[#25D366] text-white font-bold"
                      : "text-gray-400 hover:bg-[#202C33] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setIsAdminLoggedIn(false)}
          className="flex items-center gap-2 text-xs font-bold text-red-400 hover:bg-red-950/30 p-2.5 rounded-xl cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 bg-[#0B141A] p-6 overflow-y-auto">
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-white">System Dashboard</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#1F2C34] rounded-2xl border border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.total_users || 0}</p>
                <p className="text-[10px] text-emerald-400 mt-1">Active Accounts</p>
              </div>

              <div className="p-4 bg-[#1F2C34] rounded-2xl border border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{stats?.pending_payments_count || 0}</p>
                <p className="text-[10px] text-gray-400 mt-1">Awaiting Review</p>
              </div>

              <div className="p-4 bg-[#1F2C34] rounded-2xl border border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">PKR {stats?.total_revenue || 0}</p>
                <p className="text-[10px] text-gray-400 mt-1">Lifetime Revenue</p>
              </div>

              <div className="p-4 bg-[#1F2C34] rounded-2xl border border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase">Messages Today</p>
                <p className="text-2xl font-bold text-sky-400 mt-1">{stats?.messages_today || 0}</p>
                <p className="text-[10px] text-gray-400 mt-1">Platform Activity</p>
              </div>
            </div>

            {/* User Breakdown */}
            <div className="p-5 bg-[#1F2C34] rounded-2xl border border-gray-800 space-y-3">
              <h2 className="text-sm font-bold text-white">User Plan Distribution</h2>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-[#111B21] rounded-xl border border-gray-800">
                  <span className="font-bold text-gray-400">FREE TIER</span>
                  <p className="text-lg font-bold text-white mt-1">{stats?.free_users || 0}</p>
                </div>
                <div className="p-3 bg-[#111B21] rounded-xl border border-gray-800">
                  <span className="font-bold text-amber-400">BUSINESS TIER</span>
                  <p className="text-lg font-bold text-white mt-1">{stats?.business_users || 0}</p>
                </div>
                <div className="p-3 bg-[#111B21] rounded-xl border border-gray-800">
                  <span className="font-bold text-purple-400">PRO MOD TIER</span>
                  <p className="text-lg font-bold text-white mt-1">{stats?.pro_users || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h1 className="text-xl font-bold text-white">User Management</h1>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="p-2 bg-[#1F2C34] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                />
                <select
                  value={userPlanFilter}
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  className="p-2 bg-[#1F2C34] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="business">Business</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#1F2C34] rounded-2xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111B21] text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Plan Tier</th>
                    <th className="p-3.5">Badges</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#202C33]">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.badges?.includes("verified") && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                        )}
                      </td>
                      <td className="p-3.5 text-gray-300 font-mono">{u.phone}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.plan === "pro"
                              ? "bg-purple-900/60 text-purple-300 border border-purple-700"
                              : u.plan === "business"
                              ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                              : "bg-gray-800 text-gray-300"
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{u.badges?.join(", ") || "None"}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "banned" ? "bg-red-900/60 text-red-300" : "bg-emerald-900/60 text-emerald-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {/* Change Plan */}
                        <select
                          value={u.plan}
                          onChange={(e) => handleUserAction("change_plan", u.id, { plan: e.target.value })}
                          className="bg-[#111B21] border border-gray-700 text-white text-[11px] p-1 rounded focus:outline-none"
                        >
                          <option value="free">Set Free</option>
                          <option value="business">Set Business</option>
                          <option value="pro">Set Pro</option>
                        </select>

                        {/* Ban/Unban */}
                        {u.status === "banned" ? (
                          <button
                            type="button"
                            onClick={() => handleUserAction("unban", u.id)}
                            className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUserAction("ban", u.id, { ban_reason: "Violation of rules" })}
                            className="text-xs font-bold text-red-400 hover:underline cursor-pointer"
                          >
                            Ban
                          </button>
                        )}

                        {/* Impersonate */}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentUser(u);
                            onExit();
                          }}
                          className="text-xs font-bold text-purple-400 hover:underline cursor-pointer"
                          title="Login as user"
                        >
                          Impersonate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "payments" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Payments & Upgrades Review Queue</h1>

            <div className="bg-[#1F2C34] rounded-2xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111B21] text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Requested Plan</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Trx ID</th>
                    <th className="p-3.5">Proof</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-[#202C33]">
                      <td className="p-3.5 font-bold text-white">
                        {p.user_name}
                        <span className="block text-[10px] text-gray-400 font-mono">{p.user_phone}</span>
                      </td>
                      <td className="p-3.5 font-bold uppercase text-amber-400">{p.plan_id}</td>
                      <td className="p-3.5 uppercase font-mono text-gray-300">{p.method}</td>
                      <td className="p-3.5 font-mono text-gray-200">{p.transaction_id}</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(p.proof_url)}
                          className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "approved"
                              ? "bg-emerald-900/60 text-emerald-300"
                              : p.status === "rejected"
                              ? "bg-red-900/60 text-red-300"
                              : "bg-amber-900/60 text-amber-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {p.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePaymentReview(p.id, "approve")}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer text-xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePaymentReview(p.id, "reject", "Invalid Transaction ID")}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lightbox for Payment Proof */}
            {selectedProofUrl && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-[#1F2C34] p-4 rounded-2xl max-w-lg w-full space-y-3">
                  <div className="flex justify-between items-center text-white">
                    <span className="font-bold text-sm">Payment Receipt Proof</span>
                    <button type="button" onClick={() => setSelectedProofUrl(null)} className="cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <img src={selectedProofUrl} alt="Receipt" className="max-h-96 w-full object-contain rounded-xl" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "flags" && (
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-xl font-bold text-white">Feature Flags & Permissions</h1>

            <div className="space-y-3">
              {flagsList.map((flag) => {
                const isProEnabled = Array.isArray(flag.enabled_for) && flag.enabled_for.includes("pro");
                const isBizEnabled = Array.isArray(flag.enabled_for) && flag.enabled_for.includes("business");

                return (
                  <div key={flag.key} className="p-4 bg-[#1F2C34] rounded-2xl border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{flag.key}</h3>
                      <span className="text-[10px] bg-gray-800 text-gray-300 font-mono px-2 py-0.5 rounded uppercase">
                        {flag.category}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400">{flag.description}</p>

                    <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-gray-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isBizEnabled}
                          onChange={(e) => {
                            let updated = Array.isArray(flag.enabled_for) ? [...flag.enabled_for] : [];
                            if (e.target.checked) updated.push("business");
                            else updated = updated.filter((x) => x !== "business");
                            handleToggleFlag(flag.key, updated);
                          }}
                          className="accent-amber-500 cursor-pointer"
                        />
                        <span>Enable for Business Tier</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isProEnabled}
                          onChange={(e) => {
                            let updated = Array.isArray(flag.enabled_for) ? [...flag.enabled_for] : [];
                            if (e.target.checked) updated.push("pro");
                            else updated = updated.filter((x) => x !== "pro");
                            handleToggleFlag(flag.key, updated);
                          }}
                          className="accent-purple-600 cursor-pointer"
                        />
                        <span>Enable for Pro Mod Tier</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === "chats" && (
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-xl font-bold text-white">Chat Monitoring & Search</h1>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search message keywords across platform..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="flex-1 p-3 bg-[#1F2C34] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchChats}
                className="bg-[#25D366] text-white font-bold px-4 py-3 rounded-xl text-xs cursor-pointer"
              >
                Search
              </button>
            </div>

            <div className="space-y-2">
              {monitoredMsgs.map((m) => (
                <div key={m.id} className="p-3 bg-[#1F2C34] rounded-xl border border-gray-800 text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span className="font-bold text-emerald-400">Sender: {m.sender_id}</span>
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-200 font-medium">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "broadcast" && (
          <div className="space-y-4 max-w-lg">
            <h1 className="text-xl font-bold text-white">Admin Broadcast Announcements</h1>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Audience</label>
              <select
                value={broadcastAudience}
                onChange={(e) => setBroadcastAudience(e.target.value)}
                className="w-full p-2.5 bg-[#1F2C34] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="all">All Users</option>
                <option value="free">Free Users Only</option>
                <option value="business">Business Users Only</option>
                <option value="pro">Pro Users Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Announcement Message</label>
              <textarea
                placeholder="Type platform announcement..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                rows={4}
                className="w-full p-3 bg-[#1F2C34] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSendBroadcast}
              className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl shadow-lg cursor-pointer"
            >
              Send Broadcast Now
            </button>
          </div>
        )}

        {activeSection === "logs" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Admin Audit Logs</h1>

            <div className="bg-[#1F2C34] rounded-2xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111B21] text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {auditLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 text-emerald-400 font-bold">{l.admin_id}</td>
                      <td className="p-3 font-mono text-gray-200">{l.action}</td>
                      <td className="p-3 text-gray-400">{l.target_id}</td>
                      <td className="p-3 text-gray-400">{new Date(l.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
