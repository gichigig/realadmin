"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  rentalsApi,
  rentalPaymentApi,
  Rental,
  PageResponse,
  RentalStatus,
  SponsorshipType,
  RentalPaymentInitResponse,
  RentalPaymentStatus,
} from "@/lib/api";
import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  SparklesIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const isRentalSponsored = (rental: Rental) => {
  return rental.isSponsored ||
    (rental.sponsorshipType && rental.sponsorshipType !== "NONE" &&
      rental.sponsorshipExpiresAt && new Date(rental.sponsorshipExpiresAt) > new Date());
};

// ─── Boost Modal ─────────────────────────────────────────────────────────────

type BoostStep = "select" | "phone" | "waiting" | "success" | "error";

interface BoostOption {
  id: "video" | SponsorshipType;
  label: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const BOOST_OPTIONS: BoostOption[] = [
  {
    id: "video",
    label: "Video Listing",
    price: 300,
    description: "Add a video walkthrough to attract more tenants",
    icon: <VideoCameraIcon className="w-6 h-6" />,
    color: "text-blue-600",
    gradient: "from-blue-500 to-blue-700",
  },
  {
    id: "LOCAL",
    label: "Sponsor — Nearby Users",
    price: 350,
    description: "Shown to users within live GPS range of your listing",
    icon: <SparklesIcon className="w-6 h-6" />,
    color: "text-amber-600",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "SEARCH",
    label: "Sponsor — Area Searches",
    price: 350,
    description: "Shown to users who search your listing's area",
    icon: <SparklesIcon className="w-6 h-6" />,
    color: "text-purple-600",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "BOTH",
    label: "Sponsor — Both",
    price: 600,
    description: "Maximum reach: nearby users + area searchers",
    icon: <SparklesIcon className="w-6 h-6" />,
    color: "text-emerald-600",
    gradient: "from-emerald-400 to-teal-600",
  },
];

function BoostModal({
  rental,
  onClose,
  onSuccess,
}: {
  rental: Rental;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<BoostStep>("select");
  const [selected, setSelected] = useState<BoostOption | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [checkoutId, setCheckoutId] = useState("");
  const [pollResult, setPollResult] = useState<RentalPaymentStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [polling, setPolling] = useState(false);

  // Poll payment status every 3 seconds
  useEffect(() => {
    if (step !== "waiting" || !checkoutId || polling) return;
    let attempts = 0;
    const MAX = 20;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const status = await rentalPaymentApi.pollStatus(rental.id!, checkoutId);
        if (status.status === "COMPLETED") {
          clearInterval(interval);
          setPollResult(status);
          setStep("success");
          onSuccess();
        } else if (status.status === "FAILED" || status.status === "CANCELLED") {
          clearInterval(interval);
          setErrorMsg(
            status.status === "CANCELLED"
              ? "Payment was cancelled."
              : status.resultDesc || "Payment failed. Please try again."
          );
          setStep("error");
        } else if (attempts >= MAX) {
          clearInterval(interval);
          setErrorMsg("Payment timed out. Check your M-Pesa messages and try again.");
          setStep("error");
        }
      } catch {
        // silent — keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, checkoutId, rental.id, polling, onSuccess]);

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, "");
    if (!cleaned) return "Phone number is required";
    if (!/^(0|254|\+254)\d{9}$/.test(cleaned)) return "Enter a valid Kenyan phone (e.g. 0712345678)";
    return "";
  };

  const handlePay = async () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError("");

    if (!selected || !rental.id) return;

    try {
      let resp: RentalPaymentInitResponse;
      if (selected.id === "video") {
        resp = await rentalPaymentApi.payForVideo(rental.id, phone);
      } else {
        resp = await rentalPaymentApi.payForSponsorship(rental.id, phone, selected.id as SponsorshipType);
      }

      if (resp.success && resp.checkoutRequestId) {
        setCheckoutId(resp.checkoutRequestId);
        setStep("waiting");
      } else {
        setErrorMsg(resp.error || "Failed to initiate payment");
        setStep("error");
      }
    } catch (e) {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Boost Listing</h2>
              <p className="text-blue-100 text-sm mt-0.5 line-clamp-1">{rental.title}</p>
            </div>
            <button
              id="boost-modal-close"
              onClick={onClose}
              className="text-blue-200 hover:text-white transition-colors ml-4"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* ── Step 1: Select option ── */}
          {step === "select" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Choose how you want to boost this listing. All payments are via M-Pesa.
              </p>
              {BOOST_OPTIONS.map((opt) => {
                const isSponsorshipActive = isRentalSponsored(rental);
                const activeType = isSponsorshipActive ? rental.sponsorshipType : "NONE";
                
                let active = false;
                if (opt.id === "video") active = !!rental.hasVideo;
                else if (opt.id === "LOCAL") active = activeType === "LOCAL" || activeType === "BOTH";
                else if (opt.id === "SEARCH") active = activeType === "SEARCH" || activeType === "BOTH";
                else if (opt.id === "BOTH") active = activeType === "BOTH";

                return (
                <button
                  key={opt.id}
                  id={`boost-option-${opt.id}`}
                  disabled={active}
                  onClick={() => setSelected(opt)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    active
                      ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      : selected?.id === opt.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opt.gradient} text-white flex items-center justify-center ${active ? "grayscale opacity-50" : ""}`}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                      </div>
                    </div>
                    <span className={`font-bold whitespace-nowrap ml-2 ${active ? "text-gray-400" : "text-gray-900"}`}>
                      {active ? "Active" : `KSH ${opt.price.toLocaleString()}`}
                    </span>
                  </div>
                </button>
              )})}
              <button
                id="boost-continue-btn"
                disabled={!selected}
                onClick={() => setStep("phone")}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2: Phone input ── */}
          {step === "phone" && selected && (
            <div>
              <div className={`p-4 rounded-xl bg-gradient-to-br ${selected.gradient} text-white mb-6`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    {selected.icon}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{selected.label}</p>
                    <p className="text-white/80 text-sm">{selected.description}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold mt-3">KSH {selected.price.toLocaleString()}</p>
                {selected.id !== "video" && (
                  <p className="text-white/70 text-xs mt-1">Valid for 30 days</p>
                )}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                M-Pesa Phone Number
              </label>
              <input
                id="boost-phone-input"
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError("");
                }}
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  phoneError ? "border-red-400" : "border-gray-300"
                }`}
              />
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}

              <p className="text-gray-400 text-xs mt-2">
                An STK push will be sent to this number. Enter your M-Pesa PIN to complete payment.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  id="boost-back-btn"
                  onClick={() => setStep("select")}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  id="boost-pay-btn"
                  onClick={handlePay}
                  className={`flex-1 py-3 bg-gradient-to-r ${selected.gradient} text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md`}
                >
                  Pay KSH {selected.price.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Waiting for payment ── */}
          {step === "waiting" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Waiting for Payment</h3>
              <p className="text-gray-500 text-sm mt-2">
                An M-Pesa prompt has been sent to <strong>{phone}</strong>.
                <br />
                Enter your PIN to complete the payment.
              </p>
              <div className="flex justify-center gap-1.5 mt-6">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
              </div>
              <p className="text-gray-400 text-xs mt-4">This page will update automatically</p>
            </div>
          )}

          {/* ── Step 4: Success ── */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-9 h-9 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Successful! 🎉</h3>
              <p className="text-gray-500 text-sm mt-2">
                {selected?.id === "video"
                  ? "Video listing has been activated for your property."
                  : "Your listing is now sponsored and will reach more tenants."}
              </p>
              {pollResult?.mpesaReceipt && (
                <p className="text-xs text-gray-400 mt-2">Receipt: {pollResult.mpesaReceipt}</p>
              )}
              <button
                id="boost-done-btn"
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* ── Step 5: Error ── */}
          {step === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircleIcon className="w-9 h-9 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
              <p className="text-gray-500 text-sm mt-2">{errorMsg}</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("phone")}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button onClick={onClose} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sponsorship Badge ────────────────────────────────────────────────────────

function SponsorBadge({ rental }: { rental: Rental }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {rental.hasVideo && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          <VideoCameraIcon className="w-3 h-3" /> Video
        </span>
      )}
      {isRentalSponsored(rental) && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
          <SparklesIcon className="w-3 h-3" />
          {rental.sponsorshipType === "LOCAL"
            ? "Sponsored·Local"
            : rental.sponsorshipType === "SEARCH"
            ? "Sponsored·Search"
            : "Sponsored·Both"}
        </span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RentalsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [rentals, setRentals] = useState<PageResponse<Rental> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [boostRental, setBoostRental] = useState<Rental | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const fetchRentals = useCallback(async () => {
    if (authLoading || !user?.id) return;
    setLoading(true);
    try {
      const data = isSuperAdmin
        ? await rentalsApi.getAll(page, 10)
        : await rentalsApi.getByUser(user.id, page, 10);
      setRentals(data);
    } catch (error) {
      console.error("Failed to fetch rentals:", error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, page, user?.id, isSuperAdmin]);

  useEffect(() => { fetchRentals(); }, [fetchRentals]);

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
    <>
      {boostRental && (
        <BoostModal
          rental={boostRental}
          onClose={() => setBoostRental(null)}
          onSuccess={() => {
            setBoostRental(null);
            fetchRentals();
          }}
        />
      )}

      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
            <p className="text-gray-600">
              {isSuperAdmin ? "Manage all rental properties" : "Manage your rental properties"}
            </p>
            {isSuperAdmin && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                Super Admin — Viewing All Properties
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

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <DwellyOrbitingLoader size={32} />
              <p className="mt-4 text-gray-600">Loading rentals...</p>
            </div>
          ) : rentals && rentals.content.length > 0 ? (
            <>
              <table className="min-w-full block md:table">
                <thead className="hidden md:table-header-group bg-gray-50 border-b">
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
                      Boosts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y divide-gray-200">
                  {rentals.content.map((rental) => (
                    <tr key={rental.id} className="block md:table-row hover:bg-gray-50 group border-b md:border-none p-4 md:p-0">
                      <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4">
                        <div className="md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Property</div>
                        <div>
                          <p className="font-medium text-gray-900">{rental.title}</p>
                          <p className="text-sm text-gray-500">
                            {rental.bedrooms} bed · {rental.bathrooms} bath · {rental.squareFeet} sqft
                          </p>
                        </div>
                      </td>
                      <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4">
                        <div className="md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Location</div>
                        <p className="text-gray-900">{rental.ward}, {rental.constituency}</p>
                        <p className="text-sm text-gray-500">{rental.county}</p>
                      </td>
                      <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4">
                        <div className="md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Price</div>
                        <p className="font-medium text-gray-900">
                          KSH {Number(rental.price).toLocaleString()}/mo
                        </p>
                      </td>
                      <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4">
                        <div className="md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Boosts</div>
                        <SponsorBadge rental={rental} />
                        {!rental.hasVideo && !rental.isSponsored && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4">
                        <div className="md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Status</div>
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
                      <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4">
                        <div className="md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Actions</div>
                        <div className="flex items-center flex-wrap gap-2">
                          {/* Boost button - always show, disabled options handled in modal */}
                          <button
                            id={`boost-btn-${rental.id}`}
                            onClick={() => setBoostRental(rental)}
                            title="Boost Listing"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm mb-1"
                          >
                            <SparklesIcon className="w-3.5 h-3.5" /> Boost
                          </button>
                          <Link
                            href={`/rentals/${rental.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mb-1"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/rentals/${rental.id}/edit`}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors mb-1"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(rental.id!)}
                            disabled={deleteId === rental.id}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 mb-1"
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
    </>
  );
}
