"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { advertisersApi, Advertiser, PaginatedResponse } from "@/lib/api";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "UNVERIFIED", label: "Unverified" },
  { value: "PENDING", label: "Pending Review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  UNVERIFIED: { bg: "bg-gray-100", text: "text-gray-700", icon: ClockIcon },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: ClockIcon },
  VERIFIED: { bg: "bg-green-100", text: "text-green-700", icon: CheckBadgeIcon },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", icon: XCircleIcon },
  SUSPENDED: { bg: "bg-orange-100", text: "text-orange-700", icon: ExclamationTriangleIcon },
};

export default function AdvertisersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [blocked, setBlocked] = useState<string>("");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdvertisers();
    }
  }, [isAuthenticated, page, status, blocked]);

  const fetchAdvertisers = async () => {
    setLoading(true);
    try {
      const result: PaginatedResponse<Advertiser> = await advertisersApi.list({
        page,
        size: pageSize,
        status: status || undefined,
        blocked: blocked === "true" ? true : blocked === "false" ? false : undefined,
      });
      setAdvertisers(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err: any) {
      setError(err.message || "Failed to load advertisers");
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvertisers = advertisers.filter((a) =>
    a.companyName.toLowerCase().includes(search.toLowerCase()) ||
    a.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBlock = async (id: number, block: boolean) => {
    const reason = block ? prompt("Enter reason for blocking:") : undefined;
    if (block && !reason) return;
    
    try {
      if (block) {
        await advertisersApi.block(id, reason!);
      } else {
        await advertisersApi.unblock(id);
      }
      fetchAdvertisers();
    } catch (err: any) {
      setError(err.message || `Failed to ${block ? "block" : "unblock"} advertiser`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this advertiser? This will also delete all their ads.")) return;
    
    try {
      await advertisersApi.delete(id);
      fetchAdvertisers();
    } catch (err: any) {
      setError(err.message || "Failed to delete advertiser");
    }
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Verification</h1>
          <p className="text-gray-600">Verify your business to get ads approved</p>
        </div>
        <Link
          href="/advertisers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CheckBadgeIcon className="h-5 w-5" />
          Verify Business
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {isSuperAdmin && (
            <select
              value={blocked}
              onChange={(e) => { setBlocked(e.target.value); setPage(0); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="false">Active</option>
              <option value="true">Blocked</option>
            </select>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATUS_OPTIONS.slice(1).map((s) => {
          const count = advertisers.filter((a) => a.verificationStatus === s.value).length;
          const styles = STATUS_STYLES[s.value];
          return (
            <button
              key={s.value}
              onClick={() => { setStatus(s.value); setPage(0); }}
              className={`p-4 rounded-lg ${styles.bg} ${status === s.value ? "ring-2 ring-blue-500" : ""}`}
            >
              <styles.icon className={`h-6 w-6 ${styles.text} mb-1`} />
              <p className={`text-2xl font-bold ${styles.text}`}>{count}</p>
              <p className={`text-sm ${styles.text}`}>{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAdvertisers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <BuildingOfficeIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No advertisers found</p>
            <p className="text-sm">Try adjusting your filters</p>
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
                  Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ads
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdvertisers.map((advertiser) => {
                const statusStyle = STATUS_STYLES[advertiser.verificationStatus] || STATUS_STYLES.UNVERIFIED;
                return (
                  <tr key={advertiser.id} className={advertiser.blocked ? "bg-red-50" : ""}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {advertiser.logoUrl ? (
                          <img
                            src={advertiser.logoUrl}
                            alt={advertiser.companyName}
                            className="h-10 w-10 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{advertiser.companyName}</p>
                          {advertiser.website && (
                            <a href={advertiser.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              {advertiser.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{advertiser.contactEmail}</p>
                      <p className="text-xs text-gray-500">{advertiser.contactPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <statusStyle.icon className="h-3 w-3" />
                        {advertiser.verificationStatus}
                      </span>
                      {advertiser.blocked && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <NoSymbolIcon className="h-3 w-3" />
                          Blocked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        Balance: <span className="font-medium">KES {advertiser.accountBalance?.toLocaleString() || 0}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Spent: KES {advertiser.totalSpent?.toLocaleString() || 0}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/ads?advertiser=${advertiser.id}`} className="text-blue-600 hover:underline text-sm">
                        View Ads →
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/advertisers/${advertiser.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/advertisers/${advertiser.id}/edit`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleBlock(advertiser.id, !advertiser.blocked)}
                              className={`p-2 rounded-lg ${
                                advertiser.blocked
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                              title={advertiser.blocked ? "Unblock" : "Block"}
                            >
                              <NoSymbolIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(advertiser.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
