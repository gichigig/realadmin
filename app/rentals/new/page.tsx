"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { rentalsApi, filesApi, Rental, PropertyType, Building, buildingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PhotoIcon, XMarkIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import HashtagsInput from "@/components/HashtagsInput";
import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";
import AudioSelectorModal from "@/components/AudioSelectorModal";
import MediaOverlayEditor, { OverlayConfig } from "@/components/MediaOverlayEditor";
import { Music } from "lucide-react";

const propertyTypes: PropertyType[] = [
  "BEDSITTER", "SINGLE_ROOM", "DOUBLE_ROOM", "ROOM", "STUDIO",
  "APARTMENT", "HOUSE", "CONDO", "TOWNHOUSE", "VILLA", "AIR_BNB",
  "PENTHOUSE", "DUPLEX", "OFFICE", "SHOP", "WAREHOUSE", "OTHER"
];

// Helper to format property type for display
const formatPropertyType = (type: PropertyType): string => {
  const labels: Record<PropertyType, string> = {
    "BEDSITTER": "Bedsitter",
    "SINGLE_ROOM": "Single Room",
    "DOUBLE_ROOM": "Double Room",
    "ROOM": "Room",
    "STUDIO": "Studio",
    "APARTMENT": "Apartment",
    "HOUSE": "House",
    "CONDO": "Condo",
    "TOWNHOUSE": "Townhouse",
    "VILLA": "Villa",
    "AIR_BNB": "Air BnB",
    "PENTHOUSE": "Penthouse",
    "DUPLEX": "Duplex",
    "OFFICE": "Office",
    "SHOP": "Shop",
    "WAREHOUSE": "Warehouse",
    "OTHER": "Other"
  };
  return labels[type] || type;
};

const isNoBedBathPropertyType = (type?: PropertyType | string): boolean => {
  if (!type) return false;
  return [
    "BEDSITTER",
    "SINGLE_ROOM",
    "DOUBLE_ROOM",
    "ROOM",
    "STUDIO",
    "OFFICE",
    "SHOP",
    "WAREHOUSE",
  ].includes(type);
};

const defaultAmenities = [
  "Air Conditioning",
  "Heating",
  "Washer/Dryer",
  "Dishwasher",
  "Parking",
  "Pool",
  "Gym",
  "Balcony",
  "Storage",
  "Elevator",
];

