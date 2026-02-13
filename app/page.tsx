"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { rentalsApi, RentalStats } from "@/lib/api";
import { 
  BuildingOfficeIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  HomeIcon
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchStats = async () => {
      // Wait until auth is loaded and we have a user
      if (authLoading || !user?.id) return;
      
      try {
        console.log('Fetching stats:', { userId: user.id, role: user.role, isSuperAdmin });
        // Superadmins see global stats, regular admins see only their own
        const data = isSuperAdmin 
          ? await rentalsApi.getStats()
          : await rentalsApi.getUserStats(user.id);
        console.log('Stats received:', data);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [authLoading, user?.id, user?.role, isSuperAdmin]);

  const statCards = [
    {
      name: "Total Rentals",
      value: stats?.totalRentals ?? 0,
      icon: BuildingOfficeIcon,
      color: "bg-blue-500",
    },
    {
      name: "Active Listings",
      value: stats?.activeRentals ?? 0,
      icon: CheckCircleIcon,
      color: "bg-green-500",
    },
    {
      name: "Rented",
      value: stats?.rentedRentals ?? 0,
      icon: HomeIcon,
      color: "bg-purple-500",
    },
    {
      name: "Pending",
      value: stats?.pendingRentals ?? 0,
      icon: ClockIcon,
      color: "bg-yellow-500",
    },
    {
      name: "Inactive",
      value: stats?.inactiveRentals ?? 0,
      icon: ExclamationCircleIcon,
      color: "bg-red-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          {isSuperAdmin 
            ? "Welcome back! Here's an overview of all rental properties across the platform."
            : "Welcome back! Here's an overview of your rental properties."}
        </p>
        {isSuperAdmin && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
            Super Admin - Viewing All Properties
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              href="/rentals/new"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="bg-blue-500 p-2 rounded-lg">
                <BuildingOfficeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Add New Rental</p>
                <p className="text-sm text-gray-600">Create a new rental listing</p>
              </div>
            </Link>
            <Link
              href="/rentals"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="bg-green-500 p-2 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Manage Rentals</p>
                <p className="text-sm text-gray-600">View and edit all listings</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3">1</span>
              <p>Make sure the Spring Boot backend is running on port 8080</p>
            </div>
            <div className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3">2</span>
              <p>Add new rental properties with photos and details</p>
            </div>
            <div className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3">3</span>
              <p>Manage listing status (Active, Pending, Rented, Inactive)</p>
            </div>
            <div className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3">4</span>
              <p>View analytics to track your rental performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
