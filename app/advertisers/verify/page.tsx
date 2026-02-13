"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { advertisersApi, Advertiser } from "@/lib/api";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 50;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function VerifyBusinessesPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchVerifiableAdvertisers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pendingResult, unverifiedResult] = await Promise.all([
        advertisersApi.list({
          page: 0,
          size: PAGE_SIZE,
          status: "PENDING",
        }),
        advertisersApi.list({
          page: 0,
          size: PAGE_SIZE,
          status: "UNVERIFIED",
        }),
      ]);

      const combined = [...pendingResult.content, ...unverifiedResult.content];
      const deduped = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      setAdvertisers(deduped);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load businesses for verification"));
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
      fetchVerifiableAdvertisers();
    }
  }, [authLoading, isSuperAdmin, fetchVerifiableAdvertisers]);

  const handleDecision = async (id: number, decision: "VERIFIED" | "REJECTED") => {
    if (decision === "REJECTED") {
      const rejectNotes = prompt("Enter rejection reason (required):");
      if (!rejectNotes || !rejectNotes.trim()) return;

      setProcessingId(id);
      setError("");
      try {
        await advertisersApi.verify(id, decision, rejectNotes.trim());
        await fetchVerifiableAdvertisers();
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to reject business"));
      } finally {
        setProcessingId(null);
      }
      return;
    }

    const approveNotes = prompt("Optional approval notes:");
    const notes = approveNotes && approveNotes.trim() ? approveNotes.trim() : undefined;

    setProcessingId(id);
    setError("");
    try {
      await advertisersApi.verify(id, decision, notes);
      await fetchVerifiableAdvertisers();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to verify business"));
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
          <h1 className="text-2xl font-bold text-gray-900">Verify Businesses</h1>
          <p className="text-gray-600">Review pending or unverified advertiser profiles and verify instantly.</p>
        </div>
        <button
          onClick={fetchVerifiableAdvertisers}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {advertisers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <BuildingOfficeIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No businesses awaiting verification</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advertisers.map((advertiser) => {
                const isProcessing = processingId === advertiser.id;
                return (
                  <tr key={advertiser.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{advertiser.companyName}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {advertiser.createdAt ? new Date(advertiser.createdAt).toLocaleString() : "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{advertiser.contactEmail || "No email"}</p>
                      <p className="text-xs text-gray-500">{advertiser.contactPhone || "No phone"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          advertiser.verificationStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {advertiser.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>{advertiser.businessCertificateUrl ? "Business cert: Yes" : "Business cert: No"}</p>
                        <p>{advertiser.taxRegistrationUrl ? "Tax reg: Yes" : "Tax reg: No"}</p>
                        <p>{advertiser.additionalDocumentUrl ? "Additional doc: Yes" : "Additional doc: No"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/advertisers/${advertiser.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Review details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDecision(advertiser.id, "VERIFIED")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleDecision(advertiser.id, "REJECTED")}
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