export default function NewRentalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<{ file?: File; url: string; filename: string; thumbnailUrl?: string; mediumUrl?: string }[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingCompoundVideo, setUploadingCompoundVideo] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [formData, setFormData] = useState<Partial<Rental>>({
    title: "",
    buildingId: undefined,
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 0,
    floor: undefined,
    propertyType: "APARTMENT",
    status: "ACTIVE",
    petsAllowed: false,
    parkingAvailable: false,
    availableFrom: new Date().toISOString().split("T")[0],
    requiresApproval: false,
  });

  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<{ url?: string; title?: string }>({});
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    text: "",
    font: "SANS",
    color: "#FFFFFF",
    position: "TOP_LEFT",
    bgStyle: "DARK_BANNER",
  });

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(console.error);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bId = params.get("buildingId");
      if (bId) {
        setFormData(prev => ({ ...prev, buildingId: Number(bId) }));
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "propertyType") {
      const isNoBedBath = isNoBedBathPropertyType(value);
      setFormData((prev) => ({
        ...prev,
        propertyType: value as PropertyType,
        ...(isNoBedBath ? { bedrooms: 0, bathrooms: 0 } : {}),
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (!isAuthenticated) {
      alert("Please login to upload images");
      router.push("/login");
      return;
    }

    setUploadingImages(true);
    try {
      const newImages = [];
      for (const file of Array.from(files)) {
        const result = await filesApi.uploadPropertyImage(file);
        newImages.push({
          url: result.url,
          filename: result.url,
          thumbnailUrl: result.thumbnailUrl,
          mediumUrl: result.mediumUrl,
        });
      }
      setImages([...images, ...newImages]);
    } catch (error) {
      console.error("Failed to upload images:", error);
      alert(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    try {
      await filesApi.deleteByUrl(image.url);
      setImages(images.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      alert("Please login to upload videos");
      router.push("/login");
      return;
    }

    setUploadingVideo(true);
    try {
      const result = await filesApi.uploadVideo(file);
      setVideoUrl(result.url);
    } catch (error) {
      console.error("Failed to upload video:", error);
      alert(error instanceof Error ? error.message : "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!videoUrl) return;
    try {
      await filesApi.deleteByUrl(videoUrl);
      setVideoUrl(null);
    } catch (error) {
      console.error("Failed to delete video:", error);
      setVideoUrl(null); // remove from UI anyway
    }
  };

  const handleCompoundVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      alert("Please login to upload videos");
      router.push("/login");
      return;
    }

    setUploadingCompoundVideo(true);
    try {
      const result = await filesApi.uploadVideo(file);
      setFormData(prev => ({ ...prev, compoundVideoUrl: result.url }));
    } catch (error) {
      console.error("Failed to upload compound video:", error);
      alert(error instanceof Error ? error.message : "Failed to upload compound video");
    } finally {
      setUploadingCompoundVideo(false);
    }
  };

  const handleRemoveCompoundVideo = async () => {
    if (!formData.compoundVideoUrl) return;
    try {
      await filesApi.deleteByUrl(formData.compoundVideoUrl);
      setFormData(prev => ({ ...prev, compoundVideoUrl: undefined }));
    } catch (error) {
      console.error("Failed to delete compound video:", error);
      setFormData(prev => ({ ...prev, compoundVideoUrl: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      alert("Please login to create rentals");
      router.push("/login");
      return;
    }

    // Frontend validation
    const validationErrors: string[] = [];
    if (!formData.buildingId) {
      validationErrors.push("Please select a Building");
    }
    if (!formData.title || formData.title.trim().length === 0) {
      validationErrors.push("Unit/House Name is required");
    }
    if (!formData.price || formData.price <= 0) {
      validationErrors.push("Price must be greater than 0");
    }
    const isPro = Boolean(user?.isPremiumActive);
    const hasVideo = Boolean(videoUrl || formData.compoundVideoUrl);
    const hasImages = images.length > 0;

    if (!hasImages && !hasVideo) {
      validationErrors.push("At least one photo or video is required.");
    } else if (!hasImages && !isPro) {
      validationErrors.push("At least one picture is required (Pro subscribers can post video-only listings).");
    }
    
    if (validationErrors.length > 0) {
      alert("Please fix the following:\n\n" + validationErrors.join("\n"));
      return;
    }

    setLoading(true);

    try {
      const normalizedAvailableFrom =
        formData.availableFrom
          ? `${formData.availableFrom}T00:00:00`
          : `${new Date().toISOString().split("T")[0]}T00:00:00`;

      const rental: Rental = {
        ...formData as Rental,
        imageUrls: images.map((img) => img.url),
        thumbnailUrls: images.map((img) => img.thumbnailUrl || ""),
        mediumUrls: images.map((img) => img.mediumUrl || ""),
        videoUrl: videoUrl || undefined,
        audioUrl: selectedAudio.url || undefined,
        audioTitle: selectedAudio.title || undefined,
        overlayText: overlayConfig.text || undefined,
        overlayFont: overlayConfig.font || undefined,
        overlayColor: overlayConfig.color || undefined,
        overlayPosition: overlayConfig.position || undefined,
        overlayBgStyle: overlayConfig.bgStyle || undefined,
        hasVideo: (videoUrl != null || formData.compoundVideoUrl != null),
        amenities: selectedAmenities,
        hashtags: hashtags,
        availableFrom: normalizedAvailableFrom,
      };

      await rentalsApi.create(rental, user.id);
      router.push("/rentals");
    } catch (error) {
      console.error("Failed to create rental:", error);
      alert(error instanceof Error ? error.message : "Failed to create rental. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Rental</h1>
        <p className="text-gray-600">Create a new rental property listing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Select Building */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Building Portfolio</h2>
            <Link
              href="/buildings/new"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 font-medium"
            >
              + Create New Building
            </Link>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Building/Complex</label>
            <select
              name="buildingId"
              value={formData.buildingId || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, buildingId: e.target.value ? Number(e.target.value) : undefined }))}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
            >
              <option value="">-- Select Building Complex --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.ward}, {b.county})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit/House Name</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g. Apt 4B or House 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatPropertyType(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (KES)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                required
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms {isNoBedBathPropertyType(formData.propertyType) && <span className="text-xs text-gray-400 font-normal">(N/A)</span>}
              </label>
              <select
                name="bedrooms"
                value={isNoBedBathPropertyType(formData.propertyType) ? 0 : formData.bedrooms}
                onChange={handleInputChange}
                disabled={isNoBedBathPropertyType(formData.propertyType)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value={0}>0 (N/A)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms {isNoBedBathPropertyType(formData.propertyType) && <span className="text-xs text-gray-400 font-normal">(N/A)</span>}
              </label>
              <input
                type="number"
                name="bathrooms"
                value={isNoBedBathPropertyType(formData.propertyType) ? 0 : formData.bathrooms}
                onChange={handleInputChange}
                disabled={isNoBedBathPropertyType(formData.propertyType)}
                min="0"
                placeholder={isNoBedBathPropertyType(formData.propertyType) ? "N/A" : "0"}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
              <input
                type="number"
                name="squareFeet"
                value={formData.squareFeet}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
              <input
                type="number"
                name="floor"
                value={formData.floor ?? ""}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g. 0 for Ground, 1, 2"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available From</label>
              <input
                type="date"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center space-x-6 md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="petsAllowed"
                  checked={formData.petsAllowed}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Pets Allowed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="parkingAvailable"
                  checked={formData.parkingAvailable}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Parking Available</span>
              </label>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {defaultAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="bg-white rounded-lg shadow p-6">
          <HashtagsInput hashtags={hashtags} onChange={setHashtags} />
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={filesApi.getUrl(image.thumbnailUrl || image.url)}
                  alt={`Property ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center">
              {uploadingImages ? (
                <DwellyOrbitingLoader size={32} />
              ) : (
                <>
                  <PhotoIcon className="w-10 h-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Click to upload images</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImages}
            />
          </label>
        </div>

        {/* Premium Video Features */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wide font-bold mr-1">Premium</span>
              <VideoCameraIcon className="w-5 h-5 text-blue-800" /> Video Features
            </h2>
          </div>
          
          {(user?.isPremiumActive || user?.premiumActive) ? (
            <div className="space-y-8">
              <p className="text-sm text-blue-700">Enhance your listing with video content to stand out to tenants.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Listing Video */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Listing Video</label>
                  <p className="text-xs text-gray-500 mb-3">Upload a walk-through or main showcase video (max 50MB).</p>
                  
                  {videoUrl ? (
                    <div className="relative group">
                      <video 
                        src={filesApi.getUrl(videoUrl)} 
                        controls 
                        className="w-full h-40 object-cover rounded-lg bg-black"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        {uploadingVideo ? (
                          <DwellyOrbitingLoader size={32} />
                        ) : (
                          <>
                            <VideoCameraIcon className="w-10 h-10 text-blue-400" />
                            <p className="mt-2 text-sm text-blue-600 font-medium">Upload Listing Video</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        disabled={uploadingVideo}
                      />
                    </label>
                  )}
                </div>

                {/* Display Preference Settings */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Card Display Preference</label>
                    <select
                      name="cardDisplayPreference"
                      value={formData.cardDisplayPreference || "ONE_PICTURE"}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="ONE_PICTURE">1 Picture</option>
                      <option value="DOUBLE_PICTURE">Double Pictures</option>
                      <option value="THREE_PICTURES">3 Pictures</option>
                      <option value="VIDEO">Video Listing (Requires Main Listing Video)</option>
                    </select>
                    <p className="mt-2 text-xs text-blue-600">
                      Choose how your property appears in the tenant's feed.
                    </p>
                  </div>

                  {formData.cardDisplayPreference !== "VIDEO" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Circular Autoplay Video</label>
                      <p className="text-xs text-gray-500 mb-3">Small hovering video shown over your pictures.</p>
                      {formData.compoundVideoUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200">
                          <video src={filesApi.getUrl(formData.compoundVideoUrl)} controls className="w-full h-32 object-cover bg-black" />
                          <button
                            type="button"
                            onClick={handleRemoveCompoundVideo}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                          <div className="flex flex-col items-center justify-center">
                            {uploadingCompoundVideo ? (
                              <DwellyOrbitingLoader size={32} />
                            ) : (
                              <>
                                <PhotoIcon className="w-8 h-8 text-blue-400" />
                                <p className="mt-2 text-sm text-blue-600 font-medium text-center px-4">Upload Compound Video</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleCompoundVideoUpload}
                            className="hidden"
                            disabled={uploadingCompoundVideo}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <VideoCameraIcon className="w-12 h-12 text-blue-200 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900">Premium Video Features Locked</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto mb-4">
                Upgrade to Landlord Pro to create immersive Video Listings and Circular Autoplay overlays that attract more tenants.
              </p>
            </div>
          )}
        </div>

        {/* Listing Background Music & Audio Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Music className="w-5 h-5 text-blue-600" /> Listing Background Music & Audio
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Attach custom audio or search online music to play when tenants view your listing (photo or video).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAudioModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              {selectedAudio.url ? "Change Audio" : "Search & Add Music"}
            </button>
          </div>

          {selectedAudio.url ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  ♪
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{selectedAudio.title || "Background Music Track"}</h4>
                  <p className="text-xs text-blue-700 truncate max-w-md">{selectedAudio.url}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAudio({ url: undefined, title: undefined })}
                className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-md hover:bg-red-200"
              >
                Remove Track
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic mt-2">No audio track attached yet. Click to search online music or pick a preset.</p>
          )}
        </div>

        <AudioSelectorModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          onSelectTrack={(track) => setSelectedAudio({ url: track.url, title: track.title })}
          currentAudioUrl={selectedAudio.url}
          currentAudioTitle={selectedAudio.title}
        />

        {/* Media Overlay Editor */}
        <MediaOverlayEditor
          config={overlayConfig}
          onChange={setOverlayConfig}
          sampleImageUrl={images[0]?.url ? filesApi.getUrl(images[0].url) : undefined}
        />

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Rental"}
          </button>
        </div>
      </form>
    </div>
  );
}
