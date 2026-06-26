"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildingsApi, Building } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { LocationSearchResult } from "@/lib/kenya-locations";
import dynamic from "next/dynamic";
import { ArrowLeftIcon, BuildingOffice2Icon, MapPinIcon } from "@heroicons/react/24/outline";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function NewBuildingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Building>>({
    name: "",
    ward: "",
    constituency: "",
    county: "",
    latitude: -1.2921, // Default to Nairobi
    longitude: 36.8219,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLocationChange = (value: string, location?: LocationSearchResult) => {
    if (location) {
      setFormData({
        ...formData,
        ward: location.ward || "",
        constituency: location.constituency || "",
        county: location.county,
      });
    } else {
      setFormData({
        ...formData,
        ward: "",
        constituency: "",
        county: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      alert("Please login to create a building");
      router.push("/login");
      return;
    }

    // Validation
    const validationErrors: string[] = [];
    if (!formData.name || formData.name.trim().length < 2) {
      validationErrors.push("Building name must be at least 2 characters");
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
      const building: Building = {
        name: formData.name!,
        ward: formData.ward!,
        constituency: formData.constituency!,
        county: formData.county!,
        latitude: formData.latitude || -1.2921,
        longitude: formData.longitude || 36.8219,
      };

      await buildingsApi.create(building);
      router.push("/buildings");
    } catch (error) {
      console.error("Failed to create building:", error);
      alert(error instanceof Error ? error.message : "Failed to create building. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-5xl 2xl:max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors gap-2 group"
          >
            <ArrowLeftIcon className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            Back to Buildings
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Building</h1>
          <p className="text-gray-600 text-sm mt-1">
            Define the complex name, address, ward, and coordinates. All apartments/units inside this building will inherit these settings.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-250 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Building Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Building/Complex Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                  placeholder="e.g., Oakwood Heights, Riverside Plaza"
                />
              </div>


              <div className="md:col-span-2 relative">
                {/* Autocomplete uses input styles which are custom styled inside the component, but we can pass label and wrapper classes */}
                <LocationAutocomplete
                  label="Ward Location"
                  value={formData.ward || ""}
                  onChange={handleLocationChange}
                  placeholder="Search for a ward in Kenya..."
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Type ward name to fetch location. Constituency and County will fill automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Constituency</label>
                <input
                  type="text"
                  value={formData.constituency || ""}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                  placeholder="Auto-filled from ward"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">County</label>
                <input
                  type="text"
                  value={formData.county || ""}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                  placeholder="Auto-filled from ward"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-255 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">Geotag Coordinates</h2>
            </div>
            <p className="text-xs text-gray-500">Click on the map below to pinpoint the exact location of the building.</p>
            
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <MapPicker 
                latitude={formData.latitude || -1.2921} 
                longitude={formData.longitude || 36.8219} 
                onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} 
              />
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-emerald-600 font-semibold mt-2">
                Coordinates locked: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Creating..." : "Save Building Portfolio"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
  );
}
