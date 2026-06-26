"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  helpersApi,
  AdminUser,
  HelperStats,
  CreateHelperRequest,
  PageResponse,
} from "@/lib/api";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
  UserCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${color.replace("text-", "bg-").replace("600", "100")} flex items-center justify-center`}>
        <WrenchScrewdriverIcon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
}

// ─── Verification Badge ─────────────────────────────────────────────────────

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; Icon: any; label: string }> = {
    VERIFIED: { bg: "bg-emerald-50", text: "text-emerald-700", Icon: CheckBadgeIcon, label: "Verified" },
    PENDING:  { bg: "bg-amber-50",   text: "text-amber-700",   Icon: ClockIcon,      label: "Pending"  },
    REJECTED: { bg: "bg-red-50",     text: "text-red-700",     Icon: XCircleIcon,    label: "Rejected" },
    UNVERIFIED: { bg: "bg-gray-50",  text: "text-gray-600",    Icon: XCircleIcon,    label: "Unverified" },
  };
  const s = map[status] ?? map.UNVERIFIED;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <s.Icon className="h-3.5 w-3.5" />
      {s.label}
    </span>
  );
}

// ─── Invite Modal ───────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function InviteModal({ onClose, onSuccess }: InviteModalProps) {
  const [form, setForm] = useState<CreateHelperRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await helpersApi.create(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create helper");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof CreateHelperRequest) => ({
    value: form[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Invite Helper</h2>
              <p className="text-xs text-gray-500">Creates an admin-role account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="John"
                {...field("firstName")}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Doe"
                {...field("lastName")}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              placeholder="john@example.com"
              {...field("email")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              placeholder="+254 7XX XXX XXX"
              {...field("phone")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                required
                minLength={6}
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                {...field("password")}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Share this with the helper so they can log in.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              {loading ? "Creating..." : "Create Helper"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Remove Modal ───────────────────────────────────────────────────

interface ConfirmRemoveProps {
  helper: AdminUser;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ConfirmRemoveModal({ helper, onCancel, onConfirm, loading }: ConfirmRemoveProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Helper</h3>
        <p className="text-sm text-gray-500 mb-6">
          This will demote <strong>{helper.firstName} {helper.lastName}</strong> back to a regular user. They will lose admin access immediately.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-60 text-sm flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function HelpersPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  const [helpers, setHelpers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<HelperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [blockedFilter, setBlockedFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [authLoading, isSuperAdmin, router]);

  // ── Fetch ──────────────────────────────────────────────────────

  const fetchHelpers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const blocked =
        blockedFilter === "true" ? true : blockedFilter === "false" ? false : undefined;
      const data: PageResponse<AdminUser> = await helpersApi.getAll(
        page,
        pageSize,
        search,
        verificationFilter || undefined,
        blocked
      );
      setHelpers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.message || "Failed to load helpers");
    } finally {
      setLoading(false);
    }
  }, [page, search, verificationFilter, blockedFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await helpersApi.getStats();
      setStats(s);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (isSuperAdmin) {
        fetchHelpers();
        fetchStats();
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [isSuperAdmin, fetchHelpers, fetchStats]);

  // ── Actions ────────────────────────────────────────────────────

  const handleToggleBlock = async (helper: AdminUser) => {
    setActionLoading(helper.id);
    try {
      if (helper.blocked) {
        await helpersApi.unblock(helper.id);
      } else {
        const reason = prompt("Enter reason for blocking this helper:");
        if (reason === null) return; // cancelled
        await helpersApi.block(helper.id, reason);
      }
      await Promise.all([fetchHelpers(), fetchStats()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setActionLoading(removeTarget.id);
    try {
      await helpersApi.remove(removeTarget.id);
      setRemoveTarget(null);
      await Promise.all([fetchHelpers(), fetchStats()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered (client-side search) ─────────────────────────────

  const filtered = helpers.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.firstName?.toLowerCase().includes(q) ||
      h.lastName?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q) ||
      h.phone?.toLowerCase().includes(q)
    );
  });

  // ── Early returns ──────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Modals */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            fetchHelpers();
            fetchStats();
          }}
        />
      )}
      {removeTarget && (
        <ConfirmRemoveModal
          helper={removeTarget}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemove}
          loading={actionLoading === removeTarget.id}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <WrenchScrewdriverIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helpers</h1>
            <p className="text-sm text-gray-500">
              Admin-role users who help manage the platform
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-sm text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Invite Helper
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Helpers" value={stats?.total ?? 0} color="text-gray-700" />
        <StatCard label="Active" value={stats?.active ?? 0} color="text-emerald-600" />
        <StatCard label="Blocked" value={stats?.blocked ?? 0} color="text-red-600" />
        <StatCard label="Verified" value={stats?.verified ?? 0} color="text-blue-600" />
        <StatCard label="Pending" value={stats?.pending ?? 0} color="text-amber-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Verification filter */}
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
          >
            <option value="">All Verifications</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Blocked filter */}
          <select
            value={blockedFilter}
            onChange={(e) => {
              setBlockedFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading helpers…</p>
          </div>
        )}
        {filtered.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <WrenchScrewdriverIcon className="h-14 w-14 mb-3 text-gray-200" />
            <p className="text-base font-medium text-gray-500">No helpers found</p>
            <p className="text-sm mt-1">
              {search || verificationFilter || blockedFilter
                ? "Try adjusting your filters"
                : "Click 'Invite Helper' to add the first one"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Helper",
                    "Email",
                    "Phone",
                    "Verification",
                    "Status",
                    "Listings",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((helper) => (
                  <tr
                    key={helper.id}
                    className={`transition-colors ${
                      helper.blocked
                        ? "bg-red-50/40 hover:bg-red-50/60"
                        : "hover:bg-gray-50/60"
                    }`}
                  >
                    {/* Helper */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {helper.avatarUrl ? (
                          <img
                            src={helper.avatarUrl}
                            alt={helper.firstName}
                            className="h-9 w-9 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-amber-700">
                              {helper.firstName?.[0] ?? "H"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {helper.firstName} {helper.lastName}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 mt-0.5">
                            <WrenchScrewdriverIcon className="h-3 w-3" />
                            Helper
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-gray-600">{helper.email}</td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {helper.phone || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Verification */}
                    <td className="px-5 py-4">
                      <VerificationBadge status={helper.verificationStatus} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {helper.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
                          <NoSymbolIcon className="h-3.5 w-3.5" />
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Listings */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {helper.rentalCount ?? 0}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {helper.createdAt
                        ? new Date(helper.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Block / Unblock */}
                        <button
                          onClick={() => handleToggleBlock(helper)}
                          disabled={actionLoading === helper.id}
                          title={helper.blocked ? "Unblock helper" : "Block helper"}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                            helper.blocked
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-red-500 hover:bg-red-50"
                          }`}
                        >
                          {actionLoading === helper.id ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                          ) : helper.blocked ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <NoSymbolIcon className="h-5 w-5" />
                          )}
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => setRemoveTarget(helper)}
                          title="Remove helper role"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}
            </span>{" "}
            of <span className="font-medium text-gray-700">{totalElements}</span> helpers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
