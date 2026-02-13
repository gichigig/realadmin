"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import SponsoredAdsManager from "@/components/SponsoredAdsManager";
import { MegaphoneIcon } from "@heroicons/react/24/outline";

export default function SponsoredAdsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MegaphoneIcon className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsored Ads Manager</h1>
          <p className="text-gray-600">
            Enable sponsored ads, choose placement, and target regions for Flutter app delivery.
          </p>
        </div>
      </div>
      <SponsoredAdsManager />
    </div>
  );
}
