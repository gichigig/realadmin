"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  FlagIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  UserIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

interface Report {
  id: number;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  rentalId: number;
  rentalTitle: string;
  rentalImageUrl?: string;
  rentalReportCount?: number;
  rentalFlagged?: boolean;
  rentalDeprioritized?: boolean;
  rentalAutoFlagged?: boolean;
  reportedUserId: number;
  reportedUserName: string;
  reportedUserEmail: string;
  reportedUserBlocked?: boolean;
  reason: string;
  reasonDisplayName: string;
  description: string;
  status: string;
  reviewedById?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  adminNotes?: string;
  actionTaken?: string;
  createdAt: string;
  updatedAt?: string;
}

interface MostReportedRental {
  rentalId: number;
  title: string;
  totalReports: number;
  pendingReports: number;
}

interface MostReportedUser {
  userId: number;
  email: string;
  displayName: string;
  totalReports: number;
  pendingReports: number;
}

interface ReportStats {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  resolvedReports: number;
  dismissedReports: number;
  rentalsWithMultipleReports: number;
  usersWithMultipleReports: number;
  mostReportedRentals?: MostReportedRental[];
  mostReportedUsers?: MostReportedUser[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";

export default function ReportsPage() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowProcessingId, setRowProcessingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const url = statusFilter === "ALL" 
        ? `${API_BASE}/reports`
        : `${API_BASE}/reports/status/${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/reports/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [fetchReports, fetchStats]);

  const submitRowAction = async (
    report: Report,
    payload: { status: string; action: string; adminNotes?: string; blockReason?: string }
  ) => {
    if (!token) return;
    setRowProcessingId(report.id);
    setActionError("");
    setActionMessage("");
    try {
      const response = await fetch(`${API_BASE}/reports/${report.id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setActionError(errorText || "Action failed");
        return;
      }

      await Promise.all([fetchReports(), fetchStats()]);
      setActionMessage(
        payload.status === "RESOLVED" && statusFilter === "PENDING"
          ? "Action applied. Report moved to RESOLVED."
          : "Action applied successfully."
      );
    } catch (error) {
      console.error("Failed to apply row action:", error);
      setActionError("Failed to apply action");
    } finally {
      setRowProcessingId(null);
    }
  };

  const handleRowFlag = async (report: Report) => {
    await submitRowAction(report, {
      status: "RESOLVED",
      action: "RENTAL_FLAGGED",
      adminNotes: "Flagged from reports table quick action.",
    });
  };

  const handleRowTakeDown = async (report: Report) => {
    if (!confirm("Take down this rental now? It will be set to inactive.")) return;
    await submitRowAction(report, {
      status: "RESOLVED",
      action: "RENTAL_REMOVED",
      adminNotes: "Taken down from reports table quick action.",
    });
  };

  const handleRowSuspend = async (report: Report) => {
    if (!confirm("Suspend this account now?")) return;
    await submitRowAction(report, {
      status: "RESOLVED",
      action: "USER_BLOCKED",
      adminNotes: "Account suspended from reports table quick action.",
      blockReason: "Suspended by super admin via reports moderation.",
    });
  };

  const handleRowUnsuspend = async (report: Report) => {
    if (!token) return;
    if (!confirm("Unsuspend this account?")) return;

    setRowProcessingId(report.id);
    try {
      const response = await fetch(`${API_BASE}/reports/unblock-user/${report.reportedUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setActionError(errorText || "Failed to unsuspend account");
        return;
      }

      await Promise.all([fetchReports(), fetchStats()]);
      setActionMessage("Account unsuspended successfully.");
    } catch (error) {
      console.error("Failed to unsuspend account:", error);
      setActionError("Failed to unsuspend account");
    } finally {
      setRowProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <MagnifyingGlassIcon className="w-3 h-3 mr-1" />
            Under Review
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Resolved
          </span>
        );
      case "DISMISSED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Dismissed
          </span>
        );
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage user reports on listings
        </p>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.underReviewReports}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedReports}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Risk Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usersWithMultipleReports}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Most Reported Section */}
      {stats && (stats.mostReportedRentals?.length || stats.mostReportedUsers?.length) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Most Reported Rentals */}
          {stats.mostReportedRentals && stats.mostReportedRentals.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <HomeIcon className="w-5 h-5 text-red-500 mr-2" />
                Most Reported Rentals
              </h3>
              <div className="space-y-2">
                {stats.mostReportedRentals.slice(0, 5).map((rental) => (
                  <div key={rental.rentalId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rental.title}</div>
                      <div className="text-xs text-gray-500">ID: {rental.rentalId}</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        {rental.totalReports} reports
                      </span>
                      {rental.pendingReports > 0 && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {rental.pendingReports} pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Most Reported Users */}
          {stats.mostReportedUsers && stats.mostReportedUsers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <UserIcon className="w-5 h-5 text-red-500 mr-2" />
                Most Reported Users
              </h3>
              <div className="space-y-2">
                {stats.mostReportedUsers.slice(0, 5).map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.displayName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        {user.totalReports} reports
                      </span>
                      {user.pendingReports > 0 && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {user.pendingReports} pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["ALL", "PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                statusFilter === status
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {status === "ALL" ? "All Reports" : status.replace("_", " ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <FlagIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-500">No reports found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {report.rentalImageUrl ? (
                        <img 
                          src={report.rentalImageUrl} 
                          alt="" 
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                      ) : (
                        <HomeIcon className="w-5 h-5 text-gray-400 mr-3" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.rentalTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          Reported by: {report.reporterName}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {report.rentalReportCount && report.rentalReportCount > 1 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              {report.rentalReportCount} reports
                            </span>
                          )}
                          {report.rentalDeprioritized && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Deprioritized
                            </span>
                          )}
                          {report.rentalAutoFlagged && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Auto-flagged
                            </span>
                          )}
                          {report.rentalFlagged && !report.rentalAutoFlagged && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Flagged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.reportedUserName}
                          {report.reportedUserBlocked && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.reportedUserEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {report.reasonDisplayName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReviewModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Review
                      </button>
                      <button
                        onClick={() => handleRowFlag(report)}
                        disabled={rowProcessingId === report.id}
                        className="px-2 py-1 text-xs text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50"
                      >
                        Flag
                      </button>
                      <button
                        onClick={() => handleRowTakeDown(report)}
                        disabled={rowProcessingId === report.id}
                        className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Take Down
                      </button>
                      {report.reportedUserBlocked ? (
                        <button
                          onClick={() => handleRowUnsuspend(report)}
                          disabled={rowProcessingId === report.id}
                          className="px-2 py-1 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRowSuspend(report)}
                          disabled={rowProcessingId === report.id}
                          className="px-2 py-1 text-xs text-white bg-gray-800 rounded hover:bg-black disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <ReviewModal
          report={selectedReport}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReport(null);
          }}
          onUpdate={() => {
            fetchReports();
            fetchStats();
          }}
          token={token || ""}
        />
      )}
    </div>
  );
}

// Review Modal Component
function ReviewModal({
  report,
  token,
  onClose,
  onUpdate,
}: {
  report: Report;
  token: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState(report.status);
  const [action, setAction] = useState("NO_ACTION");
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || "");
  const [blockReason, setBlockReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unflagging, setUnflagging] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState(false);

  const submitReview = async (payload: {
    status: string;
    action: string;
    adminNotes?: string;
    blockReason?: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/reports/${report.id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        alert("Failed to update report");
      }
    } catch (error) {
      console.error("Failed to update report:", error);
      alert("Failed to update report");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReview({
        status,
        action,
        adminNotes,
        blockReason: action === "USER_BLOCKED" ? blockReason : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUnflagRental = async () => {
    if (!confirm("Are you sure you want to unflag this rental? This will also remove deprioritization.")) {
      return;
    }
    
    setUnflagging(true);
    try {
      const response = await fetch(`${API_BASE}/reports/unflag-rental/${report.rentalId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Rental unflagged successfully");
        onUpdate();
      } else {
        const errorData = await response.text();
        alert(`Failed to unflag rental: ${errorData || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to unflag rental:", error);
      alert("Failed to unflag rental");
    } finally {
      setUnflagging(false);
    }
  };

  const handleQuickFlagRental = async () => {
    setSubmitting(true);
    try {
      await submitReview({
        status: "RESOLVED",
        action: "RENTAL_FLAGGED",
        adminNotes: adminNotes || "Rental flagged by moderator.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTakeDownRental = async () => {
    if (!confirm("Take down this rental now? It will be set to inactive.")) {
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        status: "RESOLVED",
        action: "RENTAL_REMOVED",
        adminNotes: adminNotes || "Rental taken down by moderator.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSuspendAccount = async () => {
    if (!confirm("Suspend this account now?")) {
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        status: "RESOLVED",
        action: "USER_BLOCKED",
        adminNotes: adminNotes || "Account suspended by moderator.",
        blockReason: blockReason?.trim() || "Suspended by super admin via reports moderation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsuspendAccount = async () => {
    if (!confirm("Unsuspend this account?")) {
      return;
    }

    setUnblockingUser(true);
    try {
      const response = await fetch(`${API_BASE}/reports/unblock-user/${report.reportedUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Account unsuspended successfully");
        onUpdate();
      } else {
        const errorData = await response.text();
        alert(`Failed to unsuspend account: ${errorData || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to unsuspend account:", error);
      alert("Failed to unsuspend account");
    } finally {
      setUnblockingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Review Report #{report.id}</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Report Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Rental:</span>
                <p className="font-medium">{report.rentalTitle}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.rentalReportCount && report.rentalReportCount > 1 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      {report.rentalReportCount} total reports
                    </span>
                  )}
                  {report.rentalDeprioritized && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Deprioritized (10+ uninvestigated)
                    </span>
                  )}
                  {report.rentalAutoFlagged && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Auto-flagged (30+ reports)
                    </span>
                  )}
                  {report.rentalFlagged && !report.rentalAutoFlagged && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Manually Flagged
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Reason:</span>
                <p className="font-medium text-red-600">{report.reasonDisplayName}</p>
              </div>
              <div>
                <span className="text-gray-500">Reporter:</span>
                <p className="font-medium">{report.reporterName}</p>
                <p className="text-gray-500">{report.reporterEmail}</p>
              </div>
              <div>
                <span className="text-gray-500">Reported User:</span>
                <p className="font-medium">
                  {report.reportedUserName}
                  {report.reportedUserBlocked && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Blocked
                    </span>
                  )}
                </p>
                <p className="text-gray-500">{report.reportedUserEmail}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-gray-500">Description:</span>
              <p className="mt-1 text-gray-700">{report.description}</p>
            </div>
            
            {/* Alert for high report count */}
            {report.rentalReportCount && report.rentalReportCount >= 10 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    <strong>High report count!</strong> This rental has {report.rentalReportCount} reports.
                    {report.rentalReportCount >= 30 && " It has been auto-flagged."}
                    {report.rentalReportCount >= 10 && report.rentalReportCount < 30 && " It has been deprioritized in search results."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Moderation Actions */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Moderation Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleQuickFlagRental}
                disabled={submitting}
                className="px-3 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                Flag Rental
              </button>
              <button
                onClick={handleQuickTakeDownRental}
                disabled={submitting}
                className="px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Take Down Rental
              </button>
              <button
                onClick={handleQuickSuspendAccount}
                disabled={submitting}
                className="px-3 py-2 text-sm text-white bg-gray-800 rounded-lg hover:bg-black disabled:opacity-50"
              >
                Suspend Account
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action to Take
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="NO_ACTION">No Action</option>
              <option value="WARNING_ISSUED">Issue Warning</option>
              <option value="RENTAL_FLAGGED">Flag Rental</option>
              <option value="RENTAL_REMOVED">Take Down Rental</option>
              <option value="USER_WARNED">Warn User</option>
              <option value="USER_BLOCKED">Suspend Account (flags all rentals)</option>
            </select>
          </div>

          {/* Suspension Reason */}
          {action === "USER_BLOCKED" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Reason
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for suspending account..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="mt-1 text-sm text-red-600">
                Warning: This will suspend the account and flag all listings.
              </p>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about your decision..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <div className="flex gap-3">
            {(report.rentalFlagged || report.rentalAutoFlagged || report.rentalDeprioritized) && (
              <button
                onClick={handleUnflagRental}
                disabled={unflagging}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {unflagging ? "Unflagging..." : "Unflag Rental"}
              </button>
            )}
            {report.reportedUserBlocked && (
              <button
                onClick={handleUnsuspendAccount}
                disabled={unblockingUser}
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {unblockingUser ? "Unsuspending..." : "Unsuspend Account"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
