"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { advertisersApi, filesApi } from "@/lib/api";
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

const PAYMENT_METHODS = [
  { value: "MPESA", label: "M-Pesa" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card Payment" },
  { value: "INVOICE", label: "Invoice" },
];

export default function NewAdvertiserPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState("MPESA");
  
  // File uploads
  const [logoUrl, setLogoUrl] = useState("");
  const [businessCertificateUrl, setBusinessCertificateUrl] = useState("");
  const [taxRegistrationUrl, setTaxRegistrationUrl] = useState("");
  const [additionalDocumentUrl, setAdditionalDocumentUrl] = useState("");
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [uploadingTax, setUploadingTax] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const taxInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const result = await filesApi.upload(file);
      setLogoUrl(result.url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload logo"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setUploading: (val: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await filesApi.uploadDocument(file);
      setUrl(result.url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload document"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    if (!contactEmail.trim()) {
      setError("Contact email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await advertisersApi.create({
        companyName,
        companyDescription,
        companyWebsite: website || undefined,
        companyEmail: contactEmail,
        companyPhone: contactPhone || undefined,
        companyAddress: address || undefined,
        logoUrl: logoUrl || undefined,
        businessCertificateUrl: businessCertificateUrl || undefined,
        taxRegistrationUrl: taxRegistrationUrl || undefined,
        additionalDocumentUrl: additionalDocumentUrl || undefined,
        billingEmail: billingEmail || contactEmail,
        preferredPaymentMethod,
      });

      router.push("/advertisers");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create advertiser"));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Verify Business</h1>
        <p className="text-gray-600">Upload verification documents to get your ads approved by super admin</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          
          {/* Logo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img src={logoUrl} alt="Logo" className="h-20 w-20 rounded-lg object-cover border" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                >
                  {uploadingLogo ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="text-sm text-blue-600 hover:underline"
              >
                {logoUrl ? "Change Logo" : "Upload Logo"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the company"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="contact@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Physical address"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Documents</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload documents to verify this advertiser. Verified advertisers can create ads that go live after approval.
          </p>
          
          <div className="space-y-4">
            {/* Business Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Registration Certificate
              </label>
              <input
                type="file"
                ref={certificateInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentUpload(e, setBusinessCertificateUrl, setUploadingCertificate)}
                className="hidden"
              />
              {businessCertificateUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600 text-sm flex-1">Document uploaded</span>
                  <a href={businessCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                    View
                  </a>
                  <button type="button" onClick={() => setBusinessCertificateUrl("")} className="text-red-600 text-sm hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => certificateInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 w-full"
                  disabled={uploadingCertificate}
                >
                  {uploadingCertificate ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-gray-600">Upload certificate (PDF, JPG, PNG)</span>
                </button>
              )}
            </div>

            {/* Tax Registration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Registration / KRA PIN Certificate
              </label>
              <input
                type="file"
                ref={taxInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentUpload(e, setTaxRegistrationUrl, setUploadingTax)}
                className="hidden"
              />
              {taxRegistrationUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600 text-sm flex-1">Document uploaded</span>
                  <a href={taxRegistrationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                    View
                  </a>
                  <button type="button" onClick={() => setTaxRegistrationUrl("")} className="text-red-600 text-sm hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => taxInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 w-full"
                  disabled={uploadingTax}
                >
                  {uploadingTax ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-gray-600">Upload tax certificate (PDF, JPG, PNG)</span>
                </button>
              )}
            </div>

            {/* Additional Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Document (Optional)
              </label>
              <input
                type="file"
                ref={additionalInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentUpload(e, setAdditionalDocumentUrl, setUploadingAdditional)}
                className="hidden"
              />
              {additionalDocumentUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600 text-sm flex-1">Document uploaded</span>
                  <a href={additionalDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                    View
                  </a>
                  <button type="button" onClick={() => setAdditionalDocumentUrl("")} className="text-red-600 text-sm hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => additionalInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 w-full"
                  disabled={uploadingAdditional}
                >
                  {uploadingAdditional ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-gray-600">Upload additional document (PDF, JPG, PNG)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="billing@company.com (defaults to contact email)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Payment Method</label>
              <select
                value={preferredPaymentMethod}
                onChange={(e) => setPreferredPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Advertiser"}
          </button>
        </div>
      </form>
    </div>
  );
}
