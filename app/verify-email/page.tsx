"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BuildingOfficeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { authApi } from "@/lib/api";

export default function EmailVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-send code if email is provided in URL
  useEffect(() => {
    if (emailParam && !codeSent) {
      handleSendCode();
    }
  }, [emailParam]);

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setError("");
    setSending(true);

    try {
      const response = await authApi.sendVerificationCode(email);
      if (response.success) {
        setCodeSent(true);
        if (response.cooldownSeconds) {
          setCooldown(response.cooldownSeconds);
        }
      } else {
        if (response.cooldownRemaining) {
          setCooldown(response.cooldownRemaining);
          setCodeSent(true); // Code was already sent
        }
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newCode.every((c) => c) && newCode.join("").length === 6) {
      handleVerifyCode(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      handleVerifyCode(pastedData);
    }
  };

  const handleVerifyCode = async (codeValue?: string) => {
    const codeToVerify = codeValue || code.join("");
    if (codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await authApi.verifyEmail(email, codeToVerify);
      if (response.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } else {
        setError(response.message || "Invalid or expired code");
        setCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-gray-600">
            Your email has been successfully verified. Redirecting to login...
          </p>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {codeSent 
              ? `Enter the 6-digit code sent to ${email}`
              : "Enter your email to receive a verification code"
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!codeSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div 
              className="flex justify-center gap-2"
              onPaste={handleCodePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { codeInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerifyCode()}
              disabled={loading || code.some((c) => !c)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Verify Email"
              )}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => handleSendCode()}
                disabled={cooldown > 0 || sending}
                className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive code? Resend"}
              </button>
              
              <p className="text-xs text-gray-500">
                Code expires in 10 minutes
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCode(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change email address
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" prefetch className="text-sm text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
