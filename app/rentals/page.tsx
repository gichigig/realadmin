"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { rentalsApi, Rental, PageResponse, RentalStatus } from "@/lib/api";
import { 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

export default function RentalsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [rentals, setRentals] = useState<PageResponse<Rental> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchRentals = async () => {
    // Wait until auth is loaded
    if (authLoading || !user?.id) return;
    
    setLoading(true);
    try {
      // Superadmins see all rentals, regular admins see only their own
      const data = isSuperAdmin
        ? await rentalsApi.getAll(page, 10)
        : await rentalsApi.getByUser(user.id, page, 10);
      setRentals(data);
    } catch (error) {
      console.error("Failed to fetch rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [authLoading, page, user?.id, isSuperAdmin]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rental?")) return;
    
    setDeleteId(id);
    try {
      await rentalsApi.delete(id);
      fetchRentals();
    } catch (error) {
      console.error("Failed to delete rental:", error);
      alert("Failed to delete rental");
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: number, status: RentalStatus) => {
    try {
      await rentalsApi.updateStatus(id, status);
      fetchRentals();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusBadge = (status: RentalStatus) => {
    const styles = {
      ACTIVE: "bg-green-100 text-green-800",
      RENTED: "bg-blue-100 text-blue-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      INACTIVE: "bg-red-100 text-red-800",
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-gray-600">
            {isSuperAdmin ? "Manage all rental properties" : "Manage your rental properties"}
          </p>
          {isSuperAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
              Super Admin - Viewing All Properties
            </span>
          )}
        </div>
        <Link
          href="/rentals/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Rental
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rentals...</p>
          </div>
        ) : rentals && rentals.content.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rentals.content.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{rental.title}</p>
                        <p className="text-sm text-gray-500">
                          {rental.bedrooms} bed • {rental.bathrooms} bath • {rental.squareFeet} sqft
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{rental.ward}, {rental.constituency}</p>
                      <p className="text-sm text-gray-500">{rental.county}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        ${rental.price.toLocaleString()}/mo
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={rental.status}
                        onChange={(e) => handleStatusChange(rental.id!, e.target.value as RentalStatus)}
                        className={getStatusBadge(rental.status)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="RENTED">Rented</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/rentals/${rental.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/rentals/${rental.id}/edit`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(rental.id!)}
                          disabled={deleteId === rental.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {rentals.number * rentals.size + 1} to{" "}
                {Math.min((rentals.number + 1) * rentals.size, rentals.totalElements)} of{" "}
                {rentals.totalElements} results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= rentals.totalPages - 1}
                  className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">No rentals found</p>
            <Link
              href="/rentals/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Your First Rental
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
