"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";

type Step = "form" | "confirm" | "deleting" | "done" | "error";

export default function DeleteAccountPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }
    setErrorMsg("");
    setStep("confirm");
  };

  const handleConfirmDelete = async () => {
    setStep("deleting");

    try {
      // Step 1: Login to get a token
      const loginRes = await fetch(`${API_BASE_URL}/auth/login/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, clientType: "WEB" }),
      });

      if (!loginRes.ok) {
        const err = await loginRes.json().catch(() => ({}));
        throw new Error(err.message || "Invalid email or password.");
      }

      const loginData = await loginRes.json();

      if (loginData.status !== "AUTHENTICATED" || !loginData.auth?.token) {
        throw new Error("Could not authenticate. Please check your credentials.");
      }

      const token = loginData.auth.token;

      // Step 2: Delete the account
      const deleteRes = await fetch(`${API_BASE_URL}/auth/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!deleteRes.ok) {
        const err = await deleteRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete account.");
      }

      setStep("done");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 py-4 px-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Dwelly</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* FORM STEP */}
          {step === "form" && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Delete Your Account</h1>
                  <p className="text-sm text-slate-400">This action is permanent and cannot be undone</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                <p className="text-amber-300 text-sm font-medium mb-2">⚠️ What will be deleted:</p>
                <ul className="text-amber-200/80 text-sm space-y-1">
                  <li>• Your profile and personal information</li>
                  <li>• All your property listings</li>
                  <li>• Your messages and conversations</li>
                  <li>• Saved searches and preferences</li>
                  <li>• Premium subscription status</li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="delete-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your account password"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Reason for leaving <span className="text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="delete-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Help us improve by sharing why you're leaving..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition resize-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    {errorMsg}
                  </p>
                )}

                <button
                  id="delete-submit-btn"
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-2"
                >
                  Continue to Delete Account
                </button>

                <p className="text-center text-slate-500 text-sm">
                  Changed your mind?{" "}
                  <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">
                    Go back
                  </Link>
                </p>
              </form>
            </div>
          )}

          {/* CONFIRM STEP */}
          {step === "confirm" && (
            <div className="bg-white/5 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Are you absolutely sure?</h2>
              <p className="text-slate-400 mb-1">You are about to permanently delete the account for:</p>
              <p className="text-white font-semibold mb-6 bg-white/5 rounded-lg py-2 px-4 inline-block">{email}</p>
              <p className="text-red-400 text-sm mb-8">
                This will immediately and permanently delete all your data. <strong>This cannot be undone.</strong>
              </p>
              <div className="flex flex-col gap-3">
                <button
                  id="delete-confirm-btn"
                  onClick={handleConfirmDelete}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  Yes, permanently delete my account
                </button>
                <button
                  id="delete-cancel-btn"
                  onClick={() => setStep("form")}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3.5 rounded-xl transition-colors"
                >
                  Cancel, keep my account
                </button>
              </div>
            </div>
          )}

          {/* DELETING STEP */}
          {step === "deleting" && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-red-500/30 border-t-red-500 animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Deleting your account…</h2>
              <p className="text-slate-400 text-sm">Please wait while we securely erase all your data.</p>
            </div>
          )}

          {/* DONE STEP */}
          {step === "done" && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Account Deleted</h2>
              <p className="text-slate-400 mb-6">
                Your account and all associated data have been permanently deleted. We're sorry to see you go.
              </p>
              <p className="text-slate-500 text-sm">
                If you change your mind in the future, you're always welcome back.
              </p>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="bg-white/5 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
              <p className="text-red-300 mb-6 bg-red-500/10 rounded-lg px-4 py-3 text-sm">{errorMsg}</p>
              <div className="flex flex-col gap-3">
                <button
                  id="delete-retry-btn"
                  onClick={() => { setStep("form"); setErrorMsg(""); }}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-4 px-6 text-center text-slate-600 text-xs">
        © {new Date().getFullYear()} Dwelly. For support, contact{" "}
        <a href="mailto:support@ishinadwelly.com" className="text-slate-500 hover:text-slate-400">
          support@ishinadwelly.com
        </a>
      </footer>
    </div>
  );
}
