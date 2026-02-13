"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { superAdminApi, SuperAdminStats, AdminUser } from "@/lib/api";
import {
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, isSuperAdmin, isLoading } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, pendingData] = await Promise.all([
        superAdminApi.getStats(),
        superAdminApi.getPendingVerifications(),
      ]);
      setStats(statsData);
      setPendingUsers(pendingData);
    } catch (err) {
      setError("Failed to load super admin data");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
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
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Oversee all users and rentals across the platform</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.verifiedUsers || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckBadgeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
              <p className="text-3xl font-bold text-amber-600">{stats?.pendingVerifications || 0}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rentals</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalRentals || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* More Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Approvals</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Approvals</span>
              <span className="font-semibold text-amber-600">{stats?.pendingApprovals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approved Rentals</span>
              <span className="font-semibold text-green-600">{stats?.approvedRentals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Rentals</span>
              <span className="font-semibold text-blue-600">{stats?.activeRentals || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Admins</span>
              <span className="font-semibold">{stats?.totalAdmins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Regular Users</span>
              <span className="font-semibold">{stats?.totalUsers || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/super-admin/users"
              className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View All Users
            </Link>
            <Link
              href="/super-admin/pending"
              className="block w-full text-center py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Review Pending
            </Link>
            <Link
              href="/super-admin/ad-settings"
              className="block w-full text-center py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Ad Settings
            </Link>
            <Link
              href="/super-admin/ad-analytics"
              className="block w-full text-center py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Ad Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Verifications ({pendingUsers.length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingUsers.slice(0, 5).map((admin) => (
              <div key={admin.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {admin.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {admin.firstName} {admin.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    {admin.userType || "INDIVIDUAL"}
                  </span>
                  <Link
                    href={`/super-admin/users?verify=${admin.id}`}
                    className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {pendingUsers.length > 5 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Link
                href="/super-admin/users?filter=pending"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                View all {pendingUsers.length} pending verifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
