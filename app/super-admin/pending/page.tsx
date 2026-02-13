"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { superAdminApi, AdminUser, RentalWithOwnerInfo } from "@/lib/api";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  CheckBadgeIcon,
  PhotoIcon,
  IdentificationIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";

export default function SuperAdminPendingPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [pendingRentals, setPendingRentals] = useState<RentalWithOwnerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "rentals">("users");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRental, setSelectedRental] = useState<RentalWithOwnerInfo | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPending();
    }
  }, [isSuperAdmin]);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const [users, rentals] = await Promise.all([
        superAdminApi.getPendingVerifications(),
        superAdminApi.getPendingRentals(),
      ]);
      setPendingUsers(users);
      setPendingRentals(rentals);
    } catch (err) {
      setError("Failed to load pending items");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (decision: "VERIFIED" | "REJECTED") => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      await superAdminApi.verifyAdmin(selectedUser.id, decision, notes);
      setSelectedUser(null);
      setNotes("");
      fetchPending();
    } catch (err) {
      setError("Failed to process verification");
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveRental = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedRental || !selectedRental.id) return;
    setProcessing(true);
    try {
      await superAdminApi.approveRental(selectedRental.id, decision, notes);
      setSelectedRental(null);
      setNotes("");
      fetchPending();
    } catch (err) {
      setError("Failed to process approval");
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600">Review and approve user verifications and rental listings</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-1 font-medium text-sm ${
            activeTab === "users"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          User Verifications ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("rentals")}
          className={`pb-3 px-1 font-medium text-sm ${
            activeTab === "rentals"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Rental Approvals ({pendingRentals.length})
        </button>
      </div>

      {/* User Verifications */}
      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow">
          {pendingUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No pending user verifications
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {user.faceImageUrl ? (
                        <img src={user.faceImageUrl} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-600 font-medium text-lg">
                          {user.firstName?.[0] || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                          {user.userType || "INDIVIDUAL"}
                        </span>
                        {user.nationalIdImageUrl && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                            <PhotoIcon className="h-3 w-3" /> ID Photo
                          </span>
                        )}
                        {user.faceImageUrl && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded flex items-center gap-1">
                            <FaceSmileIcon className="h-3 w-3" /> Face Scan
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Submitted {user.verificationSubmittedAt ? new Date(user.verificationSubmittedAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rental Approvals */}
      {activeTab === "rentals" && (
        <div className="bg-white rounded-lg shadow">
          {pendingRentals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No pending rental approvals
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingRentals.map((rental) => (
                <div key={rental.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {rental.imageUrls?.[0] ? (
                      <img
                        src={rental.imageUrls[0]}
                        alt={rental.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">No img</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{rental.title}</p>
                      <p className="text-sm text-gray-500">
                        {rental.ward}, {rental.county} • ${rental.price?.toLocaleString()}/mo
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">By: {rental.createdByName}</span>
                        {rental.ownerIsVerified && (
                          <CheckBadgeIcon className={`h-4 w-4 ${rental.ownerUserType === "AGENT" ? "text-amber-500" : "text-blue-500"}`} />
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRental(rental)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Verification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Verify User
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* User Info Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedUser.faceImageUrl ? (
                    <img src={selectedUser.faceImageUrl} alt={selectedUser.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-medium text-gray-600">{selectedUser.firstName?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ${
                    selectedUser.userType === "AGENT" ? "bg-amber-100 text-amber-700" :
                    selectedUser.userType === "COMPANY" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {selectedUser.userType || "INDIVIDUAL"}
                  </span>
                </div>
              </div>

              {/* ID Card Image */}
              {selectedUser.nationalIdImageUrl && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <IdentificationIcon className="h-5 w-5 text-blue-500" />
                    ID Card Photo
                  </h4>
                  <div 
                    className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                    onClick={() => setExpandedImage(selectedUser.nationalIdImageUrl)}
                  >
                    <img
                      src={selectedUser.nationalIdImageUrl}
                      alt="ID Card"
                      className="w-full max-h-48 object-contain bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Click to enlarge</p>
                </div>
              )}

              {/* Face Scan Images */}
              {(selectedUser.faceImageUrl || selectedUser.faceImageLeftUrl || selectedUser.faceImageRightUrl) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaceSmileIcon className="h-5 w-5 text-green-500" />
                    Face Scan Photos
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedUser.faceImageUrl && (
                      <div 
                        className="relative border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                        onClick={() => setExpandedImage(selectedUser.faceImageUrl)}
                      >
                        <img
                          src={selectedUser.faceImageUrl}
                          alt="Face Front"
                          className="w-full aspect-square object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          Front
                        </span>
                      </div>
                    )}
                    {selectedUser.faceImageLeftUrl && (
                      <div 
                        className="relative border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                        onClick={() => setExpandedImage(selectedUser.faceImageLeftUrl)}
                      >
                        <img
                          src={selectedUser.faceImageLeftUrl}
                          alt="Face Left"
                          className="w-full aspect-square object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          Left Turn
                        </span>
                      </div>
                    )}
                    {selectedUser.faceImageRightUrl && (
                      <div 
                        className="relative border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                        onClick={() => setExpandedImage(selectedUser.faceImageRightUrl)}
                      >
                        <img
                          src={selectedUser.faceImageRightUrl}
                          alt="Face Right"
                          className="w-full aspect-square object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          Right Turn
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Click to enlarge</p>
                </div>
              )}
              
              {/* User Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs text-gray-500">Phone</label>
                  <p className="font-medium">{selectedUser.verifiedPhone || selectedUser.phone || "Not provided"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs text-gray-500">Rentals Posted</label>
                  <p className="font-medium">{selectedUser.rentalCount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs text-gray-500">Submitted</label>
                  <p className="font-medium">
                    {selectedUser.verificationSubmittedAt 
                      ? new Date(selectedUser.verificationSubmittedAt).toLocaleString() 
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs text-gray-500">Account Created</label>
                  <p className="font-medium">
                    {selectedUser.createdAt 
                      ? new Date(selectedUser.createdAt).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Add notes for this verification decision..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyUser("REJECTED")}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircleIcon className="h-5 w-5" />
                Reject
              </button>
              <button
                onClick={() => handleVerifyUser("VERIFIED")}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental Approval Modal */}
      {selectedRental && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Rental
              </h3>
              <button onClick={() => setSelectedRental(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {selectedRental.imageUrls?.[0] && (
                <img
                  src={selectedRental.imageUrls[0]}
                  alt={selectedRental.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h4 className="text-xl font-semibold">{selectedRental.title}</h4>
                <p className="text-gray-500">{selectedRental.address}, {selectedRental.ward}, {selectedRental.county}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">${selectedRental.price?.toLocaleString()}/mo</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedRental.bedrooms}</p>
                  <p className="text-xs text-gray-500">Beds</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedRental.bathrooms}</p>
                  <p className="text-xs text-gray-500">Baths</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedRental.squareFeet?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Sq Ft</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs text-gray-500">Posted By</label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{selectedRental.createdByName}</p>
                  {selectedRental.ownerIsVerified && (
                    <CheckBadgeIcon className={`h-5 w-5 ${selectedRental.ownerUserType === "AGENT" ? "text-amber-500" : "text-blue-500"}`} />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Add notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleApproveRental("REJECTED")}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveRental("APPROVED")}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setExpandedImage(null)}
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          <img
            src={expandedImage}
            alt="Expanded view"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
