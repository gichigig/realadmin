"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { adsApi, advertisersApi, filesApi } from "@/lib/api";
import {
  ArrowLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const PLACEMENTS = [
  { value: "HOME_BANNER", label: "Home Banner", desc: "Top banner on home screen" },
  { value: "HOME_FEED", label: "Home Feed", desc: "In the listing feed" },
  { value: "LISTING_DETAIL", label: "Listing Detail", desc: "On listing detail page" },
  { value: "SEARCH_RESULTS", label: "Search Results", desc: "In search results" },
  { value: "INTERSTITIAL", label: "Interstitial", desc: "Full screen between actions" },
  { value: "SPLASH", label: "Splash Screen", desc: "App splash screen" },
];

const LINK_TYPES = [
  { value: "WEBSITE", label: "Website", icon: GlobeAltIcon, desc: "Link to external website" },
  { value: "PLAYSTORE", label: "Play Store", icon: DevicePhoneMobileIcon, desc: "Link to Google Play Store" },
  { value: "APPSTORE", label: "App Store", icon: DevicePhoneMobileIcon, desc: "Link to Apple App Store" },
  { value: "APP_BOTH", label: "Both Stores", icon: DevicePhoneMobileIcon, desc: "Show both store options" },
  { value: "FORM", label: "Form", icon: DocumentTextIcon, desc: "Show in-app form" },
  { value: "NONE", label: "None", icon: XCircleIcon, desc: "No action on click" },
];

const FORM_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];  // For dropdown
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

