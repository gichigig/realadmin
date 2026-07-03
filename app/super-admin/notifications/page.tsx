"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { superAdminApi } from "@/lib/api";
import {
  BellAlertIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  MapPinIcon,
  LinkIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

export default function PushNotificationsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<"ALL" | "NEW_USERS" | "ROLE" | "AREA" | "SELECTED_USERS">("ALL");
  const [targetValue, setTargetValue] = useState("");
  const [notificationType, setNotificationType] = useState("GENERAL");
  const [referenceId, setReferenceId] = useState("");
  const [link, setLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [authLoading, isSuperAdmin, router]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Please enter both a notification title and message body.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await superAdminApi.sendSuperAdminPushNotification({
        title: title.trim(),
        body: body.trim(),
        targetType,
        targetValue: targetValue.trim() || undefined,
        notificationType,
        referenceId: referenceId.trim() ? Number(referenceId.trim()) : undefined,
        link: link.trim() || undefined,
      });

      setSuccess(`Successfully sent push notification to ${response.targetCount || "all"} targeted users!`);
      setTitle("");
      setBody("");
      setTargetValue("");
      setReferenceId("");
      setLink("");
    } catch (err: any) {
      setError(err.message || "Failed to send push notification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BellAlertIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Targeted FCM Push Notifications</h1>
            <p className="text-gray-600">Send instant push notifications and promotional deep links to Dwelly app users</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
          <span>🎉</span>
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PaperAirplaneIcon className="h-5 w-5 text-amber-500" />
            Compose Notification
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <UserGroupIcon className="h-4 w-4 text-gray-500" />
                Target Audience Category
              </label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as any);
                  setTargetValue("");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-gray-800"
              >
                <option value="ALL">🌐 All Active Users</option>
                <option value="NEW_USERS">✨ New Users (Joined recently)</option>
                <option value="ROLE">👤 Filter by User Role</option>
                <option value="AREA">📍 Filter by Location / Area</option>
                <option value="SELECTED_USERS">🎯 Selected Specific Users (by ID)</option>
              </select>
            </div>

            {/* Conditional Target Value Input */}
            {targetType === "NEW_USERS" && (
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Days Since Registration
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="e.g. 7 (Users joined in last 7 days)"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            )}

            {targetType === "ROLE" && (
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Select User Role
                </label>
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                >
                  <option value="">-- Choose Role --</option>
                  <option value="TENANT">Tenant / Seeker</option>
                  <option value="LANDLORD">Landlord / Owner</option>
                  <option value="AGENT">Real Estate Agent</option>
                  <option value="HELPER">Service Helper / Professional</option>
                </select>
              </div>
            )}

            {targetType === "AREA" && (
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Area / Constituency / Ward Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kilimani, Westlands, Nairobi, Mombasa..."
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            )}

            {targetType === "SELECTED_USERS" && (
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Comma-Separated User IDs
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104, 205, 312"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono text-sm"
                />
              </div>
            )}

            {/* Notification Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notification Category
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-gray-800"
                >
                  <option value="GENERAL">📢 General Announcement</option>
                  <option value="RENTAL_ALERT">🏠 Listing / Rental Alert</option>
                  <option value="PROMOTION">🎁 Special Offer / Promotion</option>
                  <option value="MESSAGE">💬 Message / System Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Listing / Rental ID (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono text-sm"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notification Title *
              </label>
              <input
                type="text"
                placeholder="e.g. 🌟 New Premium Rentals Available in Kilimani!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-gray-900"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{title.length}/80 chars</div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message Body *
              </label>
              <textarea
                placeholder="e.g. Check out verified 2 & 3 bedroom apartments with instant tour booking. Tap here to explore now!"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={240}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{body.length}/240 chars</div>
            </div>

            {/* Redirect URL / Deep Link */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-amber-600" />
                Redirect URL / Deep Link (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                When users tap the notification, they will be redirected to this link automatically (or listing detail page if Listing ID is specified).
              </p>
              <input
                type="url"
                placeholder="https://dwelly.co.ke/promotions/summer or dwelly://rental/45"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono text-sm text-blue-600"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                loading || !title.trim() || !body.trim()
                  ? "bg-gray-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Broadcasting FCM Push...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5" />
                  <span>Send Push Notification Now</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />
              Live Phone Preview
            </h3>

            <div className="bg-slate-900 p-4 rounded-3xl shadow-xl border-4 border-slate-800 text-white max-w-xs mx-auto">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-3 px-1">
                <span>9:41</span>
                <div className="flex gap-1 items-center">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Notification Banner Mock */}
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-[10px] font-black text-white">
                      D
                    </div>
                    <span className="text-xs font-bold text-slate-200">Dwelly</span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>

                <div className="text-xs font-bold text-white mb-0.5 leading-snug">
                  {title || "Notification Title"}
                </div>
                <div className="text-[11px] text-slate-300 leading-normal line-clamp-3">
                  {body || "Your notification message body will appear here on user screens."}
                </div>

                {(link || referenceId) && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                    <span>{link ? "🔗 Tap to open link" : "🏠 Tap to view listing"}</span>
                    <span>→</span>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center text-[10px] text-slate-500">
                Lock Screen / Banner Notification
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-2">
              <div className="font-bold text-gray-800">Targeting Summary:</div>
              <div>
                • Audience: <span className="font-semibold text-amber-700">
                  {targetType === "ALL" && "All Active Users"}
                  {targetType === "NEW_USERS" && `New Users (${targetValue || 7} days)`}
                  {targetType === "ROLE" && `Role: ${targetValue || "All"}`}
                  {targetType === "AREA" && `Location: ${targetValue || "All Areas"}`}
                  {targetType === "SELECTED_USERS" && `IDs: ${targetValue || "None"}`}
                </span>
              </div>
              <div>
                • Category: <span className="font-semibold text-gray-800">{notificationType}</span>
              </div>
              {referenceId && <div>• Listing Ref: <span className="font-mono text-blue-600">#{referenceId}</span></div>}
              {link && <div className="truncate">• Deep Link: <span className="font-mono text-blue-600">{link}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
