"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SsoAuthorizePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Not logged in, redirect to login then back here
      router.push("/login?redirect=/sso-authorize");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleAuthorize = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ishinadwelly.com/api";
      
      const response = await fetch(`${API_BASE_URL}/auth/sso/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to generate authorization code.");
      }

      const data = await response.json();
      const code = data.code;

      // Redirect to Dwelly app via deep link
      window.location.href = `dwellyauth://auth/realadmin?code=${code}`;
      
    } catch (err: any) {
      console.error("SSO Error:", err);
      setError(err.message || "An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Just close or redirect to home
    const workspace = localStorage.getItem("workspaceMode") || "landlord";
    router.push(workspace === "services" ? "/services" : (workspace === "helper" ? "/helper" : "/"));
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
        <div>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Authorize Dwelly</h2>
          <p className="mt-2 text-sm text-gray-500">
            The Dwelly mobile app is requesting access to your RealAdmin account.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-gray-900">Signed in as:</p>
          <p className="text-sm text-gray-500">{user?.firstName} {user?.lastName} ({user?.email})</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-3 pt-4">
          <button
            onClick={handleAuthorize}
            disabled={isProcessing}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Authorizing..." : "Authorize and Return to App"}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login?redirect=/sso-authorize";
            }}
            disabled={isProcessing}
            className="w-full flex justify-center py-2.5 px-4 text-sm font-medium text-blue-600 bg-transparent hover:text-blue-500 focus:outline-none disabled:opacity-50"
          >
            Use another account
          </button>
        </div>
      </div>
    </div>
  );
}
