"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { superAdminApi, AdminUser } from "@/lib/api";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  XMarkIcon,
  StarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

function SuperAdminUsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSuperAdmin, isLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showGrantPremiumFor, setShowGrantPremiumFor] = useState<AdminUser | null>(null);
  const [grantDuration, setGrantDuration] = useState(30);
  const [grantPlatform, setGrantPlatform] = useState("REALADMIN");
  const [showPaymentsFor, setShowPaymentsFor] = useState<AdminUser | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, isSuperAdmin, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (isSuperAdmin) {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [isSuperAdmin, filter, searchQuery, page]);

  useEffect(() => {
    const verifyId = searchParams.get("verify");
    if (verifyId && users.length > 0) {
      const user = users.find((u) => u.id === parseInt(verifyId));
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [searchParams, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let data;
      if (filter === "pending") {
        data = await superAdminApi.getPendingVerifications(searchQuery, page, pageSize);
      } else {
        data = await superAdminApi.getAllAdmins(searchQuery, page, pageSize);
      }
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (decision: "VERIFIED" | "REJECTED") => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await superAdminApi.verifyAdmin(selectedUser.id, decision, verifyNotes);
      setSelectedUser(null);
      setVerifyNotes("");
      fetchUsers();
    } catch (err) {
      setError("Failed to process verification");
    } finally {
      setProcessing(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await superAdminApi.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      setError("Failed to update role");
    }
  };

  const handleGrantPremium = async () => {
    if (!showGrantPremiumFor) return;
    setProcessing(true);
    try {
      await superAdminApi.grantPremium(showGrantPremiumFor.id, grantDuration, grantPlatform);
      setShowGrantPremiumFor(null);
      alert("Premium granted successfully");
      fetchUsers();
    } catch (err) {
      alert("Failed to grant premium");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewPayments = async (user: AdminUser) => {
    setShowPaymentsFor(user);
    setLoadingPayments(true);
    try {
      const data = await superAdminApi.getUserPayments(user.id);
      setPayments(data);
    } catch (err) {
      alert("Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircleIcon className="h-3 w-3" /> Verified
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
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            Unverified
          </span>
        );
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case "AGENT":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            🏆 Agent
          </span>
        );
      case "COMPANY":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            🏢 Company
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            Individual
          </span>
        );
    }
  };

  const filteredUsers = users; // Filtering is now handled on the backend

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-600">Manage user verification and roles</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => {
            setFilter("all");
            setPage(0);
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => {
            setFilter("pending");
            setPage(0);
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "pending"
              ? "bg-amber-600 text-white"
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          Pending Verification
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rentals
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {user.firstName?.[0] || "U"}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getUserTypeBadge(user.userType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.verificationStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.rentalCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2 items-center">
                  {user.verificationStatus === "PENDING" && (
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-amber-600 hover:text-amber-900 font-medium"
                    >
                      Review
                    </button>
                  )}
                  <button
                    onClick={() => setShowGrantPremiumFor(user)}
                    title="Grant Premium"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <StarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleViewPayments(user)}
                    title="View Payments"
                    className="text-green-600 hover:text-green-900"
                  >
                    <CurrencyDollarIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {users.length === 0 ? "No users found." : "No users match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}
            </span>{" "}
            of <span className="font-medium text-gray-700">{totalElements}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-gray-700"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-gray-700"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-gray-700"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white text-gray-700"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Verify User: {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Type</label>
                  <p className="mt-1">{getUserTypeBadge(selectedUser.userType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">National ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.nationalId || "Not provided"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.verifiedPhone || selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Verified</label>
                  <p className="mt-1">
                    {selectedUser.phoneVerified ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Face Verified</label>
                  <p className="mt-1">
                    {selectedUser.faceVerified ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </p>
                </div>
              </div>

              {selectedUser.nationalIdImageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Document</label>
                  <img
                    src={selectedUser.nationalIdImageUrl}
                    alt="National ID"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}

              {selectedUser.faceImageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Face Verification</label>
                  <img
                    src={selectedUser.faceImageUrl}
                    alt="Face"
                    className="max-w-xs h-auto rounded-lg border"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Add notes about this verification..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleVerify("REJECTED")}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => handleVerify("VERIFIED")}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Premium Modal */}
      {showGrantPremiumFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Grant Premium</h3>
              <button onClick={() => setShowGrantPremiumFor(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Grant premium access to <strong>{showGrantPremiumFor.firstName} {showGrantPremiumFor.lastName}</strong>.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">Platform</label>
                <select
                  value={grantPlatform}
                  onChange={(e) => setGrantPlatform(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="REALADMIN">RealAdmin Pro (Landlord)</option>
                  <option value="DWELLY">Dwelly Premium (Tenant)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                <input
                  type="number"
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowGrantPremiumFor(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantPremium}
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Payments Modal */}
      {showPaymentsFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment History: {showPaymentsFor.firstName} {showPaymentsFor.lastName}</h3>
              <button onClick={() => setShowPaymentsFor(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {loadingPayments ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : payments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No payments found for this user.</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((p) => (
                    <div key={p.id} className={`p-4 border rounded-lg ${p.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{p.subscriptionType} - {p.amount} KSH</p>
                          <p className="text-sm text-gray-600">Status: {p.status}</p>
                          <p className="text-sm text-gray-600">Phone: {p.phoneNumber}</p>
                          <p className="text-xs text-gray-500 mt-1">{p.resultDesc}</p>
                          {p.merchantRequestId && p.phoneNumber === 'MANUAL_GRANT' && (
                            <p className="text-xs text-indigo-600 mt-1">Granted By: {p.merchantRequestId}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
                          {p.mpesaReceiptNumber && (
                            <p className="text-sm font-mono mt-1">{p.mpesaReceiptNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <SuperAdminUsersPageContent />
    </Suspense>
  );
}
