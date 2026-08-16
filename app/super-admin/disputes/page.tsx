"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { helperJobsApi } from "@/lib/api";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function DisputesPage() {
  const { isSuperAdmin, token } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (token && isSuperAdmin) fetchDisputes();
  }, [token, isSuperAdmin]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await helperJobsApi.getDisputes();
      setDisputes(res);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (jobId: number, action: "REFUND_CLIENT" | "PAY_HELPER" | "REFUND_CLIENT_B2C", phone?: string) => {
    if (!window.confirm("Are you sure you want to resolve this dispute? This action cannot be undone.")) return;
    setActionLoading(jobId);
    setMessage(null);
    try {
      const res = await helperJobsApi.resolveDispute(jobId, action, phone);
      setMessage({ type: "success", text: res.message });
      fetchDisputes();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleB2CRefund = (job: any) => {
    const defaultPhone = job.client?.phone || "";
    const enteredPhone = window.prompt(
      `Enter client M-Pesa phone number to automatically refund KES ${job.amount} via B2C:`,
      defaultPhone
    );
    if (enteredPhone === null) return; // cancelled
    if (!enteredPhone.trim()) {
      alert("Please provide a valid phone number for the B2C payout.");
      return;
    }
    handleResolve(job.id, "REFUND_CLIENT_B2C", enteredPhone.trim());
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-red-600">
        <p className="text-lg font-bold">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Helper Job Disputes</h1>
        <p className="text-gray-600">Review and resolve disputes between clients and helpers.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-0">
          {disputes.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No active disputes</p>
              <p className="text-sm">All clear! There are no disputes to resolve at the moment.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {disputes.map((job: any) => (
                <li key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900 text-lg">
                          Job #{job.id}
                        </span>
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          {job.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-gray-500 font-medium mb-1">Client</p>
                          <p className="text-gray-900 font-bold">{job.client?.firstName} {job.client?.lastName}</p>
                          <p className="text-gray-600">{job.client?.email}</p>
                          <p className="text-gray-600">{job.client?.phone}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-gray-500 font-medium mb-1">Helper</p>
                          <p className="text-gray-900 font-bold">{job.helper?.firstName} {job.helper?.lastName}</p>
                          <p className="text-gray-600">{job.helper?.email}</p>
                          <p className="text-gray-600">{job.helper?.phone}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-gray-500 text-sm font-medium mb-1">Job Details</p>
                        <p className="text-gray-900">{job.description || "No description provided."}</p>
                      </div>
                      
                      <div className="mt-4 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Amount in Escrow:</span>
                          <span className="font-bold text-gray-900 text-lg">KES {job.amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 border-l pl-4">
                          <span className="text-gray-500">M-Pesa Receipt:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">{job.mpesaReceipt || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-1">Resolution Actions</p>
                      <button
                        onClick={() => handleB2CRefund(job)}
                        disabled={actionLoading === job.id}
                        className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
                      >
                        {actionLoading === job.id ? "Processing..." : "Refund via M-Pesa B2C"}
                      </button>
                      <button
                        onClick={() => handleResolve(job.id, "REFUND_CLIENT")}
                        disabled={actionLoading === job.id}
                        className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === job.id ? "Processing..." : "Mark Refunded (Manual)"}
                      </button>
                      <button
                        onClick={() => handleResolve(job.id, "PAY_HELPER")}
                        disabled={actionLoading === job.id}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
                      >
                        {actionLoading === job.id ? "Processing..." : "Pay Helper"}
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        B2C directly sends funds to phone via M-Pesa. Manual only changes status.
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
