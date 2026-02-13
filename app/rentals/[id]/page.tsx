"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { rentalsApi, Rental } from "@/lib/api";
import { 
  PencilIcon,
  ArrowLeftIcon,
  MapPinIcon,
  HomeIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRental = async () => {
      try {
        const data = await rentalsApi.getById(Number(params.id));
        setRental(data);
      } catch (error) {
        console.error("Failed to fetch rental:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRental();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Rental not found</p>
        <Link href="/rentals" className="text-blue-600 hover:underline">
          Back to rentals
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      RENTED: "bg-blue-100 text-blue-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      INACTIVE: "bg-red-100 text-red-800",
    };
    return `px-3 py-1 text-sm font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
        <Link
          href={`/rentals/${rental.id}/edit`}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PencilIcon className="w-5 h-5 mr-2" />
          Edit
        </Link>
      </div>

      {/* Images */}
      {rental.imageUrls && rental.imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {rental.imageUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Property ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rental.title}</h1>
            <div className="flex items-center text-gray-600 mt-2">
              <MapPinIcon className="w-5 h-5 mr-2" />
              {rental.address}, {rental.ward}, {rental.constituency}, {rental.county}
            </div>
            {rental.areaName && (
              <p className="text-sm text-gray-500 mt-1 ml-7">Area: {rental.areaName}</p>
            )}
            {rental.directions && (
              <p className="text-sm text-gray-500 mt-1 ml-7">Directions: {rental.directions}</p>
            )}
          </div>
          <div className="text-right">
            <span className={getStatusBadge(rental.status)}>{rental.status}</span>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              ${rental.price.toLocaleString()}/mo
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <HomeIcon className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{rental.propertyType}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 ml-8">Bedrooms:</span>
              <span className="ml-2 font-medium">{rental.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 ml-8">Bathrooms:</span>
              <span className="ml-2 font-medium">{rental.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 ml-8">Square Feet:</span>
              <span className="ml-2 font-medium">{rental.squareFeet?.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-gray-600">Available:</span>
              <span className="ml-2 font-medium">
                {rental.availableFrom ? new Date(rental.availableFrom).toLocaleDateString() : "Now"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-3 ${rental.petsAllowed ? "bg-green-500" : "bg-red-500"}`}></span>
              <span className="text-gray-600">Pets {rental.petsAllowed ? "Allowed" : "Not Allowed"}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-3 ${rental.parkingAvailable ? "bg-green-500" : "bg-red-500"}`}></span>
              <span className="text-gray-600">Parking {rental.parkingAvailable ? "Available" : "Not Available"}</span>
            </div>
          </div>

          {rental.amenities && rental.amenities.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {rental.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{rental.description}</p>
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Created: {rental.createdAt ? new Date(rental.createdAt).toLocaleString() : "N/A"}</p>
        <p>Last Updated: {rental.updatedAt ? new Date(rental.updatedAt).toLocaleString() : "N/A"}</p>
        {rental.createdByName && <p>Created By: {rental.createdByName}</p>}
      </div>
    </div>
  );
}
