"use client";

import { useCallback, useEffect, useMemo, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";
const DEFAULT_RETURN_URL = "dwelly://payments/mpesa";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

type PaymentStatus = "IDLE" | "PENDING" | "SUCCESS" | "FAILED";

type MpesaInitResponse = {
  success?: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  customerMessage?: string;
  message?: string;
};

const normalizeReturnUrl = (raw: string | null) => {
  if (!raw || !raw.trim()) return DEFAULT_RETURN_URL;
  return raw.trim();
};

/**
 * Normalise any common Kenyan phone format to 254XXXXXXXXX
 * e.g. 0712345678  -> 254712345678
 *      +254712345678 -> 254712345678
 *      254712345678 -> 254712345678 (no-op)
 */
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, ""); // strip non-digits
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  return digits; // return as-is and let backend validate
};

const parseAmount = (value: string | null) => {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
};

function MpesaPaymentContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type")?.toUpperCase() || "DONATION";
  const targetId = searchParams.get("targetId") || searchParams.get("helperId") || "";
  const sponsorshipType = searchParams.get("sponsorshipType") || "LOCAL";
  const token = searchParams.get("token") || "";
  
  const initialAmount = parseAmount(searchParams.get("amount"));
  const initialPhone = searchParams.get("phone") || "";
  const returnUrl = normalizeReturnUrl(searchParams.get("returnUrl"));

  const [amount, setAmount] = useState(initialAmount || 0);
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<PaymentStatus>("IDLE");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uuid] = useState(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
  });

  const paymentConfig = useMemo(() => {
    switch (type) {
      case "HELPER":
        return {
          title: "Hire Helper & Pay Booking Fee",
          description: "Secure payment to confirm helper booking and start communication.",
          endpoint: `${API_BASE_URL}/helper-jobs/hire/${targetId}`,
          pollEndpoint: (checkoutId: string) => `${API_BASE_URL}/mpesa/status/${checkoutId}`,
          getPayload: (phone: string, amount: number) => ({ phoneNumber: phone, amount }),
          checkSuccess: (data: any) => (data.status || "").toUpperCase() === "COMPLETED",
        };
      case "PREMIUM":
        return {
          title: "Upgrade to Dwelly Premium",
          description: "Enjoy exclusive premium features and priority support.",
          endpoint: `${API_BASE_URL}/premium/stk-push`,
          pollEndpoint: (checkoutId: string) => `${API_BASE_URL}/premium/status/${checkoutId}`,
          getPayload: (phone: string, amount: number) => ({ phoneNumber: phone, amount }),
          checkSuccess: (data: any) => (data.status || "").toUpperCase() === "COMPLETED",
        };
      case "RENTAL_VIDEO":
        return {
          title: "Unlock Video Listing",
          description: "Stand out by adding a high-quality video tour to your rental.",
          endpoint: `${API_BASE_URL}/rentals/${targetId}/pay/video`,
          pollEndpoint: (checkoutId: string, rentalId: string) => `${API_BASE_URL}/rentals/${rentalId}/pay/status/${checkoutId}`,
          getPayload: (phone: string) => ({ phone }),
          checkSuccess: (data: any) => (data.status || "").toUpperCase() === "COMPLETED",
        };
      case "RENTAL_SPONSOR":
        return {
          title: "Sponsor Listing",
          description: "Boost your rental's visibility to reach more potential tenants.",
          endpoint: `${API_BASE_URL}/rentals/${targetId}/pay/sponsor`,
          pollEndpoint: (checkoutId: string, rentalId: string) => `${API_BASE_URL}/rentals/${rentalId}/pay/status/${checkoutId}`,
          getPayload: (phone: string) => ({ phone, sponsorshipType }),
          checkSuccess: (data: any) => (data.status || "").toUpperCase() === "COMPLETED",
        };
      case "DONATION":
      default:
        return {
          title: "Complete your M-Pesa donation",
          description: "We will send an STK prompt to your phone so you can confirm the payment.",
          endpoint: `${API_BASE_URL}/mpesa/stk-push`,
          pollEndpoint: (checkoutId: string) => `${API_BASE_URL}/mpesa/status/${checkoutId}`,
          getPayload: (phone: string, amount: number) => ({
            phoneNumber: phone,
            amount,
            accountReference: "DONATE",
            transactionDesc: "Donation to Dwelly",
          }),
          checkSuccess: (data: any) => (data.status || "").toUpperCase() === "COMPLETED",
        };
    }
  }, [type, targetId, sponsorshipType]);

  const returnToAppUrl = useMemo(() => {
    try {
      const target = new URL(returnUrl);
      if (status === "SUCCESS") {
        target.searchParams.set("status", "success");
      } else if (status === "FAILED") {
        target.searchParams.set("status", "failed");
      }
      if (checkoutRequestId) {
        target.searchParams.set("checkoutRequestId", checkoutRequestId);
      }
      if (targetId) {
        target.searchParams.set("targetId", targetId);
      }
      return target.toString();
    } catch {
      return returnUrl;
    }
  }, [returnUrl, status, checkoutRequestId, targetId]);

  const resetPayment = () => {
    setStatus("IDLE");
    setCheckoutRequestId(null);
    setMessage(null);
    setReceiptNumber(null);
    setCopied(false);
  };

  const startPayment = useCallback(async () => {
    setMessage(null);

    if (!phone.trim()) {
      setMessage("Please enter your M-Pesa phone number.");
      return;
    }

    if (type === "DONATION" || type === "PREMIUM") {
      if (!amount || amount < 1) {
        setMessage("Please enter a valid amount.");
        return;
      }
    }

    if (type !== "DONATION" && type !== "PREMIUM" && !targetId) {
      setMessage("Invalid target ID for this payment type.");
      return;
    }

    setProcessing(true);
    setStatus("PENDING");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const normalizedPhone = normalizePhone(phone.trim());
      const normalizedAmount = Math.floor(amount);
      const payload = paymentConfig.getPayload(normalizedPhone, normalizedAmount);
      const payloadWithUuid = { ...payload, uuid };

      const response = await fetch(paymentConfig.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadWithUuid),
      });

      // Handle marketplace response which might not match the generic MpesaInitResponse exactly, 
      // but usually has a checkoutRequestId if successful STK push initiated
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || data.errorMessage || "Failed to initiate payment.");
      }

      const requestId = data.checkoutRequestId || data.CheckoutRequestID || data.merchantRequestId;
      
      if (!requestId) {
        throw new Error("Invalid response from payment gateway. Missing checkout ID.");
      }

      setCheckoutRequestId(requestId);
      setMessage(
        data.customerMessage || data.CustomerMessage || data.message ||
          "Please check your phone for the M-Pesa prompt."
      );
    } catch (error) {
      setStatus("FAILED");
      setMessage(error instanceof Error ? error.message : "Failed to initiate payment.");
    } finally {
      setProcessing(false);
    }
  }, [amount, phone, type, targetId, token, paymentConfig]);

  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    if (!checkoutRequestId || status !== "PENDING") return;

    // Reset counter whenever a new poll session begins
    pollAttemptsRef.current = 0;

    const interval = setInterval(async () => {
      pollAttemptsRef.current += 1;

      // Timeout after MAX_POLL_ATTEMPTS
      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(interval);
        setStatus("FAILED");
        setMessage("Payment timed out. Please try again.");
        return;
      }

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(paymentConfig.pollEndpoint(checkoutRequestId, targetId), {
          method: "GET",
          headers,
        });

        if (!response.ok) return; // silent retry on network hiccup

        const data = await response.json();

        if (paymentConfig.checkSuccess(data)) {
          clearInterval(interval);
          const receipt = data.mpesaReceiptNumber || data.receiptNumber || data.MpesaReceiptNumber || null;
          setReceiptNumber(receipt);
          setStatus("SUCCESS");
          setMessage(data.resultDesc || data.message || "Payment completed successfully.");
        } else {
          const statusValue = (data.status || data.paymentStatus || "").toUpperCase();
          if (statusValue === "FAILED" || statusValue === "CANCELLED") {
            clearInterval(interval);
            setStatus("FAILED");
            setMessage(data.resultDesc || data.error || "Payment failed or was cancelled.");
          }
          // Otherwise still PENDING — keep polling silently
        }
      } catch {
        // Network error — keep polling silently
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  // Only re-run when a new checkout session starts or token changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutRequestId, token]);


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      {/* ── SUCCESS POPUP MODAL ── */}
      {status === "SUCCESS" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
            style={{ animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(60px) scale(0.95); }
                to   { opacity: 1; transform: translateY(0)  scale(1); }
              }
              @keyframes popIn {
                0%   { transform: scale(0); opacity: 0; }
                60%  { transform: scale(1.15); opacity: 1; }
                100% { transform: scale(1); }
              }
            `}</style>

            {/* Green header */}
            <div className="bg-emerald-500 px-6 pt-10 pb-8 text-center relative">
              {/* X button */}
              <a
                href={returnToAppUrl}
                aria-label="Close and return to app"
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>

              {/* Party emoji */}
              <div
                className="text-6xl mb-3 leading-none select-none"
                style={{ animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}
              >
                🎉
              </div>

              {/* Animated checkmark */}
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white"
                style={{ animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.25s both" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white">Payment Successful! 🎉</h2>
              <p className="mt-1 text-emerald-100 text-sm">Your transaction was completed</p>

              {/* Amount badge */}
              <div className="mt-4 inline-block rounded-2xl bg-white/20 px-6 py-2">
                <span className="text-3xl font-black text-white">KES {amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              {/* Receipt code */}
              {receiptNumber ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">M-Pesa Confirmation Code</p>
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50 px-4 py-3">
                    <span className="flex-1 font-mono text-xl font-bold tracking-widest text-emerald-800">{receiptNumber}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(receiptNumber).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all"
                    >
                      {copied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">Save this code as proof of payment.</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">{message}</p>
              )}

              {/* Return button */}
              <a
                href={returnToAppUrl}
                className="block w-full rounded-2xl bg-emerald-500 py-4 text-center text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all"
              >
                Return to App
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CHECKOUT CARD ── */}
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-500">Dwelly Checkout</p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">
            {paymentConfig.title}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {paymentConfig.description}
          </p>
        </div>

        <div className="space-y-4">
          {(type === "DONATION" || type === "PREMIUM") && (
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount (KES)
              </label>
              <input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                disabled={type === "PREMIUM" && amount > 0} 
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-gray-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              M-Pesa phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="07XX XXX XXX"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {message && status !== "SUCCESS" && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                status === "FAILED"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </div>
          )}

          {status === "FAILED" ? (
            <div className="flex flex-col gap-3">
              <a
                href={returnToAppUrl}
                className="w-full rounded-lg bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Return to App
              </a>
              <button
                type="button"
                onClick={resetPayment}
                className="w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startPayment}
              disabled={processing || status === "PENDING"}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {processing ? "Starting payment..." : status === "PENDING" ? "Waiting for confirmation..." : "Send M-Pesa prompt"}
            </button>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Having trouble? Make sure your phone is connected to the internet and
          that M-Pesa is active.
        </p>
      </div>
    </div>
  );
}

export default function MpesaPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <MpesaPaymentContent />
    </Suspense>
  );
}
