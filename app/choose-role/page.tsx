"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BuildingOfficeIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import { accountApi } from "@/lib/api";

function ChooseRoleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // If we are definitely not authenticated and not loading, and we don't have an email param from signup
  // we should probably redirect to login. But we'll wait for user action just in case.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !emailParam) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, emailParam, router]);

  const handleSelectRole = async (role: "landlord" | "helper") => {
    setIsProcessing(true);
    localStorage.setItem("workspaceMode", role);

    try {
      if (isAuthenticated) {
        await accountApi.setPrimaryRole(role);
        
        // Update user in localStorage manually if possible, or context
        const userJson = localStorage.getItem("user");
        if (userJson) {
          try {
            const userObj = JSON.parse(userJson);
            userObj.primaryRole = role;
            localStorage.setItem("user", JSON.stringify(userObj));
          } catch {}
        }

        if (user?.emailVerified) {
          router.push(role === "helper" ? "/helper" : "/");
        } else {
          router.push(`/verify-email?email=${encodeURIComponent(user?.email || emailParam || "")}`);
        }
      } else if (emailParam) {
        // Unauthenticated but just came from signup page (fallback)
        router.push(`/verify-email?email=${encodeURIComponent(emailParam)}`);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to save role:", error);
      setIsProcessing(false);
    }
  };

  if (isLoading || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            How do you want to use IshinaDwelly?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Choose your primary role. This determines what dashboard you will see.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Landlord Card */}
          <div
            onClick={() => handleSelectRole("landlord")}
            className="relative group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Landlord</h3>
              <p className="text-gray-500 leading-relaxed">
                List properties for rent, manage tenants, hire helpers for maintenance, and track your rental income all in one place.
              </p>
            </div>
          </div>

          {/* Helper Card */}
          <div
            onClick={() => handleSelectRole("helper")}
            className="relative group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 cursor-pointer hover:shadow-xl hover:purple-500 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <WrenchScrewdriverIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Helper</h3>
              <p className="text-gray-500 leading-relaxed">
                Offer your services to landlords. Get hired for maintenance jobs, manage your availability, and earn money securely through escrow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChooseRolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ChooseRoleForm />
    </Suspense>
  );
}
