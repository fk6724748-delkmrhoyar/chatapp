"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Crown, Briefcase, Check, ShieldCheck, CreditCard, Upload, AlertCircle } from "lucide-react";

export default function UpgradePlanModal({ onClose }: { onClose: () => void }) {
  const { currentUser } = useApp();

  const [step, setStep] = useState<"compare" | "pay">("compare");
  const [selectedPlan, setSelectedPlan] = useState<"business" | "pro">("pro");
  const [selectedMethod, setSelectedMethod] = useState<"jazzcash" | "easypaisa" | "bank">("jazzcash");

  const [paymentAccounts, setPaymentAccounts] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        const json = await res.json();
        if (json.success) {
          setPaymentAccounts(json.data.payment_accounts);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchPlans();
  }, []);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim() || !proofUrl.trim() || !currentUser) {
      alert("Please provide Transaction ID and Proof URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          plan_id: selectedPlan,
          method: selectedMethod,
          transaction_id: transactionId.trim(),
          proof_url: proofUrl.trim(),
          note: note.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentAccount = paymentAccounts ? paymentAccounts[selectedMethod] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#202C33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
            <h2 className="text-base font-bold">Upgrade WhatsApp Plan</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {submitted ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-[#25D366] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Payment Proof Submitted!
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your payment is pending admin approval. You will receive an instant account upgrade upon verification within 24 hours.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : step === "compare" ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Select Your Tier
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose the plan that fits your personal or business messaging needs.
                </p>
              </div>

              {/* Plan Cards */}
              <div className="space-y-3">
                {/* Business Tier */}
                <div
                  onClick={() => setSelectedPlan("business")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === "business"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">Business Tier</h4>
                    </div>
                    <span className="text-sm font-bold text-amber-600">PKR 500 / mo</span>
                  </div>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1 pl-6 list-disc">
                    <li>Business Profile & Catalog Management</li>
                    <li>Quick Replies with /shortcut</li>
                    <li>Greeting & Away Message Automation</li>
                    <li>Customer Analytics Dashboard</li>
                  </ul>
                </div>

                {/* Pro Tier */}
                <div
                  onClick={() => setSelectedPlan("pro")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === "pro"
                      ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-purple-600 fill-purple-600" />
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">Pro Mod Tier</h4>
                    </div>
                    <span className="text-sm font-bold text-purple-600">PKR 1200 / mo</span>
                  </div>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1 pl-6 list-disc">
                    <li>Ghost Mode (Hide Online, Freeze Last Seen, Hide Blue Ticks)</li>
                    <li>Anti-Delete Messages & Statuses</li>
                    <li>Custom CSS Theme Builder & Theme Store</li>
                    <li>AI Chat Assistant & AI Image Generator</li>
                    <li>All Business Tools Included</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("pay")}
                className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl shadow-lg cursor-pointer"
              >
                Proceed to Payment
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Payment Verification ({selectedPlan.toUpperCase()})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Send payment to one of our verified admin payout accounts below:
                </p>
              </div>

              {/* Payment Methods Tabs */}
              <div className="flex gap-2">
                {(["jazzcash", "easypaisa", "bank"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMethod(m)}
                    className={`flex-1 py-2 text-xs font-bold capitalize rounded-xl border transition-all cursor-pointer ${
                      selectedMethod === m
                        ? "bg-[#25D366] text-white border-[#25D366]"
                        : "bg-gray-50 dark:bg-[#111B21] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Account Details Box */}
              {currentAccount && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <p className="font-bold text-[#075E54] dark:text-[#25D366]">
                    Account Title: {currentAccount.title || currentAccount.account_title}
                  </p>
                  <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    Number / IBAN: {currentAccount.number || currentAccount.account_number || currentAccount.iban}
                  </p>
                  {currentAccount.bank_name && (
                    <p className="text-gray-600 dark:text-gray-300">Bank: {currentAccount.bank_name}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Transaction ID (Trx ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 02938491823"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Proof Screenshot / Receipt Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#111B21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none text-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit for Verification"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("compare")}
                  className="px-4 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl cursor-pointer text-xs"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
