"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adConfigApi, helperApi, AdDisplayConfig } from "@/lib/api";
import {
  BanknotesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const CONFIG_KEYS = {
  HELPER_B2C_ENABLED: {
    key: "HELPER_B2C_ENABLED",
    label: "Helper B2C Enabled",
    description: "Turn live helper withdrawals on or off.",
    type: "boolean",
  },
  HELPER_B2C_SHORTCODE: {
    key: "HELPER_B2C_SHORTCODE",
    label: "B2C Shortcode",
    description: "The M-Pesa B2C business shortcode.",
    type: "text",
    placeholder: "600000",
  },
  HELPER_B2C_INITIATOR_NAME: {
    key: "HELPER_B2C_INITIATOR_NAME",
    label: "Initiator Name",
    description: "B2C initiator username configured on Safaricom.",
    type: "text",
    placeholder: "helper-payout",
  },
  HELPER_B2C_SECURITY_CREDENTIAL: {
    key: "HELPER_B2C_SECURITY_CREDENTIAL",
    label: "Security Credential",
    description: "Encrypted B2C security credential used by the backend.",
    type: "password",
    placeholder: "Paste encrypted credential",
  },
  HELPER_B2C_TIMEOUT_URL: {
    key: "HELPER_B2C_TIMEOUT_URL",
    label: "Timeout URL",
    description: "Webhook called if the B2C transfer times out.",
    type: "text",
    placeholder: "https://api.example.com/api/mpesa/b2c/timeout",
  },
  HELPER_B2C_RESULT_URL: {
    key: "HELPER_B2C_RESULT_URL",
    label: "Result URL",
    description: "Webhook called after the B2C transfer is processed.",
    type: "text",
    placeholder: "https://api.example.com/api/mpesa/b2c/result",
  },
} as const;

type ConfigItem = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS] & {
  placeholder?: string;
};

type HelperDashboard = {
  balance?: number;
  totalEarned?: number;
  withdrawals?: HelperWithdrawalView[];
};

type HelperWithdrawalView = {
  id?: number;
  amountRequested?: number;
  amountDisbursed?: number;
  platformFee?: number;
  withholdingTax?: number;
  mpesaFee?: number;
  status?: "PENDING" | "COMPLETED" | "FAILED";
  payoutPhoneNumber?: string;
  mpesaReceiptNumber?: string;
  failureReason?: string;
  requestedAt?: string;
  processedAt?: string;
};

