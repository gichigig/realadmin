"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adsApi, advertisersApi, Advertisement, Advertiser } from "@/lib/api";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  VideoCameraIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const PLACEMENTS = [
  { value: "", label: "All Placements" },
  { value: "HOME_BANNER", label: "Home Banner" },
  { value: "HOME_FEED", label: "Home Feed" },
  { value: "LISTING_DETAIL", label: "Listing Detail" },
  { value: "SEARCH_RESULTS", label: "Search Results" },
  { value: "INTERSTITIAL", label: "Interstitial" },
  { value: "SPLASH", label: "Splash Screen" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;
  
  // Filters
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("");
  const [status, setStatus] = useState("");
  const [blocked, setBlocked] = useState<string>("");
  
  // Advertisers for filter
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAds();
      fetchAdvertisers();
    }
  }, [isAuthenticated, page, search, placement, status, blocked, selectedAdvertiser]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const result = await adsApi.list({
        page,
        size: pageSize,
        search: search || undefined,
        placement: placement || undefined,
        status: status || undefined,
        blocked: blocked === "" ? undefined : blocked === "true",
        advertiserId: selectedAdvertiser ? parseInt(selectedAdvertiser) : undefined,
      });
      setAds(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err: any) {
      setError(err.message || "Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertisers = async () => {
    try {
      const result = await advertisersApi.list({ page: 0, size: 100 });
      setAdvertisers(result.content);
    } catch (err) {
      console.error("Failed to load advertisers:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    
    try {
      await adsApi.delete(id);
      fetchAds();
    } catch (err: any) {
      setError(err.message || "Failed to delete ad");
    }
  };

  const handleBlock = async (id: number) => {
    const reason = prompt("Enter reason for blocking:");
    if (!reason) return;
    
    try {
      await adsApi.block(id, reason);
      fetchAds();
    } catch (err: any) {
      setError(err.message || "Failed to block ad");
    }
  };

  const handleUnblock = async (id: number) => {
    try {
      await adsApi.unblock(id);
      fetchAds();
    } catch (err: any) {
      setError(err.message || "Failed to unblock ad");
    }
  };

  const getStatusBadge = (ad: Advertisement) => {
    if (ad.blocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <NoSymbolIcon className="h-3 w-3" />
          Blocked
        </span>
      );
    }
    
    switch (ad.approvalStatus) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon className="h-3 w-3" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <ClockIcon className="h-3 w-3" />
            Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircleIcon className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-600">Manage ads displayed in the mobile app</p>
        </div>
        <Link
          href="/ads/new"
          prefetch
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Ad
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ads..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={placement}
            onChange={(e) => { setPlacement(e.target.value); setPage(0); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          
          <select
            value={blocked}
            onChange={(e) => { setBlocked(e.target.value); setPage(0); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>
          
          <select
            value={selectedAdvertiser}
            onChange={(e) => { setSelectedAdvertiser(e.target.value); setPage(0); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Advertisers</option>
            {advertisers.map((a) => (
              <option key={a.id} value={a.id}>{a.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No ads found</h3>
            <p className="text-gray-500 mt-2">Create your first advertisement to get started.</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advertiser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {ad.thumbnailUrl || ad.imageUrl ? (
                            <img
                              src={ad.thumbnailUrl || ad.imageUrl}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              {ad.mediaType === "VIDEO" ? (
                                <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                              ) : (
                                <PhotoIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                          )}
                          {ad.mediaType === "VIDEO" && (
                            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                              <VideoCameraIcon className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{ad.title}</p>
                          <p className="text-sm text-gray-500">{ad.mediaType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {ad.advertiserLogoUrl && (
                          <img
                            src={ad.advertiserLogoUrl}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm text-gray-900">{ad.advertiserName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{ad.placement?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <span title="Impressions">{ad.impressionCount?.toLocaleString() || 0} views</span>
                        <span className="mx-1">•</span>
                        <span title="Clicks">{ad.clickCount?.toLocaleString() || 0} clicks</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/ads/${ad.id}`}
                          prefetch
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="View"
                          aria-label={`View ${ad.title}`}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/ads/${ad.id}/edit`}
                          prefetch
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit"
                          aria-label={`Edit ${ad.title}`}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        {user?.role === "SUPER_ADMIN" && (
                          <>
                            {ad.blocked ? (
                              <button
                                onClick={() => handleUnblock(ad.id)}
                                className="p-2 text-gray-400 hover:text-green-600"
                                title="Unblock"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(ad.id)}
                                className="p-2 text-gray-400 hover:text-red-600"
                                title="Block"
                              >
                                <NoSymbolIcon className="h-5 w-5" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} ads
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