export default function NewAdPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAdvertiser, setLoadingAdvertiser] = useState(true);
  const [error, setError] = useState("");
  const [advertiserId, setAdvertiserId] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [placement, setPlacement] = useState("HOME_BANNER");
  const [linkType, setLinkType] = useState("WEBSITE");
  const [targetUrl, setTargetUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [priority, setPriority] = useState(0);
  
  // Media
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Form builder
  const [formTitle, setFormTitle] = useState("");
  const [formSubmitButtonText, setFormSubmitButtonText] = useState("Submit");
  const [formSuccessMessage, setFormSuccessMessage] = useState("Thank you for your submission!");
  const [formFields, setFormFields] = useState<FormField[]>([
    { id: "1", label: "Name", type: "text", required: true, placeholder: "Enter your name" },
    { id: "2", label: "Email", type: "email", required: true, placeholder: "Enter your email" },
    { id: "3", label: "Phone", type: "phone", required: false, placeholder: "Enter your phone" },
  ]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingAdvertiser(false);
      return;
    }

    let mounted = true;

    const loadAdvertiserProfile = async () => {
      setLoadingAdvertiser(true);
      try {
        const advertiser = await advertisersApi.getMe();
        if (!mounted) {
          return;
        }
        setAdvertiserId(advertiser?.id ?? null);
      } catch (err: unknown) {
        if (!mounted) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load advertiser profile";
        setError(message);
      } finally {
        if (mounted) {
          setLoadingAdvertiser(false);
        }
      }
    };

    loadAdvertiserProfile();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const result = await filesApi.upload(file);
      setImageUrl(result.url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload image"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingVideo(true);
    try {
      const result = await filesApi.uploadVideo(file);
      setVideoUrl(result.url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload video"));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingThumbnail(true);
    try {
      const result = await filesApi.upload(file);
      setThumbnailUrl(result.url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload thumbnail"));
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const addFormField = () => {
    setFormFields([
      ...formFields,
      {
        id: Date.now().toString(),
        label: "",
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
  };

  const updateFormField = (id: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFormField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advertiserId) {
      setError("Create an advertiser profile before creating ads.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (mediaType === "IMAGE" && !imageUrl) {
      setError("Please upload an image");
      return;
    }
    if (mediaType === "VIDEO" && !videoUrl) {
      setError("Please upload a video");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formSchema = linkType === "FORM" ? JSON.stringify({
        title: formTitle,
        submitButtonText: formSubmitButtonText,
        successMessage: formSuccessMessage,
        fields: formFields,
      }) : undefined;

      await adsApi.create({
        advertiserId,
        title,
        description,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        mediaType,
        placement,
        linkType,
        targetUrl: targetUrl || undefined,
        playStoreUrl: playStoreUrl || undefined,
        appStoreUrl: appStoreUrl || undefined,
        formTitle: linkType === "FORM" ? formTitle : undefined,
        formSchema,
        formSubmitButtonText: linkType === "FORM" ? formSubmitButtonText : undefined,
        formSuccessMessage: linkType === "FORM" ? formSuccessMessage : undefined,
        priority,
      });

      router.push("/ads");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create ad"));
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

  if (loadingAdvertiser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Advertisement</h1>
        <p className="text-gray-600">Create a new ad to display in the mobile app</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!advertiserId && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
          <span>Create your advertiser profile first before creating ads.</span>
          <Link
            href="/advertisers/new"
            className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 whitespace-nowrap"
          >
            Verify Business
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter ad title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter ad description"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Media Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
          
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setMediaType("IMAGE")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                mediaType === "IMAGE"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <PhotoIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-gray-900">Image Ad</p>
              <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP</p>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("VIDEO")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                mediaType === "VIDEO"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <VideoCameraIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-gray-900">Video Ad</p>
              <p className="text-xs text-gray-500">MP4, WebM (max 50MB)</p>
            </button>
          </div>

          {mediaType === "IMAGE" && (
            <div>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {!imageUrl ? (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Click to upload image</p>
                      <p className="text-sm text-gray-400 mt-1">Max 10MB</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img src={imageUrl} alt="Ad preview" className="w-full max-h-64 object-contain rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {mediaType === "VIDEO" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                {!videoUrl ? (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    {uploadingVideo ? (
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Click to upload video</p>
                        <p className="text-sm text-gray-400 mt-1">Max 50MB</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <video src={videoUrl} controls className="w-full max-h-64 rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setVideoUrl("")}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (shown before video plays)</label>
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                {!thumbnailUrl ? (
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    {uploadingThumbnail ? (
                      <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      <p className="text-gray-600 text-sm">Click to upload thumbnail</p>
                    )}
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img src={thumbnailUrl} alt="Thumbnail" className="h-24 rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl("")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Placement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Placement</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLACEMENTS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlacement(p.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  placement === p.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900">{p.label}</p>
                <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Link Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Click Action</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {LINK_TYPES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => setLinkType(lt.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  linkType === lt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <lt.icon className="h-6 w-6 text-gray-600 mb-2" />
                <p className="font-medium text-gray-900">{lt.label}</p>
                <p className="text-xs text-gray-500 mt-1">{lt.desc}</p>
              </button>
            ))}
          </div>

          {linkType === "WEBSITE" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          )}

          {linkType === "PLAYSTORE" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Play Store URL</label>
              <input
                type="url"
                value={playStoreUrl}
                onChange={(e) => setPlayStoreUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://play.google.com/store/apps/details?id=..."
              />
            </div>
          )}

          {linkType === "APPSTORE" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Store URL</label>
              <input
                type="url"
                value={appStoreUrl}
                onChange={(e) => setAppStoreUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://apps.apple.com/app/..."
              />
            </div>
          )}

          {linkType === "APP_BOTH" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Play Store URL</label>
                <input
                  type="url"
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Store URL</label>
                <input
                  type="url"
                  value={appStoreUrl}
                  onChange={(e) => setAppStoreUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://apps.apple.com/app/..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Builder (for FORM link type) */}
        {linkType === "FORM" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Builder</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Request a Quote"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
                  <input
                    type="text"
                    value={formSubmitButtonText}
                    onChange={(e) => setFormSubmitButtonText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Submit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
                  <input
                    type="text"
                    value={formSuccessMessage}
                    onChange={(e) => setFormSuccessMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Thank you!"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Form Fields</h3>
                <button
                  type="button"
                  onClick={addFormField}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              {formFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 font-medium">{index + 1}</span>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Label"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateFormField(field.id, { type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {FORM_FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Placeholder"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFormField(field.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Priority</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Higher value = shown first</p>
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
            disabled={loading || !advertiserId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : advertiserId ? "Create Ad" : "Verify Business First"}
          </button>
        </div>
      </form>
    </div>
  );
}