function formatMoney(value?: number) {
  return `KES ${(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatStatus(status?: HelperWithdrawalView["status"]) {
  if (status === "COMPLETED") return "Completed";
  if (status === "FAILED") return "Failed";
  return "Pending";
}

function getStatusStyles(status?: HelperWithdrawalView["status"]) {
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "FAILED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function formatDate(value?: string) {
  if (!value) return "Not processed yet";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function SetupCard({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: "done" | "active" | "pending";
}) {
  const styles = {
    done: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
  }[status];

  const Icon = status === "done" ? CheckCircleIcon : status === "active" ? ShieldCheckIcon : ExclamationTriangleIcon;

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white/70 border border-current/10">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm opacity-90 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ConfigToggle({
  config,
  value,
  onToggle,
  saving,
}: {
  config: ConfigItem;
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
          isEnabled ? "bg-blue-500" : "bg-gray-300"
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

function ConfigInput({
  config,
  value,
  onSave,
  saving,
}: {
  config: ConfigItem;
  value: string;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    if (isDirty) onSave(inputValue);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="mb-2">
        <h3 className="font-medium text-gray-900">{config.label}</h3>
        <p className="text-sm text-gray-500">{config.description}</p>
      </div>
      <div className="flex gap-2">
        <input
          type={config.type === "password" ? "password" : "text"}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsDirty(e.target.value !== value);
          }}
          placeholder={config.placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            isDirty && !saving
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function HelperPayoutSetupPage() {
  const router = useRouter();
  const { user, isSuperAdmin, isLoading: authLoading, isAuthenticated } = useAuth();
  const [config, setConfig] = useState<AdDisplayConfig>({});
  const [dashboard, setDashboard] = useState<HelperDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const [cfg, data] = await Promise.all([adConfigApi.getConfig(), helperApi.getDashboard()]);
        setConfig(cfg);
        setDashboard(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load payout setup status");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const feeExample = useMemo(() => {
    const amount = 1000;
    const platformFee = amount * 0.1;
    const wht = amount * 0.05;
    const mpesaFee = 50;
    return {
      amount,
      platformFee,
      wht,
      mpesaFee,
      net: amount - platformFee - wht - mpesaFee,
    };
  }, []);

  const withdrawals = useMemo(() => dashboard?.withdrawals ?? [], [dashboard]);
  const withdrawalSummary = useMemo(() => {
    return withdrawals.reduce(
      (acc, withdrawal) => {
        if (withdrawal.status === "COMPLETED") acc.completed += 1;
        else if (withdrawal.status === "FAILED") acc.failed += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, completed: 0, failed: 0 },
    );
  }, [withdrawals]);

  const recentWithdrawals = useMemo(() => {
    return [...withdrawals]
      .sort((left, right) => {
        const leftTime = left.requestedAt ? new Date(left.requestedAt).getTime() : 0;
        const rightTime = right.requestedAt ? new Date(right.requestedAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 6);
  }, [withdrawals]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(key);
      setError("");
      await adConfigApi.updateConfig(key, value);
      setConfig((prev) => ({ ...prev, [key]: value }));
      setSuccess(`Updated ${key} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to update ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (key: string, currentValue: string) => {
    await handleSave(key, currentValue === "true" ? "false" : "true");
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || (!isSuperAdmin && user?.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <BanknotesIcon className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helper B2C Setup</h1>
            <p className="text-sm text-gray-500">Configure the M-Pesa withdrawal pipeline used by helper payouts.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/helper"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Open Helper Dashboard
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Withdrawal endpoint</p>
              <p className="mt-2 font-mono text-sm text-gray-900 break-all">POST /helper/withdraw</p>
              <button
                onClick={() => copyText("/helper/withdraw", "endpoint")}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {copied === "endpoint" ? "Copied" : "Copy endpoint"}
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Current mode</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {config[CONFIG_KEYS.HELPER_B2C_ENABLED.key] === "true" ? "B2C enabled" : "B2C disabled"}
              </p>
              <p className="mt-2 text-xs text-gray-500">This switch controls whether the backend should allow live payouts.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Visible to</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Helpers, services, admins</p>
              <p className="mt-2 text-xs text-gray-500">Admin roles can inspect the same withdrawal data path.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live helper snapshot</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Balance</span>
              <span className="font-semibold text-gray-900">KES {dashboard?.balance?.toLocaleString?.() ?? "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span>Lifetime earned</span>
              <span className="font-semibold text-gray-900">KES {dashboard?.totalEarned?.toLocaleString?.() ?? "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span>Withdrawals</span>
              <span className="font-semibold text-gray-900">{withdrawals.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Withdrawal status</h2>
            <p className="text-sm text-gray-500">Track pending, completed, and failed helper payouts from the same admin surface.</p>
          </div>
          <div className="text-sm text-gray-500">
            {withdrawals.length === 0 ? "No withdrawals recorded yet" : `${withdrawals.length} total withdrawal${withdrawals.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{withdrawalSummary.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Completed</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{withdrawalSummary.completed}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs uppercase tracking-wide text-red-700">Failed</p>
            <p className="mt-2 text-2xl font-bold text-red-900">{withdrawalSummary.failed}</p>
          </div>
        </div>

        {recentWithdrawals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
            Withdrawals will appear here once helpers request payouts.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Requested</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Net</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Payout phone</th>
                    <th className="px-4 py-3 text-left font-medium">Receipt / reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id ?? `${withdrawal.requestedAt ?? "withdrawal"}-${withdrawal.payoutPhoneNumber ?? "na"}`}>
                      <td className="px-4 py-3 text-gray-600">{formatDate(withdrawal.requestedAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(withdrawal.amountRequested)}</td>
                      <td className="px-4 py-3 text-gray-900">{formatMoney(withdrawal.amountDisbursed)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(withdrawal.status)}`}>
                          {formatStatus(withdrawal.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{withdrawal.payoutPhoneNumber || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {withdrawal.status === "COMPLETED"
                          ? withdrawal.mpesaReceiptNumber || "Recorded"
                          : withdrawal.failureReason || "Awaiting callback"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SetupCard
          title="Earnings accrual"
          description="Helper jobs increase helper balance and total earned inside the backend."
          status="done"
        />
        <SetupCard
          title="Withdrawal request"
          description="The helper dashboard submits a withdrawal request through the authenticated /helper/withdraw endpoint."
          status="active"
        />
        <SetupCard
          title="B2C disbursement"
          description="These settings feed the provider integration that should execute the actual M-Pesa transfer."
          status="pending"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">B2C provider settings</h2>
            <p className="text-sm text-gray-500">Store the credentials and callback URLs used by helper withdrawals.</p>
          </div>

          <ConfigToggle
            key={`${CONFIG_KEYS.HELPER_B2C_ENABLED.key}:${config[CONFIG_KEYS.HELPER_B2C_ENABLED.key] || "false"}`}
            config={CONFIG_KEYS.HELPER_B2C_ENABLED}
            value={config[CONFIG_KEYS.HELPER_B2C_ENABLED.key] || "false"}
            onToggle={() => handleToggle(CONFIG_KEYS.HELPER_B2C_ENABLED.key, config[CONFIG_KEYS.HELPER_B2C_ENABLED.key] || "false")}
            saving={saving === CONFIG_KEYS.HELPER_B2C_ENABLED.key}
          />
          <ConfigInput
            key={`${CONFIG_KEYS.HELPER_B2C_SHORTCODE.key}:${config[CONFIG_KEYS.HELPER_B2C_SHORTCODE.key] || ""}`}
            config={CONFIG_KEYS.HELPER_B2C_SHORTCODE}
            value={config[CONFIG_KEYS.HELPER_B2C_SHORTCODE.key] || ""}
            onSave={(value) => handleSave(CONFIG_KEYS.HELPER_B2C_SHORTCODE.key, value)}
            saving={saving === CONFIG_KEYS.HELPER_B2C_SHORTCODE.key}
          />
          <ConfigInput
            key={`${CONFIG_KEYS.HELPER_B2C_INITIATOR_NAME.key}:${config[CONFIG_KEYS.HELPER_B2C_INITIATOR_NAME.key] || ""}`}
            config={CONFIG_KEYS.HELPER_B2C_INITIATOR_NAME}
            value={config[CONFIG_KEYS.HELPER_B2C_INITIATOR_NAME.key] || ""}
            onSave={(value) => handleSave(CONFIG_KEYS.HELPER_B2C_INITIATOR_NAME.key, value)}
            saving={saving === CONFIG_KEYS.HELPER_B2C_INITIATOR_NAME.key}
          />
          <ConfigInput
            key={`${CONFIG_KEYS.HELPER_B2C_SECURITY_CREDENTIAL.key}:${config[CONFIG_KEYS.HELPER_B2C_SECURITY_CREDENTIAL.key] || ""}`}
            config={CONFIG_KEYS.HELPER_B2C_SECURITY_CREDENTIAL}
            value={config[CONFIG_KEYS.HELPER_B2C_SECURITY_CREDENTIAL.key] || ""}
            onSave={(value) => handleSave(CONFIG_KEYS.HELPER_B2C_SECURITY_CREDENTIAL.key, value)}
            saving={saving === CONFIG_KEYS.HELPER_B2C_SECURITY_CREDENTIAL.key}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Callback endpoints</h2>
            <p className="text-sm text-gray-500">Point M-Pesa B2C callbacks to the backend webhook URLs.</p>
          </div>

          <ConfigInput
            key={`${CONFIG_KEYS.HELPER_B2C_TIMEOUT_URL.key}:${config[CONFIG_KEYS.HELPER_B2C_TIMEOUT_URL.key] || ""}`}
            config={CONFIG_KEYS.HELPER_B2C_TIMEOUT_URL}
            value={config[CONFIG_KEYS.HELPER_B2C_TIMEOUT_URL.key] || ""}
            onSave={(value) => handleSave(CONFIG_KEYS.HELPER_B2C_TIMEOUT_URL.key, value)}
            saving={saving === CONFIG_KEYS.HELPER_B2C_TIMEOUT_URL.key}
          />
          <ConfigInput
            key={`${CONFIG_KEYS.HELPER_B2C_RESULT_URL.key}:${config[CONFIG_KEYS.HELPER_B2C_RESULT_URL.key] || ""}`}
            config={CONFIG_KEYS.HELPER_B2C_RESULT_URL}
            value={config[CONFIG_KEYS.HELPER_B2C_RESULT_URL.key] || ""}
            onSave={(value) => handleSave(CONFIG_KEYS.HELPER_B2C_RESULT_URL.key, value)}
            saving={saving === CONFIG_KEYS.HELPER_B2C_RESULT_URL.key}
          />

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Save the keys here first, then wire the backend withdrawal service to consume these values.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee breakdown example</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Requested amount</span><span className="font-medium">KES {feeExample.amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Platform fee (10%)</span><span className="font-medium text-red-600">- KES {feeExample.platformFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Withholding tax (5%)</span><span className="font-medium text-red-600">- KES {feeExample.wht.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">M-Pesa fee</span><span className="font-medium text-red-600">- KES {feeExample.mpesaFee.toFixed(2)}</span></div>
            <div className="border-t pt-3 flex justify-between text-base font-bold text-gray-900">
              <span>Net payout</span>
              <span>KES {feeExample.net.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup checklist</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" /><span>RealAdmin stores B2C settings in the same config store used by ad settings.</span></li>
            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" /><span>Helper dashboard already exposes withdraw controls.</span></li>
            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" /><span>Backend persists withdrawal records in <span className="font-mono">helper_withdrawals</span>.</span></li>
            <li className="flex items-start gap-3"><ClipboardDocumentIcon className="h-5 w-5 text-blue-600 mt-0.5" /><span>Use this page to manage provider keys before turning payouts on.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}