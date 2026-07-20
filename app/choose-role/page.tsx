"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BuildingOfficeIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";
import { accountApi, SERVICE_CATEGORIES, servicesApi } from "@/lib/api";

function ChooseRoleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const redirect = searchParams.get("redirect");
  const source = searchParams.get("source");
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(SERVICE_CATEGORIES[0]);

  // If we are definitely not authenticated and not loading, and we don't have an email param from signup
  // we should probably redirect to login. But we'll wait for user action just in case.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !emailParam) {
      router.push(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
    }
  }, [isLoading, isAuthenticated, emailParam, router, redirect]);

  const handleSelectRole = async (role: "landlord" | "helper" | "services", category?: string) => {
    setIsProcessing(true);
    localStorage.setItem("workspaceMode", role);

    try {
      if (isAuthenticated) {
        await accountApi.setPrimaryRole(role);
        if (role === "services" && category) {
          try { await servicesApi.updateProfile({ serviceCategory: category }); } catch {}
        }
        
        // Update user in localStorage manually if possible, or context
        const userJson = localStorage.getItem("user");
        if (userJson) {
          try {
            const userObj = JSON.parse(userJson);
            userObj.primaryRole = role;
            if (category) userObj.serviceCategory = category;
            localStorage.setItem("user", JSON.stringify(userObj));
          } catch {}
        }

        if (user?.emailVerified) {
          if (source === "dwelly") {
            router.push("/return-to-app");
          } else if (redirect) {
            router.push(redirect);
          } else {
            router.push(role === "services" ? "/services" : (role === "helper" ? "/helper" : "/"));
          }
        } else {
          router.push(`/verify-email?email=${encodeURIComponent(user?.email || emailParam || "")}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}${source ? `&source=${encodeURIComponent(source)}` : ""}`);
        }
      } else if (emailParam) {
        // Unauthenticated but just came from signup page (fallback)
        router.push(`/verify-email?email=${encodeURIComponent(emailParam)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}${source ? `&source=${encodeURIComponent(source)}` : ""}`);
      } else {
        router.push(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
      }
    } catch (error) {
      console.error("Failed to save role:", error);
      setIsProcessing(false);
    }
  };

  if (isLoading || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <DwellyOrbitingLoader size={72} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            How do you want to use IshinaDwelly?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Choose your primary role. This determines what dashboard you will see.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Landlord Card */}
          <div
            onClick={() => handleSelectRole("landlord")}
            className="relative group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all duration-200 overflow-hidden flex flex-col justify-between"
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
            className="relative group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 cursor-pointer hover:shadow-xl hover:border-purple-500 transition-all duration-200 overflow-hidden flex flex-col justify-between"
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

          {/* Services Card */}
          <div className="relative group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl hover:border-emerald-500 transition-all duration-200 overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <WrenchScrewdriverIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Services</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Offer specialized home and personal services such as Internet providers, Mama Fua, Plumbing, Gas & Food delivery, Moving, and more.
              </p>
            </div>

            <div className="relative mt-4 pt-4 border-t border-gray-100">
              <label htmlFor="serviceCategorySelect" className="block text-sm font-semibold text-gray-700 mb-2">
                Select your service category:
              </label>
              <div className="flex flex-col gap-3">
                <select
                  id="serviceCategorySelect"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleSelectRole("services", selectedCategory)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Select Services & Continue
                </button>
              </div>
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
