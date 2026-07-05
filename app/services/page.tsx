"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { servicesApi, helperJobsApi, locationsApi, SERVICE_CATEGORIES } from "@/lib/api";
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

export default function ServicesDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState("");
  const [serviceCategory, setServiceCategory] = useState(SERVICE_CATEGORIES[0]);
  const [countyInput, setCountyInput] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [coverageLevel, setCoverageLevel] = useState("COUNTY");
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [locationTree, setLocationTree] = useState<any>(null);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect if not authenticated or if primaryRole belongs to another dashboard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isSuperAdmin && user?.primaryRole && user.primaryRole !== "services") {
        router.push(user.primaryRole === "helper" ? "/helper" : "/");
      }
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, user?.primaryRole, router]);

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await servicesApi.getDashboard();
      setData(res);
      setPriceInput(res.helperPrice?.toString() || "");
      if (res.serviceCategory && SERVICE_CATEGORIES.includes(res.serviceCategory)) {
        setServiceCategory(res.serviceCategory);
      } else if (res.serviceCategory) {
        setServiceCategory(res.serviceCategory);
      }
      setCoverageLevel(res.helperCoverageLevel || "COUNTY");
      setCountyInput(res.helperCounty || "");
      setConstituencies(res.helperConstituencies || []);
      setWards(res.helperWards || []);
      
      const jobsRes = await helperJobsApi.getHelperJobs();
      setJobs(Array.isArray(jobsRes) ? jobsRes : (jobsRes?.content || []));

      const tree = await locationsApi.getTree();
      setLocationTree(tree);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage(null);
    try {
      const parsed = parseFloat(priceInput);
      if (isNaN(parsed) || parsed < 0) throw new Error("Invalid rate");
      await servicesApi.updateProfile({ 
        price: parsed, 
        county: countyInput,
        coverageLevel,
        constituencies,
        wards,
        serviceCategory
      });
      setMessage({ type: "success", text: "Service settings updated successfully!" });
      fetchDashboard();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setMessage(null);
    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
      await servicesApi.withdraw(amount);
      setMessage({ type: "success", text: "Withdrawal processed successfully!" });
      setWithdrawAmount("");
      fetchDashboard();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  if (!isSuperAdmin && user?.primaryRole !== "services" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return (
      <div className="p-8 text-center text-red-600 flex flex-col items-center">
        <p className="text-lg font-bold mb-2">You do not have access to the Services Dashboard.</p>
        <p className="text-sm text-gray-500">Your current role is: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user?.primaryRole || user?.role || 'undefined'}</span></p>
      </div>
    );
  }

  const withdrawals = data?.withdrawals || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
              {serviceCategory || "Service Provider"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Services Dashboard</h1>
          <p className="text-gray-600">Manage your service offerings, rates, service requests, and M-Pesa withdrawals.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><CurrencyDollarIcon className="w-6 h-6 text-emerald-600" /></div>
            <h3 className="text-gray-600 font-medium">Available Balance</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">KES {data?.balance?.toLocaleString() || "0.00"}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><BanknotesIcon className="w-6 h-6 text-green-600" /></div>
            <h3 className="text-gray-600 font-medium">Lifetime Earned</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">KES {data?.totalEarned?.toLocaleString() || "0.00"}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 rounded-lg"><DocumentTextIcon className="w-6 h-6 text-teal-600" /></div>
            <h3 className="text-gray-600 font-medium">Taxes Withheld (KRA)</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">KES {data?.totalTaxesWithheld?.toLocaleString() || "0.00"}</p>
          <p className="text-xs text-gray-500 mt-1">Use this for your KRA tax returns (5% WHT)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actions Column */}
        <div className="space-y-8">
          {/* Set Service Settings */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Profile & Rates</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-gray-900"
                  required
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Level</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-full mb-4">
                  {['COUNTY', 'CONSTITUENCY', 'WARD'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCoverageLevel(level)}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
                        coverageLevel === level ? "bg-white shadow-sm text-emerald-900" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your County {coverageLevel === 'COUNTY' && "(Max 1)"}</label>
                <select
                  value={countyInput}
                  onChange={(e) => {
                    setCountyInput(e.target.value);
                    setConstituencies([]);
                    setWards([]);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  required
                >
                  <option value="">Select County...</option>
                  {locationTree?.counties?.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {coverageLevel === 'CONSTITUENCY' && countyInput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Constituencies (Max 2)</label>
                  <select
                    multiple
                    value={constituencies}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions, option => option.value);
                      if (opts.length <= 2) setConstituencies(opts);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white min-h-[100px]"
                    required
                  >
                    {locationTree?.constituenciesByCounty[countyInput]?.map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold CMD/CTRL to select multiple</p>
                </div>
              )}

              {coverageLevel === 'WARD' && countyInput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Wards (Max 5)</label>
                  <select
                    multiple
                    value={wards}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions, option => option.value);
                      if (opts.length <= 5) setWards(opts);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white min-h-[150px]"
                    required
                  >
                    {locationTree?.constituenciesByCounty[countyInput]?.map((c: string) => (
                      <optgroup key={c} label={c}>
                        {locationTree?.wardsByConstituency[c]?.map((w: string) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold CMD/CTRL to select multiple</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Rate / Callout Fee (KES)</label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 1000"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {profileLoading ? "Saving..." : "Save Service Profile"}
              </button>
            </form>
          </div>

          {/* Withdraw */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Withdraw to M-Pesa</h3>
            <p className="text-sm text-gray-600 mb-4">
              A 10% platform fee, 5% KRA withholding tax, and M-Pesa withdrawal fee will be deducted.
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">KES</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Amount to withdraw"
                  max={data?.balance || 0}
                  required
                />
              </div>
              
              {/* Fee Breakdown Preview */}
              {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Requested Amount:</span>
                    <span>KES {parseFloat(withdrawAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform Fee (10%):</span>
                    <span>- KES {(parseFloat(withdrawAmount) * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Withholding Tax (5%):</span>
                    <span>- KES {(parseFloat(withdrawAmount) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>M-Pesa Fee:</span>
                    <span>- KES 50.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                    <span>You Receive (Net):</span>
                    <span>
                      KES {Math.max(0, parseFloat(withdrawAmount) - (parseFloat(withdrawAmount) * 0.1) - (parseFloat(withdrawAmount) * 0.05) - 50).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={withdrawLoading || !withdrawAmount}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {withdrawLoading ? "Processing..." : "Withdraw to M-Pesa"}
              </button>
            </form>
          </div>
        </div>

        {/* Data Column */}
        <div className="space-y-8">
          {/* Active Jobs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <BriefcaseIcon className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Service Requests & Jobs</h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-80 p-0">
              {(Array.isArray(jobs) ? jobs : []).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No service requests found.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(Array.isArray(jobs) ? jobs : []).map((job: any) => (
                    <li key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900">
                          {job.description || serviceCategory || "Service Request"}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          job.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          job.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                          job.status === "DISPUTED" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-500">
                          Client: {job.client?.firstName} {job.client?.lastName}
                          <br />
                          <span className="text-xs">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold text-gray-900 text-right">
                          KES {job.amount?.toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Withdrawals Column */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Recent Withdrawals</h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-80 p-0">
              {withdrawals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No withdrawals yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {withdrawals.map((w: any) => (
                    <li key={w.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900">KES {w.amount?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{new Date(w.requestedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          w.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          w.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {w.status}
                        </span>
                        {w.mpesaReceipt && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {w.mpesaReceipt}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
