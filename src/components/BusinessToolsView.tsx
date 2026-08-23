"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Briefcase,
  ShoppingBag,
  Zap,
  MessageSquare,
  Clock,
  Tag,
  BarChart2,
  QrCode,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
} from "lucide-react";

export default function BusinessToolsView() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"profile" | "catalog" | "replies" | "analytics">("profile");

  const [bizData, setBizData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  // Product modal
  const [showAddProd, setShowAddProd] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImg, setProdImg] = useState("");

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/business?user_id=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setBizData(json.data.profile);
        setProducts(json.data.products || []);
        setAnalytics(json.data.analytics);

        if (json.data.profile) {
          setCategory(json.data.profile.category || "");
          setAddress(json.data.profile.address || "");
          setWebsite(json.data.profile.website || "");
          setEmail(json.data.profile.email || "");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          category,
          address,
          website,
          email,
        }),
      });
      alert("Business Profile saved successfully!");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProduct = async () => {
    if (!prodName || !prodPrice || !currentUser) return;
    try {
      await fetch("/api/business/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          user_id: currentUser.id,
          name: prodName,
          price: Number(prodPrice),
          description: prodDesc,
          image_url: prodImg || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
        }),
      });
      setShowAddProd(false);
      setProdName("");
      setProdPrice("");
      setProdDesc("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-amber-500 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6" />
          <div>
            <h1 className="text-base font-bold">Business Suite</h1>
            <p className="text-xs text-amber-100">Professional merchant tools & messaging automation</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#202C33] overflow-x-auto text-xs font-bold text-gray-600 dark:text-gray-300">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex-1 min-w-[80px] py-3 text-center border-b-2 cursor-pointer ${
            activeTab === "profile" ? "border-amber-500 text-amber-500" : "border-transparent"
          }`}
        >
          Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 min-w-[80px] py-3 text-center border-b-2 cursor-pointer ${
            activeTab === "catalog" ? "border-amber-500 text-amber-500" : "border-transparent"
          }`}
        >
          Catalog
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("replies")}
          className={`flex-1 min-w-[80px] py-3 text-center border-b-2 cursor-pointer ${
            activeTab === "replies" ? "border-amber-500 text-amber-500" : "border-transparent"
          }`}
        >
          Quick Replies
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 min-w-[80px] py-3 text-center border-b-2 cursor-pointer ${
            activeTab === "analytics" ? "border-amber-500 text-amber-500" : "border-transparent"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 flex-1">
        {activeTab === "profile" && (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                Business Category
              </label>
              <input
                type="text"
                placeholder="e.g. Retail, Restaurant, Electronics"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#202C33] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                Store Address
              </label>
              <input
                type="text"
                placeholder="123 Commerce Way, Tech City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#202C33] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://mybusiness.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#202C33] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  placeholder="support@mybusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#202C33] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-md cursor-pointer flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Business Profile</span>
            </button>
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Product Catalog</h2>
              <button
                type="button"
                onClick={() => setShowAddProd(true)}
                className="bg-[#25D366] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-3 bg-gray-50 dark:bg-[#202C33] rounded-2xl border border-gray-200 dark:border-gray-700 flex gap-3">
                  <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{p.name}</h3>
                    <p className="text-xs font-bold text-[#25D366] mt-0.5">${p.price}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-1">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Product Modal */}
            {showAddProd && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-[#202C33] rounded-2xl p-5 shadow-2xl space-y-4">
                  <h3 className="font-bold text-base text-gray-800 dark:text-gray-100">Add Product to Catalog</h3>
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price (PKR/USD)"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full p-2.5 text-sm bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
                  />
                  <textarea
                    placeholder="Product Description"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={prodImg}
                    onChange={(e) => setProdImg(e.target.value)}
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="flex-1 bg-[#25D366] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                    >
                      Save Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddProd(false)}
                      className="px-4 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "replies" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Quick Reply Shortcuts</h2>
            <p className="text-xs text-gray-500">
              Type <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-amber-600">/shortcut</code> in chat to auto-fill full responses.
            </p>

            <div className="space-y-2">
              {[
                { shortcut: "/hours", msg: "We are open Mon-Fri 9 AM to 6 PM!" },
                { shortcut: "/catalog", msg: "View our full catalog in profile!" },
                { shortcut: "/shipping", msg: "Standard delivery takes 2-3 days." },
              ].map((r, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-[#202C33] rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-xs text-amber-500 font-mono">{r.shortcut}</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{r.msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Customer Analytics</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                <p className="text-2xl font-bold text-[#075E54] dark:text-[#25D366]">
                  {analytics?.messages_sent || 142}
                </p>
                <p className="text-xs text-gray-500 font-semibold mt-1">Messages Sent</p>
              </div>

              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900">
                <p className="text-2xl font-bold text-sky-600">
                  {analytics?.read_rate_pct || 94}%
                </p>
                <p className="text-xs text-gray-500 font-semibold mt-1">Read Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
