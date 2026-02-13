"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Advertisement,
  sponsoredAdsApi,
  SponsoredAdSettingsRequest,
} from "@/lib/api";
import { constituenciesByCounty, counties } from "@/lib/kenya-locations";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

const PLACEMENTS: Advertisement["placement"][] = [
  "HOME_BANNER",
  "HOME_FEED",
  "LISTING_DETAIL",
  "SEARCH_RESULTS",
  "INTERSTITIAL",
  "SPLASH",
  "APP_LAUNCH",
  "RENTAL_FEED",
  "LOCATION_FILTER",
];

const formatPlacement = (value: string) => value.replace(/_/g, " ");

const asList = (value: Advertisement["targetCounties"] | Advertisement["targetConstituencies"]) =>
  Array.isArray(value) ? value : [];

export default function SponsoredAdsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [filterSponsored, setFilterSponsored] = useState<"" | "true" | "false">("");
  const [filterPlacement, setFilterPlacement] = useState<"" | Advertisement["placement"]>("");

  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [form, setForm] = useState<SponsoredAdSettingsRequest>({});

  const constituencyOptions = useMemo(() => {
    if (form.isNationwide) return [];
    const selectedCounties = form.targetCounties ?? [];
    if (selectedCounties.length === 0) {
      return Object.values(constituenciesByCounty).flat().sort();
    }
    return selectedCounties
      .flatMap((county) => constituenciesByCounty[county] ?? [])
      .sort();
  }, [form.isNationwide, form.targetCounties]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await sponsoredAdsApi.list({
        page,
        size,
        search: search || undefined,
        sponsored: filterSponsored === "" ? undefined : filterSponsored === "true",
        placement: filterPlacement || undefined,
      });
      setAds(result.content);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sponsored ads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [page, size, filterSponsored, filterPlacement]);

  const openEditor = (ad: Advertisement) => {
    setEditingAd(ad);
    setForm({
      sponsored: Boolean(ad.sponsored),
      sponsorshipMultiplier: ad.sponsorshipMultiplier ?? 1,
      placement: ad.placement,
      priority: ad.priority ?? 0,
      active: ad.active,
      isNationwide: ad.isNationwide ?? true,
      targetCounties: asList(ad.targetCounties),
      targetConstituencies: asList(ad.targetConstituencies),
      locationInstructions: ad.locationInstructions ?? "",
    });
  };

  const closeEditor = () => {
    setEditingAd(null);
    setForm({});
  };

  const handleSave = async () => {
    if (!editingAd) return;
    try {
      setSaving(true);
      setError("");
      const payload: SponsoredAdSettingsRequest = {
        ...form,
        sponsorshipMultiplier: form.sponsorshipMultiplier ?? 1,
        targetCounties: form.isNationwide ? [] : form.targetCounties ?? [],
        targetConstituencies: form.isNationwide ? [] : form.targetConstituencies ?? [],
      };
      await sponsoredAdsApi.update(editingAd.id, payload);
      setSuccess("Sponsored ad settings updated");
      closeEditor();
      await fetchAds();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sponsored settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ad title or business..."
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={filterSponsored}
            onChange={(e) => {
              setFilterSponsored(e.target.value as "" | "true" | "false");
              setPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Sponsorship</option>
            <option value="true">Sponsored Only</option>
            <option value="false">Non-Sponsored</option>
          </select>
          <select
            value={filterPlacement}
            onChange={(e) => {
              setFilterPlacement(e.target.value as "" | Advertisement["placement"]);
              setPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Placements</option>
            {PLACEMENTS.map((placement) => (
              <option key={placement} value={placement}>
                {formatPlacement(placement)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(0);
                fetchAds();
              }}
              className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Apply
            </button>
            <button
              onClick={fetchAds}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No ads found for the selected filters.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sponsored</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{ad.title}</div>
                    <div className="text-xs text-gray-500">
                      Priority {ad.priority} | {ad.active ? "Active" : "Paused"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ad.advertiserName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatPlacement(ad.placement)}</td>
                  <td className="px-4 py-3">
                    {ad.isNationwide ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                        <GlobeAltIcon className="h-4 w-4" /> Nationwide
                      </span>
                    ) : (
                      <span className="text-xs text-gray-700">
                        {(asList(ad.targetCounties).length || 0)} counties,{" "}
                        {(asList(ad.targetConstituencies).length || 0)} constituencies
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ad.sponsored ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                        <CheckCircleIcon className="h-4 w-4" /> {ad.sponsorshipMultiplier ?? 1}x
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        <XCircleIcon className="h-4 w-4" /> Off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditor(ad)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
          className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {totalPages === 0 ? 0 : page + 1} of {Math.max(totalPages, 1)}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages - 1, 0)))}
          disabled={page >= totalPages - 1 || totalPages === 0}
          className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {editingAd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MegaphoneIcon className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Configure Sponsored Ad</h3>
              </div>
              <button onClick={closeEditor} className="text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="font-medium text-gray-900">{editingAd.title}</p>
                <p className="text-sm text-gray-500">{editingAd.advertiserName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">Sponsored Enabled</span>
                  <input
                    type="checkbox"
                    checked={Boolean(form.sponsored)}
                    onChange={(e) => setForm((prev) => ({ ...prev, sponsored: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">Ad Active</span>
                  <input
                    type="checkbox"
                    checked={Boolean(form.active)}
                    onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                  <select
                    value={form.placement ?? "HOME_BANNER"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        placement: e.target.value as Advertisement["placement"],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {PLACEMENTS.map((placement) => (
                      <option key={placement} value={placement}>
                        {formatPlacement(placement)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    min={0}
                    value={form.priority ?? 0}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sponsorship Multiplier
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.sponsorshipMultiplier ?? 1}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sponsorshipMultiplier: Number(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">Nationwide Delivery</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.isNationwide)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isNationwide: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>

              {!form.isNationwide && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Counties
                    </label>
                    <select
                      multiple
                      value={form.targetCounties ?? []}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          targetCounties: Array.from(e.target.selectedOptions).map(
                            (option) => option.value
                          ),
                        }))
                      }
                      className="w-full min-h-[180px] px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {counties.map((county) => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Constituencies
                    </label>
                    <select
                      multiple
                      value={form.targetConstituencies ?? []}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          targetConstituencies: Array.from(e.target.selectedOptions).map(
                            (option) => option.value
                          ),
                        }))
                      }
                      className="w-full min-h-[180px] px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {constituencyOptions.map((constituency) => (
                        <option key={constituency} value={constituency}>
                          {constituency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={form.locationInstructions ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      locationInstructions: e.target.value,
                    }))
                  }
                  placeholder="Optional text shown to users based on this region targeting."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditor}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
