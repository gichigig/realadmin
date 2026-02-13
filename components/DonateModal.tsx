"use client";

import { useState, useEffect } from "react";
import { mpesaApi, MpesaStatusResponse } from "@/lib/api";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestedAmounts = [50, 100, 200, 500, 1000, 2000];

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const amount = showCustom ? parseInt(customAmount) || 0 : selectedAmount || 0;

  useEffect(() => {
    if (isOpen) {
      setLimitReached(false);
    } else {
      // Reset state when modal closes
      setSelectedAmount(null);
      setCustomAmount("");
      setShowCustom(false);
      setPhone("");
      setIsProcessing(false);
      setProcessingMessage("");
      setError("");
      setSuccess(false);
      setReceiptNumber("");
    }
  }, [isOpen]);

  const handleAmountSelect = (amt: number) => {
    setSelectedAmount(amt);
    setShowCustom(false);
    setError("");
  };

  const handleCustomSelect = () => {
    setShowCustom(true);
    setSelectedAmount(null);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!phone.trim()) {
      setError("Please enter your M-Pesa phone number");
      return;
    }

    if (!mpesaApi.isValidPhoneNumber(phone)) {
      setError("Please enter a valid Safaricom phone number");
      return;
    }

    if (amount < 1) {
      setError("Please select or enter a donation amount");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Initiating payment...");

    const result = await mpesaApi.initiateSTKPush({
      phoneNumber: phone,
      amount: amount,
      accountReference: "DONATE",
      transactionDesc: "Donation to Dwelly",
    });

    if (!result.success) {
      setIsProcessing(false);
      if (result.requiresLogin) {
        setLimitReached(true);
        return;
      }
      setError(result.message || "Failed to initiate payment");
      return;
    }

    setProcessingMessage("Please enter your M-Pesa PIN...");

    // Poll for payment status
    const checkoutRequestId = result.checkoutRequestId!;
    const finalStatus = await mpesaApi.waitForPayment(
      checkoutRequestId,
      (status: MpesaStatusResponse) => {
        // Update UI based on status if needed
        console.log("Status update:", status);
      },
      40, // max attempts
      3000 // 3 seconds interval
    );

    setIsProcessing(false);

    if (finalStatus) {
      if (finalStatus.status === "COMPLETED") {
        setSuccess(true);
        setReceiptNumber(finalStatus.mpesaReceiptNumber);
      } else if (finalStatus.status === "CANCELLED") {
        setError("Payment was cancelled");
      } else {
        setError(finalStatus.resultDesc || "Payment failed. Please try again.");
      }
    } else {
      setError("Payment timeout. Please check your M-Pesa messages for confirmation.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {limitReached ? (
            // Limit Reached State
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364l-1.414 1.414M21 12h-2m0 0h-2m2 0v2m0-2V10m-7 9a7 7 0 110-14 7 7 0 010 14z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
              <p className="text-gray-300 mb-4">
                You&apos;ve used your <span className="text-yellow-400 font-bold">free</span> donation attempts.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Please login or create an account to continue donating. This helps us keep the platform secure.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/login"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Login
                </a>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : success ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Thank You! 💚</h3>
              <p className="text-gray-300 mb-4">
                Your donation of <span className="text-green-400 font-bold">KES {amount}</span> has been received.
              </p>
              {receiptNumber && (
                <p className="text-gray-400 text-sm mb-6">
                  Receipt: <span className="font-mono text-white">{receiptNumber}</span>
                </p>
              )}
              <p className="text-gray-400 text-sm mb-6">
                Your support helps keep Dwelly free for everyone. We truly appreciate it!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : isProcessing ? (
            // Processing State
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                </svg>
              </div>
              <p className="text-3xl font-bold text-green-400 mb-4">KES {amount}</p>
              <p className="text-lg text-white mb-2">{processingMessage}</p>
              <p className="text-gray-400 text-sm mb-6">
                Please check your phone and enter your M-Pesa PIN to complete the donation.
              </p>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: "100%" }} />
              </div>
            </div>
          ) : (
            // Form State
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Donate</h3>
                  <p className="text-gray-400 text-sm">M-Pesa STK Push</p>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Amount (KES)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {suggestedAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleAmountSelect(amt)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        selectedAmount === amt && !showCustom
                          ? "bg-green-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCustomSelect}
                  className={`w-full mt-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    showCustom
                      ? "bg-green-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Custom Amount
                </button>
              </div>

              {/* Custom Amount Input */}
              {showCustom && (
                <div className="mb-4">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Phone Number Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="07XX XXX XXX"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter Safaricom number registered with M-Pesa
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-300 text-sm">
                    You&apos;ll receive an M-Pesa prompt on your phone. Enter your PIN to complete the donation.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={amount < 1}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                  amount > 0
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {amount > 0 ? `Donate KES ${amount}` : "Select Amount to Donate"}
              </button>


            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
