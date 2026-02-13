"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rentalsApi, filesApi, Rental, PropertyType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { LocationSearchResult } from "@/lib/kenya-locations";

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
  const [images, setImages] = useState<{ file?: File; url: string; filename: string }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<Rental>>({
    title: "",
    description: "",
    price: 0,
    address: "",
    ward: "",
    constituency: "",
    county: "",
    areaName: "",
    directions: "",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 0,
    propertyType: "APARTMENT",
    status: "ACTIVE",
    petsAllowed: false,
    parkingAvailable: false,
    availableFrom: new Date().toISOString().split("T")[0],
    requiresApproval: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleLocationChange = (value: string, location?: LocationSearchResult) => {
    if (location) {
      // Auto-fill ward, constituency, and county from the selected location
      setFormData({
        ...formData,
        ward: location.ward || "",
        constituency: location.constituency || "",
        county: location.county,
      });
    } else {
      // Clear location fields if no location selected
      setFormData({
        ...formData,
        ward: "",
        constituency: "",
        county: "",
      });
    }
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

    if (!isAuthenticated) {
      alert("Please login to upload images");
      router.push("/login");
      return;
    }

    setUploadingImages(true);
    try {
      const newImages = [];
      for (const file of Array.from(files)) {
        const result = await filesApi.upload(file);
        newImages.push({
          url: result.url,
          filename: result.url,
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
      await filesApi.delete(image.filename);
      setImages(images.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Failed to delete image:", error);
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
    if (!formData.title || formData.title.trim().length < 5) {
      validationErrors.push("Title must be at least 5 characters");
    }
    if (!formData.description || formData.description.trim().length === 0) {
      validationErrors.push("Description is required");
    }
    if (!formData.price || formData.price <= 0) {
      validationErrors.push("Price must be greater than 0");
    }
    if (!formData.address || formData.address.trim().length === 0) {
      validationErrors.push("Address is required");
    }
    if (!formData.ward || formData.ward.trim().length === 0) {
      validationErrors.push("Ward is required — select a location from the dropdown");
    }
    if (!formData.constituency || formData.constituency.trim().length === 0) {
      validationErrors.push("Constituency is required — select a ward from the dropdown to auto-fill");
    }
    if (!formData.county || formData.county.trim().length === 0) {
      validationErrors.push("County is required — select a ward from the dropdown to auto-fill");
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
        amenities: selectedAmenities,
        // Convert date to full ISO datetime for backend LocalDateTime
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
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., Modern 2BR Apartment in Downtown"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                placeholder="Describe the property..."
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
                required
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="e.g., Near Mosque, Behind Shopping Center"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="md:col-span-2">
              <LocationAutocomplete
                label="Ward"
                value={formData.ward || ""}
                onChange={handleLocationChange}
                placeholder="Search for a ward..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Start typing to search for a ward. Constituency and County will be auto-filled.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Constituency</label>
              <input
                type="text"
                value={formData.constituency || ""}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Auto-filled from ward"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
              <input
                type="text"
                value={formData.county || ""}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Auto-filled from ward"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area Name (Optional)</label>
              <input
                type="text"
                name="areaName"
                value={formData.areaName || ""}
                onChange={handleInputChange}
                placeholder="e.g., Kilimani, South B, Pangani"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">Local name or nickname for the area</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Direction Description (Optional)</label>
              <textarea
                name="directions"
                value={formData.directions || ""}
                onChange={handleInputChange}
                rows={3}
                placeholder="e.g., Located 200m from the main road, next to the petrol station, opposite the green apartment building..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">Help potential tenants find the property easily</p>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <select
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
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

        {/* Privacy & Approval */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h2>
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                name="requiresApproval"
                checked={formData.requiresApproval}
                onChange={handleCheckboxChange}
                className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">Require Super Admin Approval</span>
                <p className="text-sm text-gray-500">
                  When enabled, this listing will be reviewed by a super admin before being published.
                  This adds an extra layer of confidentiality for sensitive listings.
                </p>
              </div>
            </label>
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

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
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
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
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
