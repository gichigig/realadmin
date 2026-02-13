"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adConfigApi, AdDisplayConfig } from "@/lib/api";
import SponsoredAdsManager from "@/components/SponsoredAdsManager";
import {
  Cog6ToothIcon,
  ClockIcon,
  ListBulletIcon,
  PlayIcon,
  MapPinIcon,
  MegaphoneIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const CONFIG_KEYS = {
  RENTAL_FEED_INTERVALS: {
    key: "RENTAL_FEED_INTERVALS",
    label: "Rental Feed Ad Positions",
    description: "Comma-separated positions in the feed where ads appear (e.g., 5,10,15,20)",
    type: "text",
    placeholder: "5,10,15,20"
  },
  LAUNCH_AD_ENABLED: {
    key: "LAUNCH_AD_ENABLED",
    label: "App Launch Ads Enabled",
    description: "Show full-screen ads when users open the app",
    type: "boolean"
  },
  FILTER_AD_ENABLED: {
    key: "FILTER_AD_ENABLED",
    label: "Location Filter Ads Enabled",
    description: "Show ads in the location filter/selection screen",
    type: "boolean"
  },
  SPONSORED_ADS_ENABLED: {
    key: "SPONSORED_ADS_ENABLED",
    label: "Sponsored Ads Enabled",
    description: "Allow sponsored ads to receive boosted selection probability",
    type: "boolean"
  },
  SPONSORED_MULTIPLIER: {
    key: "SPONSORED_MULTIPLIER",
    label: "Sponsored Ad Multiplier",
    description: "How many times more likely sponsored ads appear vs regular ads (e.g., 3.0 = 3x more likely)",
    type: "number",
    placeholder: "3.0"
  },
  LAUNCH_AD_COOLDOWN_MINUTES: {
    key: "LAUNCH_AD_COOLDOWN_MINUTES",
    label: "Launch Ad Cooldown (minutes)",
    description: "Minimum time between app launch ads for each user",
    type: "number",
    placeholder: "30"
  }
};

export default function AdSettingsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const [config, setConfig] = useState<AdDisplayConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"display" | "sponsored">("display");

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/");
    }
  }, [authLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchConfig();
    }
  }, [isSuperAdmin]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await adConfigApi.getConfig();
      setConfig(data);
    } catch (err) {
      setError("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(key);
      setError("");
      await adConfigApi.updateConfig(key, value);
      setConfig(prev => ({ ...prev, [key]: value }));
      setSuccess(`Updated ${key} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to update ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    await handleSave(key, newValue);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ad Display Settings</h1>
              <p className="text-gray-600">Configure how ads are displayed in the app</p>
            </div>
          </div>
          <Link
            href="/super-admin/ad-analytics"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
          >
            <ArrowTrendingUpIcon className="h-5 w-5" />
            View Analytics
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab("display")}
            className={`pb-3 text-sm font-medium border-b-2 ${
              activeTab === "display"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Display Rules
          </button>
          <button
            onClick={() => setActiveTab("sponsored")}
            className={`pb-3 text-sm font-medium border-b-2 ${
              activeTab === "sponsored"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Sponsored Ads
          </button>
        </nav>
      </div>

      {activeTab === "display" ? (
        <div className="space-y-6">
          {/* App Launch Ads */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <PlayIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">App Launch Ads</h2>
            </div>
            <div className="space-y-4">
              <ConfigToggle
                config={CONFIG_KEYS.LAUNCH_AD_ENABLED}
                value={config[CONFIG_KEYS.LAUNCH_AD_ENABLED.key] || "true"}
                onToggle={() =>
                  handleToggle(
                    CONFIG_KEYS.LAUNCH_AD_ENABLED.key,
                    config[CONFIG_KEYS.LAUNCH_AD_ENABLED.key] || "true"
                  )
                }
                saving={saving === CONFIG_KEYS.LAUNCH_AD_ENABLED.key}
              />
              <ConfigInput
                config={CONFIG_KEYS.LAUNCH_AD_COOLDOWN_MINUTES}
                value={config[CONFIG_KEYS.LAUNCH_AD_COOLDOWN_MINUTES.key] || "30"}
                onSave={(value) =>
                  handleSave(CONFIG_KEYS.LAUNCH_AD_COOLDOWN_MINUTES.key, value)
                }
                saving={saving === CONFIG_KEYS.LAUNCH_AD_COOLDOWN_MINUTES.key}
              />
            </div>
          </div>

          {/* Rental Feed Ads */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <ListBulletIcon className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Rental Feed Ads</h2>
            </div>
            <div className="space-y-4">
              <ConfigInput
                config={CONFIG_KEYS.RENTAL_FEED_INTERVALS}
                value={config[CONFIG_KEYS.RENTAL_FEED_INTERVALS.key] || "5,10,15,20"}
                onSave={(value) => handleSave(CONFIG_KEYS.RENTAL_FEED_INTERVALS.key, value)}
                saving={saving === CONFIG_KEYS.RENTAL_FEED_INTERVALS.key}
              />
            </div>
          </div>

          {/* Location Filter Ads */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPinIcon className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Location Filter Ads</h2>
            </div>
            <div className="space-y-4">
              <ConfigToggle
                config={CONFIG_KEYS.FILTER_AD_ENABLED}
                value={config[CONFIG_KEYS.FILTER_AD_ENABLED.key] || "true"}
                onToggle={() =>
                  handleToggle(
                    CONFIG_KEYS.FILTER_AD_ENABLED.key,
                    config[CONFIG_KEYS.FILTER_AD_ENABLED.key] || "true"
                  )
                }
                saving={saving === CONFIG_KEYS.FILTER_AD_ENABLED.key}
              />
            </div>
          </div>

          {/* Sponsored Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="h-6 w-6 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Sponsored Ads Engine</h2>
            </div>
            <div className="space-y-4">
              <ConfigToggle
                config={CONFIG_KEYS.SPONSORED_ADS_ENABLED}
                value={config[CONFIG_KEYS.SPONSORED_ADS_ENABLED.key] || "true"}
                onToggle={() =>
                  handleToggle(
                    CONFIG_KEYS.SPONSORED_ADS_ENABLED.key,
                    config[CONFIG_KEYS.SPONSORED_ADS_ENABLED.key] || "true"
                  )
                }
                saving={saving === CONFIG_KEYS.SPONSORED_ADS_ENABLED.key}
              />
              <ConfigInput
                config={CONFIG_KEYS.SPONSORED_MULTIPLIER}
                value={config[CONFIG_KEYS.SPONSORED_MULTIPLIER.key] || "3.0"}
                onSave={(value) => handleSave(CONFIG_KEYS.SPONSORED_MULTIPLIER.key, value)}
                saving={saving === CONFIG_KEYS.SPONSORED_MULTIPLIER.key}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <MegaphoneIcon className="h-5 w-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-gray-700">
                Select which ads are sponsored, choose where they appear in the Flutter app
                by placement, and target specific counties or constituencies.
              </p>
            </div>
          </div>
          <SponsoredAdsManager />
        </div>
      )}
    </div>
  );
}

// Toggle component for boolean configs
function ConfigToggle({
  config,
  value,
  onToggle,
  saving,
}: {
  config: typeof CONFIG_KEYS.LAUNCH_AD_ENABLED;
  value: string;
  onToggle: () => void;
  saving: boolean;
}) {
  const isEnabled = value === "true";

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <h3 className="font-medium text-gray-900">{config.label}</h3>
        <p className="text-sm text-gray-500">{config.description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled ? "bg-amber-500" : "bg-gray-300"
        } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// Input component for text/number configs
function ConfigInput({
  config,
  value,
  onSave,
  saving,
}: {
  config: typeof CONFIG_KEYS.RENTAL_FEED_INTERVALS;
  value: string;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setInputValue(value);
    setIsDirty(false);
  }, [value]);

  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    setIsDirty(newValue !== value);
  };

  const handleSave = () => {
    if (isDirty) {
      onSave(inputValue);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="mb-2">
        <h3 className="font-medium text-gray-900">{config.label}</h3>
        <p className="text-sm text-gray-500">{config.description}</p>
      </div>
      <div className="flex gap-2">
        <input
          type={config.type === "number" ? "number" : "text"}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={config.placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            isDirty && !saving
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
