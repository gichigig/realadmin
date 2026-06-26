import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { premiumApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  SparklesIcon,
  VideoCameraIcon,
  MapIcon,
  MagnifyingGlassCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";

export default function PremiumBanner({ children }: { children?: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "FAILED">("IDLE");
  const [message, setMessage] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const isPremium = user?.isPremiumActive || user?.realadminPremiumActive;
  const hasClaimedFreeTrial = user?.realadminFreeMonthClaimed === true;

  useEffect(() => {
    setIsClient(true);
    if (user?.phone) {
      setPhone(user.phone);
    }
    const hidden = sessionStorage.getItem("dwelly_hide_premium_banner");
    if (hidden === "true") {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, [user]);

  if (!isClient) {
    return children ? <div className="mb-8">{children}</div> : null;
  }

  if (isPremium) {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-8 gap-4 sm:gap-0">
        <div>{children}</div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-200 text-amber-700 rounded-full font-semibold cursor-not-allowed whitespace-nowrap sm:ml-4"
        >
          <StarIcon className="w-5 h-5 text-amber-500" /> Pro Active
        </button>
      </div>
    );
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("dwelly_hide_premium_banner", "true");
  };

  const handlePay = async (amount: number) => {
    if (!phone) {
      setMessage("Please enter your M-Pesa phone number");
      return;
    }

    setProcessing(true);
    setStatus("PENDING");
    setMessage("Sending M-Pesa prompt...");

    try {
      const initResponse = await premiumApi.initiateSTKPush(phone, amount);
      if (!initResponse.success) {
        setStatus("FAILED");
        setMessage(initResponse.message || "Failed to initiate payment");
        setProcessing(false);
        return;
      }

      setMessage("Please check your phone for the M-Pesa prompt.");

      const checkoutRequestId = initResponse.checkoutRequestId || initResponse.merchantRequestId;
      if (checkoutRequestId) {
        await premiumApi.waitForPayment(checkoutRequestId, (status) => {
          if (status.status === "COMPLETED") {
            setStatus("SUCCESS");
            setMessage("Payment successful! Welcome to Landlord Pro.");
            // Refresh user context to get new premium flag
            if (refreshUser) {
              refreshUser();
            }
            setTimeout(() => setShowModal(false), 3000);
          } else if (status.status === "FAILED" || status.status === "CANCELLED") {
            setStatus("FAILED");
            setMessage("Payment failed or was cancelled.");
          }
        });
      }
    } catch (err) {
      setStatus("FAILED");
      setMessage("An error occurred during payment.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClaimFreeTrial = async () => {
    setProcessing(true);
    setStatus("PENDING");
    setMessage("Activating your 1 month free trial...");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/premium/claim-free-month`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("SUCCESS");
        setMessage("Free trial activated successfully! Welcome to Landlord Pro.");
        if (refreshUser) {
          refreshUser();
        }
      } else {
        setStatus("FAILED");
        setMessage(data.error || "Failed to claim free trial.");
      }
    } catch (err) {
      setStatus("FAILED");
      setMessage("An error occurred while claiming the free trial.");
    } finally {
      setProcessing(false);
    }
  };

  const modalUI = showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
            <StarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Landlord Pro Subscription</h3>
          <p className="text-gray-500 mt-2">Unlock premium features across all your properties. Choose your plan below.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              disabled={processing}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePay(300)}
              disabled={processing || status === 'SUCCESS'}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg py-3 font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-colors flex flex-col items-center justify-center h-20"
            >
              <span className="text-sm">30 Days</span>
              <span className="text-lg">300 KSH</span>
            </button>
            <button
              onClick={() => handlePay(600)}
              disabled={processing || status === 'SUCCESS'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-colors flex flex-col items-center justify-center h-20 relative overflow-hidden shadow-md border border-blue-400"
            >
              <div className="absolute top-0 right-0 bg-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg text-yellow-900">POPULAR</div>
              <span className="text-sm">60 Days</span>
              <span className="text-lg">600 KSH</span>
            </button>
          </div>
          
          {!hasClaimedFreeTrial && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleClaimFreeTrial}
                disabled={processing || status === 'SUCCESS'}
                className="w-full bg-green-600 text-white rounded-lg py-3 font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-5 h-5" />
                Claim 1 Month Free Trial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isDismissed) {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-8 gap-4 sm:gap-0">
          <div>{children}</div>
          <div className="flex items-center gap-3">
            {!hasClaimedFreeTrial && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 text-green-700 rounded-full font-semibold hover:bg-green-200 transition-colors whitespace-nowrap"
              >
                1 Month Free
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold shadow hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap sm:ml-4"
            >
              <SparklesIcon className="w-5 h-5 text-amber-300" /> Upgrade
            </button>
          </div>
        </div>
        {modalUI}
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg shadow-lg mb-8 overflow-hidden relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 z-20 text-white/70 hover:text-white transition-colors p-1"
          aria-label="Dismiss"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

        <div className="px-6 py-6 sm:px-8 sm:flex sm:items-center sm:justify-between relative z-10 pr-12">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <StarIcon className="w-7 h-7 text-amber-200" /> Upgrade to Landlord Pro
            </h2>
            <p className="mt-2 text-amber-50 max-w-2xl text-sm sm:text-base">
              Unlock priority support, advanced analytics, ad-free experience, and a professional badge on all your listings for just <strong>300 KSH / 30 days</strong>.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0 flex gap-3">
            {!hasClaimedFreeTrial && (
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-green-500 shadow-sm transition-colors w-full sm:w-auto"
              >
                1 Month Free
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 border border-transparent text-base font-semibold rounded-md text-orange-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-white shadow-sm transition-colors w-full sm:w-auto"
            >
              Go Pro Now
            </button>
          </div>
        </div>
      </div>

      {children && <div className="mb-8">{children}</div>}

      {modalUI}
    </>
  );
}
