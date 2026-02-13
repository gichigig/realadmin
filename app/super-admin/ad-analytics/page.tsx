"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adAnalyticsApi, AdAnalyticsSummary, AdAnalyticsDetail } from "@/lib/api";
import {
  ChartBarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ForwardIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function AdAnalyticsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<{
    period: { days: number; start: string; end: string };
    ads: AdAnalyticsSummary[];
  } | null>(null);
  const [topAds, setTopAds] = useState<Array<{ adId: number; title: string; count: number }>>([]);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [adDetail, setAdDetail] = useState<AdAnalyticsDetail | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [authLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin, days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryData, topData] = await Promise.all([
        adAnalyticsApi.getSummary(days),
        adAnalyticsApi.getTopAds("impressions", 5, days),
      ]);
      setSummary(summaryData);
      setTopAds(topData.ads);
    } catch (err) {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdDetail = async (adId: number) => {
    try {
      setDetailLoading(true);
      setSelectedAdId(adId);
      const detail = await adAnalyticsApi.getAdAnalytics(adId, days);
      setAdDetail(detail);
    } catch (err) {
      setError("Failed to load ad details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Calculate totals
  const totals = summary?.ads.reduce(
    (acc, ad) => ({
      impressions: acc.impressions + (ad.impressions || 0),
      clicks: acc.clicks + (ad.clicks || 0),
      skips: acc.skips + (ad.skips || 0),
      videoStarts: acc.videoStarts + (ad.videoStarts || 0),
      videoCompletes: acc.videoCompletes + (ad.videoCompletes || 0),
      formSubmits: acc.formSubmits + (ad.formSubmits || 0),
    }),
    { impressions: 0, clicks: 0, skips: 0, videoStarts: 0, videoCompletes: 0, formSubmits: 0 }
  ) || { impressions: 0, clicks: 0, skips: 0, videoStarts: 0, videoCompletes: 0, formSubmits: 0 };

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ad Analytics</h1>
              <p className="text-gray-600">View performance metrics for all ads</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/super-admin/ad-settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Settings
            </Link>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={EyeIcon} label="Impressions" value={totals.impressions.toLocaleString()} color="blue" />
        <StatCard icon={CursorArrowRaysIcon} label="Clicks" value={totals.clicks.toLocaleString()} color="green" />
        <StatCard icon={ArrowTrendingUpIcon} label="CTR" value={`${ctr}%`} color="amber" />
        <StatCard icon={ForwardIcon} label="Skips" value={totals.skips.toLocaleString()} color="red" />
        <StatCard icon={PlayCircleIcon} label="Video Starts" value={totals.videoStarts.toLocaleString()} color="purple" />
        <StatCard icon={DocumentTextIcon} label="Form Submits" value={totals.formSubmits.toLocaleString()} color="teal" />
      </div>

      {/* Top Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Ads by Impressions</h2>
          {topAds.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {topAds.map((ad, index) => (
                <div
                  key={ad.adId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => fetchAdDetail(ad.adId)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? "bg-amber-500 text-white" :
                      index === 1 ? "bg-gray-400 text-white" :
                      index === 2 ? "bg-amber-700 text-white" :
                      "bg-gray-200 text-gray-600"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{ad.title}</span>
                  </div>
                  <span className="text-gray-600">{ad.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Ads Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Ads Performance</h2>
          {!summary?.ads.length ? (
            <p className="text-gray-500 text-center py-4">No ads data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-1 font-medium text-gray-600">Ad</th>
                    <th className="text-right py-2 px-1 font-medium text-gray-600">Imp</th>
                    <th className="text-right py-2 px-1 font-medium text-gray-600">Clicks</th>
                    <th className="text-right py-2 px-1 font-medium text-gray-600">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.ads.slice(0, 10).map((ad) => {
                    const adCtr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
                    return (
                      <tr
                        key={ad.adId}
                        className="border-b last:border-0 cursor-pointer hover:bg-gray-50"
                        onClick={() => fetchAdDetail(ad.adId)}
                      >
                        <td className="py-2 px-1 truncate max-w-[150px]">{ad.title}</td>
                        <td className="text-right py-2 px-1">{ad.impressions.toLocaleString()}</td>
                        <td className="text-right py-2 px-1">{ad.clicks.toLocaleString()}</td>
                        <td className="text-right py-2 px-1">{adCtr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ad Detail Modal */}
      {selectedAdId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {detailLoading ? "Loading..." : adDetail?.adId ? `Ad #${adDetail.adId} Analytics` : "Ad Analytics"}
                </h2>
                <button
                  onClick={() => { setSelectedAdId(null); setAdDetail(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : adDetail ? (
                <div className="space-y-6">
                  {/* Event Stats */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Event Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(adDetail.events).map(([event, count]) => (
                        <div key={event} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">{event.replace(/_/g, " ")}</p>
                          <p className="text-lg font-bold text-gray-900">{count.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Device Breakdown */}
                  {Object.keys(adDetail.devices).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DevicePhoneMobileIcon className="h-5 w-5" />
                        Device Breakdown
                      </h3>
                      <div className="flex gap-4">
                        {Object.entries(adDetail.devices).map(([device, count]) => (
                          <div key={device} className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{device}</span>
                            <span className="font-medium">{count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Breakdown */}
                  {adDetail.locations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPinIcon className="h-5 w-5" />
                        Top Locations
                      </h3>
                      <div className="space-y-2">
                        {adDetail.locations.slice(0, 5).map((loc, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">
                              {loc.county !== "Unknown" ? loc.county : ""} 
                              {loc.constituency !== "Unknown" ? `, ${loc.constituency}` : ""}
                              {loc.county === "Unknown" && loc.constituency === "Unknown" ? "Unknown Location" : ""}
                            </span>
                            <span className="font-medium">{loc.count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unique Viewers */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="text-sm text-amber-700">Unique Viewers</p>
                      <p className="text-xl font-bold text-amber-900">{adDetail.uniqueViewers.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "blue" | "green" | "amber" | "red" | "purple" | "teal";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    teal: "bg-teal-100 text-teal-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`p-2 rounded-lg ${colorClasses[color]} w-fit mb-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
