"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { analyticsApi, AnalyticsData, AreaAnalytics } from "@/lib/api";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  FireIcon,
  StarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Simple chart component for bar charts
function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 truncate" title={key}>
            {key}
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.max((value / maxValue) * 100, 10)}%` }}
            >
              <span className="text-xs text-white font-medium">{value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple line chart for trends
function TrendChart({ data }: { data: { month: string; rentalsCreated: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.rentalsCreated), 1);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No trend data available
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-2 h-48 px-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center justify-end h-40">
            <div
              className="w-full max-w-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500"
              style={{
                height: `${Math.max((item.rentalsCreated / maxValue) * 100, 5)}%`,
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {item.month.split(" ")[0]}
          </div>
          <div className="text-xs font-medium text-gray-700">
            {item.rentalsCreated}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tier badge component
function TierBadge({ tier, type }: { tier: string; type: 'rent' | 'speed' | 'demand' }) {
  const getColors = () => {
    if (type === 'rent') {
      switch (tier) {
        case 'PREMIUM': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'HIGH': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'MODERATE': return 'bg-green-100 text-green-800 border-green-200';
        case 'AFFORDABLE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'BUDGET': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else if (type === 'speed') {
      switch (tier) {
        case 'VERY_FAST': return 'bg-green-100 text-green-800 border-green-200';
        case 'FAST': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'SLOW': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'VERY_SLOW': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      switch (tier) {
        case 'VERY_HIGH': return 'bg-red-100 text-red-800 border-red-200';
        case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'VERY_LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  const formatTier = (t: string) => t.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColors()}`}>
      {formatTier(tier)}
    </span>
  );
}

