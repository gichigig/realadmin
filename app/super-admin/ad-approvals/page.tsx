"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adsApi, Advertisement, PaginatedResponse } from "@/lib/api";
import {
  CheckCircleIcon,
  ClockIcon,
  MegaphoneIcon,
  XCircleIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 100;

type ApprovalTab = "PENDING" | "APPROVED";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function AdApprovalsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  const [pendingAds, setPendingAds] = useState<Advertisement[]>([]);
  const [approvedAds, setApprovedAds] = useState<Advertisement[]>([]);
  const [activeTab, setActiveTab] = useState<ApprovalTab>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pendingResult, approvedResult]: [
        PaginatedResponse<Advertisement>,
        PaginatedResponse<Advertisement>
      ] = await Promise.all([
        adsApi.list({
          page: 0,
          size: PAGE_SIZE,
          status: "PENDING",
        }),
        adsApi.list({
          page: 0,
          size: PAGE_SIZE,
          status: "APPROVED",
        }),
      ]);

      setPendingAds(pendingResult.content);
      setApprovedAds(approvedResult.content);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load ads for approvals"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [authLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      fetchAds();
    }
  }, [authLoading, isSuperAdmin, fetchAds]);

  const handleDecision = async (adId: number, decision: "APPROVED" | "REJECTED") => {
    let notes: string | undefined = undefined;
    if (decision === "REJECTED") {
      const reason = prompt("Enter rejection reason (required):");
      if (!reason || !reason.trim()) return;
      notes = reason.trim();
    } else {
      const approveNotes = prompt("Optional approval notes:");
      notes = approveNotes && approveNotes.trim() ? approveNotes.trim() : undefined;
    }

    setProcessingId(adId);
    setError("");
    try {
      await adsApi.approve(adId, decision, notes);
      await fetchAds();
    } catch (err: unknown) {
      setError(getErrorMessage(err, `Failed to ${decision === "APPROVED" ? "approve" : "reject"} ad`));
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlockToggle = async (ad: Advertisement) => {
    setProcessingId(ad.id);
    setError("");
    try {
      if (ad.blocked) {
        await adsApi.unblock(ad.id);
      } else {
        const reason = prompt("Enter block reason (required):");
        if (!reason || !reason.trim()) return;
        await adsApi.block(ad.id, reason.trim());
      }
      await fetchAds();
    } catch (err: unknown) {
      setError(getErrorMessage(err, `Failed to ${ad.blocked ? "unblock" : "block"} ad`));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApproved = async (adId: number) => {
    const reason = prompt("Enter rejection reason (required):");
    if (!reason || !reason.trim()) return;

    setProcessingId(adId);
    setError("");
    try {
      await adsApi.approve(adId, "REJECTED", reason.trim());
      await fetchAds();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to move ad to rejected"));
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Approvals</h1>
          <p className="text-gray-600">
            Review pending ads and manage approved ads from registered businesses.
          </p>
        </div>
        <button
          onClick={fetchAds}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`pb-3 text-sm font-medium border-b-2 ${
              activeTab === "PENDING"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({pendingAds.length})
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`pb-3 text-sm font-medium border-b-2 ${
              activeTab === "APPROVED"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Approved ({approvedAds.length})
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === "PENDING" && pendingAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MegaphoneIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No pending ads</p>
          </div>
        ) : activeTab === "APPROVED" && approvedAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ShieldCheckIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No approved ads found</p>
          </div>
        ) : activeTab === "PENDING" ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingAds.map((ad) => {
                const isProcessing = processingId === ad.id;
                return (
                  <tr key={ad.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{ad.title}</p>
                      <p className="text-xs text-gray-500">
                        {ad.impressionCount || 0} views | {ad.clickCount || 0} clicks
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ad.advertiserName || "Unknown business"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{(ad.placement || "").replace(/_/g, " ")}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {ad.createdAt ? new Date(ad.createdAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <ClockIcon className="h-3 w-3" />
                        PENDING
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDecision(ad.id, "APPROVED")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(ad.id, "REJECTED")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedAds.map((ad) => {
                const isProcessing = processingId === ad.id;
                return (
                  <tr key={ad.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{ad.title}</p>
                      <p className="text-xs text-gray-500">
                        {ad.impressionCount || 0} views | {ad.clickCount || 0} clicks
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ad.advertiserName || "Unknown business"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{(ad.placement || "").replace(/_/g, " ")}</td>
                    <td className="px-6 py-4">
                      {ad.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <NoSymbolIcon className="h-3 w-3" />
                          BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircleIcon className="h-3 w-3" />
                          APPROVED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleBlockToggle(ad)}
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-white disabled:opacity-50 ${
                            ad.blocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"
                          }`}
                        >
                          {ad.blocked ? "Unblock" : "Block"}
                        </button>
                        <button
                          onClick={() => handleRejectApproved(ad.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
