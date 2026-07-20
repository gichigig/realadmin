"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { rentalsApi, filesApi, Rental, PropertyType, Building, buildingsApi } from "@/lib/api";
import { PhotoIcon, XMarkIcon, ArrowLeftIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import HashtagsInput from "@/components/HashtagsInput";
import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";

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

export default function EditRentalPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<{ url: string; filename: string; thumbnailUrl?: string; mediumUrl?: string }[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Rental>>({});
  const [uploadingCompoundVideo, setUploadingCompoundVideo] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Fetch building complexes
    buildingsApi.getAll().then(setBuildings).catch(console.error);

    const fetchRental = async () => {
      try {
        const data = await rentalsApi.getById(Number(params.id));
        setFormData(data);
        setSelectedAmenities(data.amenities || []);
        setHashtags(data.hashtags || []);
        setImages(
          (data.imageUrls || []).map((url, index) => ({
            url,
            filename: url.split("/").pop() || "",
            thumbnailUrl: data.thumbnailUrls?.[index] || "",
            mediumUrl: data.mediumUrls?.[index] || "",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch rental:", error);
        alert("Failed to load rental");
        router.push("/rentals");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRental();
    }
  }, [params.id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "propertyType") {
      const isNoBedBath = isNoBedBathPropertyType(value);
      setFormData({
        ...formData,
        propertyType: value as PropertyType,
        ...(isNoBedBath ? { bedrooms: 0, bathrooms: 0 } : {}),
      });
      return;
    }
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

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
      alert("Failed to upload images");
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
      setFormData({ ...formData, videoUrl: result.url });
    } catch (error) {
      console.error("Failed to upload video:", error);
      alert(error instanceof Error ? error.message : "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    try {
      if (formData.videoUrl) {
        await filesApi.deleteByUrl(formData.videoUrl);
      }
      setFormData({ ...formData, videoUrl: undefined });
    } catch (error) {
      console.error("Failed to delete video:", error);
      setFormData({ ...formData, videoUrl: undefined });
    }
  };

  const handleCompoundVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCompoundVideo(true);
    try {
      const result = await filesApi.uploadVideo(file);
      setFormData({ ...formData, compoundVideoUrl: result.url });
    } catch (error) {
      console.error("Failed to upload compound video:", error);
      alert("Failed to upload compound video");
    } finally {
      setUploadingCompoundVideo(false);
    }
  };

  const handleRemoveCompoundVideo = async () => {
    try {
      if (formData.compoundVideoUrl) {
        await filesApi.deleteByUrl(formData.compoundVideoUrl);
      }
      setFormData({ ...formData, compoundVideoUrl: null });
    } catch (error) {
      console.error("Failed to delete compound video:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    if (images.length === 0) {
      validationErrors.push("At least one picture is required.");
    }
    
    if (validationErrors.length > 0) {
      alert("Please fix the following:\n\n" + validationErrors.join("\n"));
      return;
    }

    setSaving(true);

    try {
      // Get the availableFrom value and ensure it has time component
      const availableFromValue = formData.availableFrom?.split("T")[0];
      const normalizedAvailableFrom =
        availableFromValue
          ? `${availableFromValue}T00:00:00`
          : formData.availableFrom || `${new Date().toISOString().split("T")[0]}T00:00:00`;
      
      const rental: Rental = {
        ...formData as Rental,
        imageUrls: images.map((img) => img.url),
        thumbnailUrls: images.map((img) => img.thumbnailUrl || ""),
        mediumUrls: images.map((img) => img.mediumUrl || ""),
        hasVideo: (formData.videoUrl != null || formData.compoundVideoUrl != null),
        amenities: selectedAmenities,
        hashtags: hashtags,
        availableFrom: normalizedAvailableFrom,
      };

      await rentalsApi.update(Number(params.id), rental);
      router.push(`/rentals/${params.id}`);
    } catch (error) {
      console.error("Failed to update rental:", error);
      alert(error instanceof Error ? error.message : "Failed to update rental");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <DwellyOrbitingLoader size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium text-sm"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Rental</h1>
        <p className="text-gray-600">Update the rental property details</p>
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
                value={formData.title || ""}
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
                value={formData.propertyType || "APARTMENT"}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
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
                value={formData.price || 0}
                onChange={handleInputChange}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                required
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status || "ACTIVE"}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="RENTED">Rented</option>
                <option value="INACTIVE">Inactive</option>
              </select>
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
                value={isNoBedBathPropertyType(formData.propertyType) ? 0 : (formData.bedrooms ?? 0)}
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
                value={isNoBedBathPropertyType(formData.propertyType) ? 0 : (formData.bathrooms ?? 0)}
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
                value={formData.squareFeet || 0}
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
                value={formData.availableFrom?.split("T")[0] || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center space-x-6 md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="petsAllowed"
                  checked={formData.petsAllowed || false}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Pets Allowed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="parkingAvailable"
                  checked={formData.parkingAvailable || false}
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
              <p className="text-sm text-blue-700 mb-4">Enhance your listing with video content to stand out to tenants.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Listing Video */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Listing Video</label>
                  <p className="text-xs text-gray-500 mb-3">Upload a walk-through or main showcase video (max 50MB).</p>
                  
                  {formData.videoUrl ? (
                     <div className="relative group">
                       <video 
                         src={filesApi.getUrl(formData.videoUrl)} 
                         controls 
                         preload="metadata"
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
                          <video src={filesApi.getUrl(formData.compoundVideoUrl)} controls preload="metadata" className="w-full h-32 object-cover bg-black" />
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
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
