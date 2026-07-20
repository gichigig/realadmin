"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { superAdminApi, filesApi, RentalWithOwnerInfo } from "@/lib/api";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CheckBadgeIcon,
  SparklesIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminRentalsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading } = useAuth();
  const [rentals, setRentals] = useState<RentalWithOwnerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRentals();
    }
  }, [isSuperAdmin]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const data = await superAdminApi.getAllRentals();
      setRentals(data);
    } catch (err) {
      setError("Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (rentalId: number, sponsorshipType: string, durationDays = 30) => {
    try {
      setProcessingId(rentalId);
      setError("");
      const res = await superAdminApi.boostRental(rentalId, { sponsorshipType, durationDays });
      setRentals((prev) =>
        prev.map((r) => (r.id === rentalId ? { ...r, ...res.rental } : r))
      );
    } catch (err: any) {
      setError(err.message || "Failed to update boost");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVideo = async (rental: RentalWithOwnerInfo) => {
    if (!rental.id) return;
    try {
      setProcessingId(rental.id);
      setError("");
      const newVideoStatus = !rental.hasVideo;
      const res = await superAdminApi.boostRental(rental.id, { hasVideo: newVideoStatus });
      setRentals((prev) =>
        prev.map((r) => (r.id === rental.id ? { ...r, ...res.rental } : r))
      );
    } catch (err: any) {
      setError(err.message || "Failed to toggle video status");
    } finally {
      setProcessingId(null);
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircleIcon className="h-3 w-3" /> Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            <ClockIcon className="h-3 w-3" /> Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <XCircleIcon className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getOwnerBadge = (rental: RentalWithOwnerInfo) => {
    if (rental.ownerIsVerified) {
      if (rental.ownerUserType === "AGENT") {
        return (
          <span className="inline-flex items-center gap-1 text-amber-600" title="Verified Agent">
            <CheckBadgeIcon className="h-4 w-4 text-amber-500" />
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-blue-600" title="Verified User">
          <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
        </span>
      );
    }
    return null;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Rentals</h1>
        <p className="text-gray-600">View and boost rentals across all users without payment</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approval
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Boost / Perks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rentals.map((rental) => (
              <tr key={rental.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {rental.imageUrls?.[0] && (
                      <img
                        src={filesApi.getUrl(rental.thumbnailUrls?.[0] || rental.imageUrls[0])}
                        alt={rental.title}
                        className="w-12 h-12 rounded object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rental.title}</div>
                      <div className="text-sm text-gray-500">{rental.ward}, {rental.county}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-900">{rental.createdByName}</span>
                    {getOwnerBadge(rental)}
                  </div>
                  <div className="text-xs text-gray-500">{rental.ownerUserType || "Individual"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${rental.price?.toLocaleString()}/mo
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rental.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    rental.status === "RENTED" ? "bg-blue-100 text-blue-700" :
                    rental.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {rental.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getApprovalBadge(rental.approvalStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {rental.isSponsored ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                          <SparklesIcon className="h-3.5 w-3.5 text-amber-600" />
                          Boosted ({rental.sponsorshipType})
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not Boosted</span>
                      )}
                      {rental.isSponsored ? (
                        <button
                          onClick={() => handleBoost(rental.id!, "NONE", 0)}
                          disabled={processingId === rental.id}
                          className="px-2.5 py-1 text-xs font-medium rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                          {processingId === rental.id ? "..." : "Unboost"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <select
                            id={`boost-type-${rental.id}`}
                            className="text-xs border-gray-300 rounded px-1.5 py-1 bg-white border outline-none"
                            defaultValue="BOTH"
                          >
                            <option value="LOCAL">Local</option>
                            <option value="SEARCH">Search</option>
                            <option value="BOTH">Both</option>
                          </select>
                          <button
                            onClick={() => {
                              const type = (document.getElementById(`boost-type-${rental.id}`) as HTMLSelectElement).value;
                              handleBoost(rental.id!, type, 30);
                            }}
                            disabled={processingId === rental.id}
                            className="px-2.5 py-1 text-xs font-medium rounded transition-colors bg-amber-500 text-white hover:bg-amber-600 shadow-sm disabled:opacity-50"
                          >
                            {processingId === rental.id ? "..." : "🚀 Boost"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        rental.hasVideo ? "text-purple-700 font-medium" : "text-gray-400"
                      }`}>
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                        {rental.hasVideo ? "Video Granted" : "No Video"}
                      </span>
                      <button
                        onClick={() => handleToggleVideo(rental)}
                        disabled={processingId === rental.id}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                          rental.hasVideo
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-purple-200 text-purple-600 hover:bg-purple-50"
                        } disabled:opacity-50`}
                      >
                        {rental.hasVideo ? "Revoke" : "+ Grant Video"}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(rental.createdAt || "").toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
