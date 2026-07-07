"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { servicesApi, helperJobsApi, locationsApi, SERVICE_CATEGORIES } from "@/lib/api";
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function ServicesDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState("");
  const [serviceCategory, setServiceCategory] = useState(SERVICE_CATEGORIES[0]);
  
  // Location mode & fields
  const [serviceAreaMode, setServiceAreaMode] = useState<"ADMIN_AREAS" | "RADIUS">("ADMIN_AREAS");
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(10);
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Wards & County fields
  const [countyInput, setCountyInput] = useState("");
  const [coverageLevel, setCoverageLevel] = useState("COUNTY");
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [locationTree, setLocationTree] = useState<any>(null);
  
  // Offered Services Catalog
  const [offeredServices, setOfferedServices] = useState<string[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect if not authenticated or if primaryRole belongs to another dashboard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isSuperAdmin && user?.primaryRole && user.primaryRole !== "services") {
        router.push(user.primaryRole === "helper" ? "/helper" : "/");
      }
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, user?.primaryRole, router]);

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await servicesApi.getDashboard();
      setData(res);
      setPriceInput(res.helperPrice?.toString() || "");
      if (res.serviceCategory && SERVICE_CATEGORIES.includes(res.serviceCategory)) {
        setServiceCategory(res.serviceCategory);
      } else if (res.serviceCategory) {
        setServiceCategory(res.serviceCategory);
      }
      setCoverageLevel(res.helperCoverageLevel || "COUNTY");
      setCountyInput(res.helperCounty || "");
      setConstituencies(res.helperConstituencies || []);
      setWards(res.helperWards || []);
      
      setServiceAreaMode(res.serviceAreaMode || "ADMIN_AREAS");
      setServiceRadiusKm(res.serviceRadiusKm || 10);
      setLocationLatitude(res.locationLatitude || null);
      setLocationLongitude(res.locationLongitude || null);
      setOfferedServices(res.offeredServices || []);
      
      const jobsRes = await helperJobsApi.getHelperJobs();
      setJobs(Array.isArray(jobsRes) ? jobsRes : (jobsRes?.content || []));

      const tree = await locationsApi.getTree();
      setLocationTree(tree);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePinLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLatitude(position.coords.latitude);
          setLocationLongitude(position.coords.longitude);
          setIsLocating(false);
          setMessage({ type: "success", text: "GPS location pinned! Remember to click Save Service Profile." });
        },
        (error) => {
          setIsLocating(false);
          setMessage({ type: "error", text: `Could not get location: ${error.message}` });
        }
      );
    } else {
      setIsLocating(false);
      setMessage({ type: "error", text: "Geolocation is not supported by your browser" });
    }
  };

  const handleAddServiceItem = () => {
    if (!newServiceName.trim()) return;
    const formatted = newServicePrice.trim()
      ? `${newServiceName.trim()} - KES ${newServicePrice.trim()}`
      : newServiceName.trim();
    setOfferedServices([...offeredServices, formatted]);
    setNewServiceName("");
    setNewServicePrice("");
  };

  const handleRemoveServiceItem = (indexToRemove: number) => {
    setOfferedServices(offeredServices.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage(null);
    try {
      const parsed = parseFloat(priceInput);
      if (isNaN(parsed) || parsed < 0) throw new Error("Invalid rate");
      await servicesApi.updateProfile({ 
        price: parsed, 
        county: countyInput,
        coverageLevel,
        constituencies,
        wards,
        serviceCategory,
        serviceAreaMode,
        serviceRadiusKm: serviceAreaMode === "RADIUS" ? serviceRadiusKm : undefined,
        locationLatitude: locationLatitude || undefined,
        locationLongitude: locationLongitude || undefined,
        offeredServices,
      });
      setMessage({ type: "success", text: "Service settings and catalog updated successfully!" });
      fetchDashboard();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  if (!isSuperAdmin && user?.primaryRole !== "services" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return (
      <div className="p-8 text-center text-red-600 flex flex-col items-center">
        <p className="text-lg font-bold mb-2">You do not have access to the Services Dashboard.</p>
        <p className="text-sm text-gray-500">Your current role is: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user?.primaryRole || user?.role || 'undefined'}</span></p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
              {serviceCategory || "Service Provider"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Services Dashboard</h1>
          <p className="text-gray-600">Manage your service offerings, rates, location coverage, and service requests.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><CurrencyDollarIcon className="w-6 h-6 text-emerald-600" /></div>
            <h3 className="text-gray-600 font-medium">Available Balance</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">KES {data?.balance?.toLocaleString() || "0.00"}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><BanknotesIcon className="w-6 h-6 text-green-600" /></div>
            <h3 className="text-gray-600 font-medium">Lifetime Earned</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">KES {data?.totalEarned?.toLocaleString() || "0.00"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actions Column */}
        <div className="space-y-8">
          {/* Set Service Settings */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Profile & Location Coverage</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-gray-900"
                  required
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Rate / Callout Fee (KES)</label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 1000"
                  required
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Coverage Mode</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full mb-4">
                  <button
                    type="button"
                    onClick={() => setServiceAreaMode("ADMIN_AREAS")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                      serviceAreaMode === "ADMIN_AREAS" ? "bg-white shadow-sm text-emerald-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Wards & County
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceAreaMode("RADIUS")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                      serviceAreaMode === "RADIUS" ? "bg-white shadow-sm text-emerald-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Pin Location & Radius
                  </button>
                </div>

                {serviceAreaMode === "RADIUS" ? (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">GPS Coordinates</h4>
                          <p className="text-xs text-gray-500">
                            {locationLatitude && locationLongitude 
                              ? `Pinned: ${locationLatitude.toFixed(4)}, ${locationLongitude.toFixed(4)}`
                              : "No location pinned yet"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handlePinLocation}
                        disabled={isLocating}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isLocating ? "Locating..." : "Pin My Location"}
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <MapPicker
                        latitude={locationLatitude || -1.2921}
                        longitude={locationLongitude || 36.8219}
                        onChange={(lat, lng) => {
                          setLocationLatitude(lat);
                          setLocationLongitude(lng);
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Click anywhere on the map to manually pin your exact location, or use "Pin My Location" above for GPS auto-detection.
                    </p>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        <span>Service Radius</span>
                        <span className="text-emerald-700 font-bold">{serviceRadiusKm} km</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        step="1"
                        value={serviceRadiusKm}
                        onChange={(e) => setServiceRadiusKm(parseInt(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>2 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Hierarchy</label>
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-full mb-4">
                        {['COUNTY', 'CONSTITUENCY', 'WARD'].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setCoverageLevel(level)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                              coverageLevel === level ? "bg-white shadow-sm text-emerald-900" : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your County {coverageLevel === 'COUNTY' && "(Max 1)"}</label>
                      <select
                        value={countyInput}
                        onChange={(e) => {
                          setCountyInput(e.target.value);
                          setConstituencies([]);
                          setWards([]);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        required={serviceAreaMode === "ADMIN_AREAS"}
                      >
                        <option value="">Select County...</option>
                        {locationTree?.counties?.map((c: string) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {coverageLevel === 'CONSTITUENCY' && countyInput && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Constituencies (Max 2)</label>
                        <select
                          multiple
                          value={constituencies}
                          onChange={(e) => {
                            const opts = Array.from(e.target.selectedOptions, option => option.value);
                            if (opts.length <= 2) setConstituencies(opts);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white min-h-[100px]"
                        >
                          {locationTree?.constituenciesByCounty[countyInput]?.map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold CMD/CTRL to select multiple</p>
                      </div>
                    )}

                    {coverageLevel === 'WARD' && countyInput && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Wards (Max 5)</label>
                        <select
                          multiple
                          value={wards}
                          onChange={(e) => {
                            const opts = Array.from(e.target.selectedOptions, option => option.value);
                            if (opts.length <= 5) setWards(opts);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white min-h-[150px]"
                        >
                          {locationTree?.constituenciesByCounty[countyInput]?.map((c: string) => (
                            <optgroup key={c} label={c}>
                              {locationTree?.wardsByConstituency[c]?.map((w: string) => (
                                <option key={w} value={w}>{w}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold CMD/CTRL to select multiple</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {profileLoading ? "Saving..." : "Save Service Profile"}
              </button>
            </form>
          </div>

          {/* Offered Products & Services Catalog */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Offered Services & Pricing Catalog</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add specific items or services you provide along with rates (e.g. "13kg Gas Refill - KES 1500" or "Sofa Cleaning - KES 2500").
            </p>
            
            <div className="space-y-3 mb-4">
              {offeredServices.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                  No specific items added to your catalog yet. Add your first offering below!
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {offeredServices.map((item, idx) => (
                    <li key={idx} className="p-3.5 bg-gray-50/50 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceItem(idx)}
                        className="text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Item / Service Name (e.g. Carpet Cleaning)"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddServiceItem();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <input
                type="number"
                placeholder="Price (KES)"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddServiceItem();
                  }
                }}
                className="w-28 px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddServiceItem}
                disabled={!newServiceName.trim()}
                className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              💡 Tip: After adding or removing items, click <span className="font-semibold text-gray-600">"Save Service Profile"</span> above to publish changes.
            </p>
          </div>
        </div>

        {/* Data Column */}
        <div className="space-y-8">
          {/* Active Jobs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <BriefcaseIcon className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Service Requests & Jobs</h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] p-0">
              {(Array.isArray(jobs) ? jobs : []).length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">No service requests yet</p>
                  <p className="text-xs text-gray-400 mt-1">When clients hire you or book your services, they will appear here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(Array.isArray(jobs) ? jobs : []).map((job: any) => (
                    <li key={job.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900 text-base">
                          {job.description || serviceCategory || "Service Request"}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          job.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                          job.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                          job.status === "DISPUTED" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Client:</span> {job.client?.firstName} {job.client?.lastName}
                          <br />
                          <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="font-extrabold text-emerald-600 text-lg">
                          KES {job.amount?.toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
