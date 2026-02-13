"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { advertisersApi, adsApi, Advertiser, Advertisement, PaginatedResponse } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  UNVERIFIED: { bg: "bg-gray-100", text: "text-gray-700", icon: ClockIcon },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: ClockIcon },
  VERIFIED: { bg: "bg-green-100", text: "text-green-700", icon: CheckBadgeIcon },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", icon: XCircleIcon },
  SUSPENDED: { bg: "bg-orange-100", text: "text-orange-700", icon: ExclamationTriangleIcon },
};

export default function AdvertiserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  const id = parseInt(params.id as string);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchData();
    }
  }, [isAuthenticated, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advertiserData, adsData] = await Promise.all([
        advertisersApi.get(id),
        adsApi.list({ advertiserId: id, size: 10 }),
      ]);
      setAdvertiser(advertiserData);
      setAds(adsData.content);
    } catch (err: any) {
      setError(err.message || "Failed to load advertiser");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (decision: "VERIFIED" | "REJECTED") => {
    if (!advertiser) return;
    setVerifying(true);
    try {
      await advertisersApi.verify(advertiser.id, decision, verificationNotes || undefined);
      fetchData();
      setVerificationNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to verify advertiser");
    } finally {
      setVerifying(false);
    }
  };

  const handleBlock = async (block: boolean) => {
    if (!advertiser) return;
    const reason = block ? prompt("Enter reason for blocking:") : undefined;
    if (block && !reason) return;

    try {
      if (block) {
        await advertisersApi.block(advertiser.id, reason!);
      } else {
        await advertisersApi.unblock(advertiser.id);
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update advertiser");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Advertiser not found</p>
        <Link href="/advertisers" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to advertisers
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[advertiser.verificationStatus] || STATUS_STYLES.UNVERIFIED;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
          <div className="flex items-center gap-6">
            {advertiser.logoUrl ? (
              <img
                src={advertiser.logoUrl}
                alt={advertiser.companyName}
                className="h-24 w-24 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="text-white">
              <h1 className="text-2xl font-bold">{advertiser.companyName}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  <statusStyle.icon className="h-4 w-4" />
                  {advertiser.verificationStatus}
                </span>
                {advertiser.blocked && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    <NoSymbolIcon className="h-4 w-4" />
                    Blocked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {isSuperAdmin && (
          <div className="px-6 py-4 bg-gray-50 flex items-center gap-3 border-b">
            {advertiser.verificationStatus === "PENDING" && (
              <>
                <button
                  onClick={() => handleVerify("VERIFIED")}
                  disabled={verifying}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleVerify("REJECTED")}
                  disabled={verifying}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            <button
              onClick={() => handleBlock(!advertiser.blocked)}
              className={`px-4 py-2 rounded-lg ${
                advertiser.blocked
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {advertiser.blocked ? "Unblock" : "Block"}
            </button>
            <Link
              href={`/advertisers/${advertiser.id}/edit`}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Edit
            </Link>
          </div>
        )}

        {/* Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Contact Information</h3>
            {advertiser.contactEmail && (
              <div className="flex items-center gap-3 text-gray-600">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <a href={`mailto:${advertiser.contactEmail}`} className="hover:text-blue-600">
                  {advertiser.contactEmail}
                </a>
              </div>
            )}
            {advertiser.contactPhone && (
              <div className="flex items-center gap-3 text-gray-600">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <a href={`tel:${advertiser.contactPhone}`} className="hover:text-blue-600">
                  {advertiser.contactPhone}
                </a>
              </div>
            )}
            {advertiser.website && (
              <div className="flex items-center gap-3 text-gray-600">
                <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                <a href={advertiser.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  {advertiser.website}
                </a>
              </div>
            )}
            {advertiser.address && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <span>{advertiser.address}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Billing Information</h3>
            <div className="flex items-center gap-3 text-gray-600">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              <span>Balance: <strong>KES {advertiser.accountBalance?.toLocaleString() || 0}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              <span>Total Spent: <strong>KES {advertiser.totalSpent?.toLocaleString() || 0}</strong></span>
            </div>
            {advertiser.billingEmail && (
              <div className="flex items-center gap-3 text-gray-600">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <span>Billing: {advertiser.billingEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-600">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <span>Payment: {advertiser.preferredPaymentMethod || "Not set"}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {advertiser.companyDescription && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-600">{advertiser.companyDescription}</p>
          </div>
        )}
      </div>

      {/* Verification Documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocumentCard
            title="Business Certificate"
            url={advertiser.businessCertificateUrl}
          />
          <DocumentCard
            title="Tax Registration"
            url={advertiser.taxRegistrationUrl}
          />
          <DocumentCard
            title="Additional Document"
            url={advertiser.additionalDocumentUrl}
          />
        </div>

        {/* Verification Notes Input (for pending) */}
        {isSuperAdmin && advertiser.verificationStatus === "PENDING" && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-2">Verification Notes</h3>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this verification decision..."
              rows={3}
            />
          </div>
        )}

        {/* Existing verification notes */}
        {advertiser.verificationNotes && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700">Previous Notes</h4>
            <p className="text-gray-600 mt-1">{advertiser.verificationNotes}</p>
          </div>
        )}

        {/* Blocked reason */}
        {advertiser.blocked && advertiser.blockedReason && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h4 className="text-sm font-medium text-red-700">Blocked Reason</h4>
            <p className="text-red-600 mt-1">{advertiser.blockedReason}</p>
          </div>
        )}
      </div>

      {/* Recent Ads */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Advertisements</h2>
          <Link href={`/ads?advertiser=${advertiser.id}`} className="text-blue-600 hover:underline text-sm">
            View All →
          </Link>
        </div>
        
        {ads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No advertisements yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.slice(0, 6).map((ad) => (
              <Link
                key={ad.id}
                href={`/ads/${ad.id}`}
                className="block rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
              >
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-32 object-cover" />
                ) : ad.thumbnailUrl ? (
                  <img src={ad.thumbnailUrl} alt={ad.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No preview</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-gray-900 truncate">{ad.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ad.approvalStatus === "APPROVED" ? "bg-green-100 text-green-700" :
                      ad.approvalStatus === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {ad.approvalStatus}
                    </span>
                    <span className="text-xs text-gray-500">{ad.placement}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ title, url }: { title: string; url?: string }) {
  if (!url) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
        <DocumentTextIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xs text-gray-400 mt-1">Not uploaded</p>
      </div>
    );
  }

  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={title} className="w-full h-32 object-cover" />
        </a>
      ) : (
        <div className="h-32 bg-gray-50 flex items-center justify-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400" />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View Document
        </a>
      </div>
    </div>
  );
}