// Area ranking card component
function AreaRankingCard({ area, formatCurrency }: { area: AreaAnalytics; formatCurrency: (value: number) => string }) {
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-800';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(area.rank)}`}>
            #{area.rank}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{area.areaName}</h3>
            <p className="text-sm text-gray-500">{area.totalListings} listings</p>
          </div>
        </div>
        <TierBadge tier={area.demandLevel} type="demand" />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">Avg Rent</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(area.averageRent)}</p>
          <TierBadge tier={area.rentTier} type="rent" />
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BoltIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500">Speed</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{area.averageDaysToRent}d</p>
          <TierBadge tier={area.speedTier} type="speed" />
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ChartBarIcon className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-500">Occupancy</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{area.occupancyRate}%</p>
          <span className="text-xs text-gray-500">{area.rentedListings}/{area.totalListings}</span>
        </div>
      </div>

      {/* Rent Range */}
      <div className="flex items-center justify-between text-sm mb-3 px-2">
        <span className="text-gray-500">Rent Range:</span>
        <span className="font-medium text-gray-900">
          {formatCurrency(area.minRent)} - {formatCurrency(area.maxRent)}
        </span>
      </div>

      {/* Rankings */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span>Rent Rank: <strong className="text-gray-700">#{area.rentRank}</strong></span>
        <span>Speed Rank: <strong className="text-gray-700">#{area.speedRank}</strong></span>
      </div>

      {/* Market Description */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-sm text-blue-800 leading-relaxed">{area.marketDescription}</p>
      </div>

      {/* Property Mix */}
      {Object.keys(area.propertyTypeMix).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Property Mix:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(area.propertyTypeMix).map(([type, count]) => (
              <span key={type} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    // Wait until auth state is resolved before querying analytics.
    if (authLoading) return;
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Superadmins see global analytics, regular admins see only their own.
      const data = isSuperAdmin
        ? await analyticsApi.getAnalytics()
        : await analyticsApi.getUserAnalytics(user.id);
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, user?.id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            {isSuperAdmin ? "Track all rental property performance across the platform" : "Track your rental property performance"}
          </p>
          {isSuperAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
              Super Admin - Viewing All Properties
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            {isSuperAdmin ? "Track all rental property performance across the platform" : "Track your rental property performance"}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700">{error || "Failed to load analytics"}</p>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const overviewStats = [
    {
      name: "Total Rentals",
      value: analytics.totalRentals,
      icon: BuildingOfficeIcon,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      name: "Active Listings",
      value: analytics.activeRentals,
      icon: CheckCircleIcon,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      name: "Pending Review",
      value: analytics.pendingRentals,
      icon: ClockIcon,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Rented",
      value: analytics.rentedRentals,
      icon: HomeModernIcon,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      name: "Total Users",
      value: analytics.totalUsers,
      icon: UserGroupIcon,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
    },
    {
      name: "Conversations",
      value: analytics.totalConversations,
      icon: ChatBubbleLeftRightIcon,
      color: "bg-pink-500",
      bgColor: "bg-pink-50",
    },
    {
      name: "Messages",
      value: analytics.totalMessages,
      icon: EnvelopeIcon,
      color: "bg-teal-500",
      bgColor: "bg-teal-50",
    },
    {
      name: "Inactive",
      value: analytics.inactiveRentals,
      icon: ExclamationCircleIcon,
      color: "bg-red-500",
      bgColor: "bg-red-50",
    },
  ];

  const priceStats = [
    {
      name: "Average Price",
      value: formatCurrency(analytics.averagePrice),
      icon: CurrencyDollarIcon,
      color: "text-green-600",
    },
    {
      name: "Min Price",
      value: formatCurrency(analytics.minPrice),
      icon: ArrowTrendingUpIcon,
      color: "text-blue-600",
    },
    {
      name: "Max Price",
      value: formatCurrency(analytics.maxPrice),
      icon: ArrowTrendingUpIcon,
      color: "text-purple-600",
    },
    {
      name: "Revenue Potential",
      value: formatCurrency(analytics.totalRevenuePotential),
      icon: CurrencyDollarIcon,
      color: "text-emerald-600",
    },
  ];

  const propertyStats = [
    { name: "Avg Bedrooms", value: analytics.averageBedrooms.toFixed(1) },
    { name: "Avg Bathrooms", value: analytics.averageBathrooms.toFixed(1) },
    { name: "Avg Sq Ft", value: formatNumber(analytics.averageSquareFeet) },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">
          {isSuperAdmin 
            ? "Comprehensive overview of all rental property performance across the platform"
            : "Comprehensive overview of your rental property performance"}
        </p>
        {isSuperAdmin && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
            Super Admin - Viewing All Properties
          </span>
        )}
      </div>

      {/* Overview Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Price Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {priceStats.map((stat) => (
            <div key={stat.name} className="text-center">
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Property Averages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Property Averages
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {propertyStats.map((stat) => (
            <div key={stat.name} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rentals by Property Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rentals by Property Type
          </h2>
          <BarChart data={analytics.rentalsByPropertyType} label="Type" />
        </div>

        {/* Rentals by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rentals by Status
          </h2>
          <BarChart data={analytics.rentalsByStatus} label="Status" />
        </div>
      </div>

      {/* Rentals by County */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <MapPinIcon className="w-6 h-6 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Rentals by County
          </h2>
        </div>
        <BarChart data={analytics.rentalsByCounty} label="County" />
      </div>

      {/* Area Rankings Section */}
      {analytics.areaAnalytics && analytics.areaAnalytics.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FireIcon className="w-6 h-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Area Market Rankings
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <StarIcon className="w-4 h-4" />
                Ranked by overall market performance
              </span>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.areaAnalytics.length}</p>
                <p className="text-xs text-gray-600">Total Areas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {analytics.areaAnalytics.filter(a => a.speedTier === 'VERY_FAST' || a.speedTier === 'FAST').length}
                </p>
                <p className="text-xs text-gray-600">Fast-Moving Markets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.areaAnalytics.filter(a => a.rentTier === 'PREMIUM' || a.rentTier === 'HIGH').length}
                </p>
                <p className="text-xs text-gray-600">High-Rent Areas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.areaAnalytics.filter(a => a.demandLevel === 'VERY_HIGH' || a.demandLevel === 'HIGH').length}
                </p>
                <p className="text-xs text-gray-600">High-Demand Areas</p>
              </div>
            </div>
          </div>

          {/* Top 3 Areas Highlight */}
          {analytics.areaAnalytics.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.areaAnalytics.slice(0, 3).map((area, index) => (
                <div 
                  key={area.areaName}
                  className={`rounded-xl p-4 border-2 ${
                    index === 0 ? 'bg-yellow-50 border-yellow-300' :
                    index === 1 ? 'bg-gray-50 border-gray-300' :
                    'bg-amber-50 border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl ${
                      index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                    }`}></span>
                    <span className="font-bold text-gray-900">{area.areaName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Rent:</span>
                      <span className="font-medium ml-1">{formatCurrency(area.averageRent)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Speed:</span>
                      <span className="font-medium ml-1">{area.averageDaysToRent}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Area Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.areaAnalytics.map((area) => (
              <AreaRankingCard 
                key={area.areaName} 
                area={area} 
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Understanding the Rankings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-medium text-gray-700 mb-2">Rent Tiers:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><TierBadge tier="PREMIUM" type="rent" /> <span>50%+ above average</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="HIGH" type="rent" /> <span>20-50% above average</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="MODERATE" type="rent" /> <span>Near average</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="AFFORDABLE" type="rent" /> <span>20-50% below average</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="BUDGET" type="rent" /> <span>50%+ below average</span></div>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-2">Speed Tiers (Avg Days to Rent):</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><TierBadge tier="VERY_FAST" type="speed" /> <span>≤7 days</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="FAST" type="speed" /> <span>8-14 days</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="MODERATE" type="speed" /> <span>15-30 days</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="SLOW" type="speed" /> <span>31-60 days</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="VERY_SLOW" type="speed" /> <span>60+ days</span></div>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-2">Demand Levels:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><TierBadge tier="VERY_HIGH" type="demand" /> <span>High occupancy + fast rentals</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="HIGH" type="demand" /> <span>Strong activity</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="MODERATE" type="demand" /> <span>Balanced market</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="LOW" type="demand" /> <span>Slower market</span></div>
                  <div className="flex items-center gap-2"><TierBadge tier="VERY_LOW" type="demand" /> <span>Low activity</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <ArrowTrendingUpIcon className="w-6 h-6 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Rentals Created - Last 6 Months
          </h2>
        </div>
        <TrendChart data={analytics.monthlyTrends} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        {analytics.recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
                <Link
                  href={`/rentals/${activity.entityId}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
