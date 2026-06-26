"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Building, buildingsApi, rentalsApi, Rental } from "@/lib/api";
import { PlusIcon, BuildingOffice2Icon, MapPinIcon, HomeModernIcon, ArrowRightIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function BuildingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [buildingsList, rentalsPage] = await Promise.all([
        buildingsApi.getAll(),
        rentalsApi.getByUser(user.id, 0, 1000)
      ]);
      setBuildings(buildingsList);
      setRentals(rentalsPage.content || []);
    } catch (error) {
      console.error("Failed to load buildings data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const getUnitsForBuilding = (buildingId?: number) => {
    if (!buildingId) return [];
    return rentals.filter(r => r.buildingId === buildingId);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdownId(null);
    if (!window.confirm("Are you sure you want to delete this building? This action cannot be undone.")) return;
    
    try {
      await buildingsApi.delete(id);
      setBuildings(buildings.filter(b => b.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete building");
    }
  };

  return (
    <div className="p-6 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto space-y-8 animate-fadeIn">
      {/* Header section with matching style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Buildings</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage multiple building complexes under your portfolio. Group your apartments, units, or houses to streamline location details and communication.
            </p>
          </div>
          <Link
            href="/buildings/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Building
          </Link>
        </div>

        {/* Loading / Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 text-sm animate-pulse">Loading buildings and portfolios...</p>
          </div>
        ) : buildings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => {
              const bUnits = getUnitsForBuilding(building.id);
              return (
                <div
                  key={building.id}
                  className="group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle top indicator hover effect */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors duration-300">
                          <BuildingOffice2Icon className="w-6 h-6" />
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 border border-blue-100 text-blue-700">
                          {building.county}
                        </span>
                      </div>
                      
                      {/* Dropdown Toggle */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === building.id ? null : building.id!)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        
                        {openDropdownId === building.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 animate-fadeIn">
                            <Link
                              href={`/buildings/${building.id}/edit`}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenDropdownId(null)}
                            >
                              <PencilIcon className="w-4 h-4 mr-2 text-gray-400" />
                              Edit
                            </Link>
                            <button
                              onClick={(e) => handleDelete(e, building.id!)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                              <TrashIcon className="w-4 h-4 mr-2 text-red-500" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                      {building.name}
                    </h3>
                    
                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-center text-gray-600 gap-2">
                        <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
                        <span className="truncate text-gray-750">{building.ward} Ward, {building.constituency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats / Link */}
                  <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HomeModernIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {bUnits.length} {bUnits.length === 1 ? "Unit" : "Units"}
                      </span>
                    </div>

                    <Link
                      href={`/rentals/new?buildingId=${building.id}`}
                      className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors gap-1 group/btn"
                    >
                      Add Unit
                      <ArrowRightIcon className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="relative max-w-sm mx-auto space-y-6">
              <div className="w-16 h-16 bg-gray-150 rounded-full flex items-center justify-center mx-auto text-gray-500">
                <BuildingOffice2Icon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">No Buildings Registered</h3>
                <p className="text-gray-500 text-sm">
                  You haven&apos;t added any buildings yet. Create your first building to group your listings and automatically synchronize locations.
                </p>
              </div>
              <Link
                href="/buildings/new"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                Add Your First Building
              </Link>
            </div>
          </div>
        )}
      </div>
  );
}
