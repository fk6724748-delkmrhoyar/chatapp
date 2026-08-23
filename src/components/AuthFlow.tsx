"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { MessageSquare, Camera, ArrowRight, ShieldCheck, Briefcase, Check } from "lucide-react";

const COUNTRIES = [
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+ Saudi Arabia", flag: "🇸🇦", name: "+966" },
];

export default function AuthFlow() {
  const { setCurrentUser } = useApp();

  const [step, setStep] = useState<"phone" | "profile">("phone");
  const [selectedCountry, setSelectedCountry] = useState("+92");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isBusinessIntent, setIsBusinessIntent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Temp user data for Profile Setup step
  const [tempUserId, setTempUserId] = useState("");
  const [name, setName] = useState("");
  const [about, setAbout] = useState("Hey there! I am using WhatsApp Clone");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isBusinessToggle, setIsBusinessToggle] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 7) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const fullPhone = `${selectedCountry}${phoneNumber.replace(/\D/g, "")}`;

    try {
      const res = await fetch("/api/auth/lookup_or_create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          is_business_intent: isBusinessIntent,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Authentication failed");
      }

      const { is_new_user, user } = json.data;

      if (is_new_user) {
        setTempUserId(user.id);
        setIsBusinessToggle(isBusinessIntent);
        setStep("profile");
      } else {
        // Returning user - Logged in immediately!
        setCurrentUser(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: tempUserId,
          name: name.trim(),
          about: about.trim(),
          photo_url: photoUrl,
          is_business: isBusinessToggle,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to setup profile");
      }

      setCurrentUser(json.data.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const sampleAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#111B21] flex flex-col items-center justify-center p-4">
      {/* Top Brand Curve Header */}
      <div className="w-full max-w-md bg-[#075E54] text-white p-6 rounded-t-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-inner">
            <MessageSquare className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">WhatsApp</h1>
            <p className="text-xs text-emerald-100 font-medium">Instant Access • No OTP Required</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 px-2.5 py-1 rounded-full text-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Verified</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#202C33] p-6 rounded-b-2xl shadow-xl border-t border-gray-100 dark:border-gray-800">
        {errorMsg && (
          <div className="mb-5 p-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Enter your phone number
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                WhatsApp will instantly log you in or create your account using this number.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Country & Phone Number
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-3 font-medium focus:ring-2 focus:ring-[#25D366] focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  placeholder="300 1234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-3 font-medium focus:ring-2 focus:ring-[#25D366] focus:outline-none"
                  autoFocus
                />
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-1.5">
                <span className="text-xs">⚡</span>
                <span>
                  <strong>No OTP required:</strong> You will be logged in or signed up instantly — no code needed.
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsBusinessIntent(!isBusinessIntent);
                }}
                className="text-xs text-[#075E54] dark:text-[#25D366] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                {isBusinessIntent
                  ? "Standard Account? Click here"
                  : "Business Account? Continue here"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Profile info
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Please provide your name and an optional profile photo.
              </p>
            </div>

            {/* Photo Picker */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-[#25D366]">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-md">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              {/* Sample Preset Photo Selectors */}
              <div className="flex gap-2">
                {sampleAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      photoUrl === url ? "border-[#25D366] scale-110" : "border-transparent opacity-70"
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Type your name"
                maxLength={25}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-3 font-medium focus:ring-2 focus:ring-[#25D366] focus:outline-none"
                autoFocus
              />
              <span className="text-[10px] text-gray-400 float-right mt-1">
                {25 - name.length} characters left
              </span>
            </div>

            {/* About input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                About
              </label>
              <input
                type="text"
                placeholder="Hey there! I am using WhatsApp Clone"
                maxLength={139}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-lg p-3 font-medium focus:ring-2 focus:ring-[#25D366] focus:outline-none"
              />
            </div>

            {/* Business Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#111B21] rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Business Account
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Enables Catalog, Quick Replies & Analytics
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isBusinessToggle}
                onChange={(e) => setIsBusinessToggle(e.target.checked)}
                className="w-5 h-5 accent-[#25D366] rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Done</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
