"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { superAdminApi, RentalWithOwnerInfo } from "@/lib/api";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminRentalsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading } = useAuth();
  const [rentals, setRentals] = useState<RentalWithOwnerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <p className="text-gray-600">View all rentals across all users</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        src={rental.imageUrls[0]}
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
