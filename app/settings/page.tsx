"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { accountApi } from "@/lib/api";
import {
  UserCircleIcon,
  KeyIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  IdentificationIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface SecurityMethods {
  mfaEnabled: boolean;
  totpEnabled: boolean;
  passkeyEnabled: boolean;
  preferredMethod: "PASSKEY" | "TOTP" | "RECOVERY" | null;
  recoveryCodesRemaining: number;
  passkeys: Array<{ id: number; name: string; lastUsedAt?: string }>;
}

interface TotpSetupPayload {
  secretMasked: string;
  otpauthUri: string;
  qrPngBase64: string;
  setupToken: string;
  expiresAt?: string;
}

const decodeBase64Url = (value: string): ArrayBuffer => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const encodeBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const extractTotpSecretFromUri = (otpauthUri?: string): string => {
  if (!otpauthUri) return "";
  try {
    const parsed = new URL(otpauthUri);
    return parsed.searchParams.get("secret") || "";
  } catch {
    return "";
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser, logout } = useAuth();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
  
  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // MFA security state
  const [securityMethods, setSecurityMethods] = useState<SecurityMethods | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [totpSetup, setTotpSetup] = useState<TotpSetupPayload | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpConfirming, setTotpConfirming] = useState(false);
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[]>([]);
  const [recoveryCodesActionMessage, setRecoveryCodesActionMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : null;

  const loadSecurityMethods = async () => {
    if (!authHeaders) return;
    setSecurityError("");
    setSecurityLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/security/methods`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Failed to load security settings");
      }
      const data = (await response.json()) as SecurityMethods;
      setSecurityMethods(data);
      if (data.totpEnabled) {
        setTotpSetup(null);
        setTotpCode("");
      }
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to load security settings");
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const response = await accountApi.updateProfile({
        firstName,
        lastName,
        phone,
      });
      updateUser({
        firstName: response.firstName,
        lastName: response.lastName,
        phone: response.phone,
      });
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await accountApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await accountApi.deleteAccount();
      logout();
      router.push("/login");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const updatePreferredMethod = async (method: "PASSKEY" | "TOTP" | "RECOVERY") => {
    if (!authHeaders) return;
    setSecurityLoading(true);
    setSecurityError("");
    try {
      const response = await fetch(`${apiBase}/auth/security/preference`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ preferredMethod: method }),
      });
      if (!response.ok) {
        throw new Error("Failed to update preferred method");
      }
      await loadSecurityMethods();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to update preferred method");
      setSecurityLoading(false);
    }
  };

  const setupTotp = async () => {
    if (!authHeaders) return;
    setSecurityLoading(true);
    setSecurityError("");
    try {
      const setupResponse = await fetch(`${apiBase}/auth/security/totp/setup`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!setupResponse.ok) {
        throw new Error("Failed to start TOTP setup");
      }
      const setupData = (await setupResponse.json()) as TotpSetupPayload;
      setTotpSetup(setupData);
      setTotpCode("");
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to setup authenticator");
    } finally {
      setSecurityLoading(false);
    }
  };

  const confirmTotpSetup = async () => {
    if (!authHeaders || !totpSetup) return;
    if (!/^\d{6}$/.test(totpCode.trim())) {
      setSecurityError("Enter a valid 6-digit authenticator code");
      return;
    }

    setTotpConfirming(true);
    setSecurityError("");
    try {
      const confirmResponse = await fetch(`${apiBase}/auth/security/totp/confirm`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ setupToken: totpSetup.setupToken, code: totpCode.trim() }),
      });
      if (!confirmResponse.ok) {
        const errorBody = await confirmResponse.json().catch(() => ({} as { message?: string }));
        throw new Error(errorBody.message || "Invalid authenticator code");
      }

      setTotpSetup(null);
      setTotpCode("");
      await loadSecurityMethods();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to confirm authenticator");
    } finally {
      setTotpConfirming(false);
    }
  };

  const disableTotp = async () => {
    if (!authHeaders) return;
    const proof = window.prompt("Enter your password or current MFA proof to disable authenticator:");
    if (!proof) return;
    setSecurityLoading(true);
    setSecurityError("");
    try {
      const response = await fetch(`${apiBase}/auth/security/totp`, {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ passwordOrMfaProof: proof }),
      });
      if (!response.ok) {
        throw new Error("Failed to disable authenticator");
      }
      await loadSecurityMethods();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to disable authenticator");
      setSecurityLoading(false);
    }
  };

  const regenerateRecoveryCodes = async () => {
    if (!authHeaders) return;
    setSecurityLoading(true);
    setSecurityError("");
    try {
      const response = await fetch(`${apiBase}/auth/security/recovery-codes/regenerate`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate recovery codes");
      }
      const data = await response.json();
      const codes = Array.isArray(data.codes) ? data.codes.filter((value: unknown) => typeof value === "string") : [];
      if (codes.length === 0) {
        throw new Error("No recovery codes were returned");
      }
      setGeneratedRecoveryCodes(codes as string[]);
      setRecoveryCodesActionMessage("");
      await loadSecurityMethods();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to regenerate recovery codes");
      setSecurityLoading(false);
    }
  };

  const buildRecoveryCodesDocument = () => {
    const timestamp = new Date().toLocaleString();
    return [
      "RealAdmin Recovery Codes",
      `Generated: ${timestamp}`,
      "",
      "Each code can be used only once.",
      "Store these codes in a secure place.",
      "",
      ...generatedRecoveryCodes.map((code, index) => `${index + 1}. ${code}`),
      "",
    ].join("\n");
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(buildRecoveryCodesDocument());
      setRecoveryCodesActionMessage("Recovery codes copied to clipboard.");
    } catch {
      setRecoveryCodesActionMessage("Copy failed. Please use download instead.");
    }
  };

  const downloadRecoveryCodes = () => {
    const content = buildRecoveryCodesDocument();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateLabel = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `recovery-codes-${dateLabel}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setRecoveryCodesActionMessage("Recovery codes downloaded.");
  };

  const closeRecoveryCodesPage = () => {
    setGeneratedRecoveryCodes([]);
    setRecoveryCodesActionMessage("");
  };

  const registerPasskey = async () => {
    if (!authHeaders) return;
    if (!("credentials" in navigator) || !("PublicKeyCredential" in window)) {
      setSecurityError("Passkey not supported in this browser");
      return;
    }

    setSecurityLoading(true);
    setSecurityError("");
    try {
      const optionsResponse = await fetch(`${apiBase}/auth/security/passkeys/registration/options`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!optionsResponse.ok) {
        const errorBody = await optionsResponse.json().catch(() => ({} as { message?: string }));
        throw new Error(errorBody.message || "Failed to fetch passkey registration options");
      }
      const options = await optionsResponse.json();

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: decodeBase64Url(options.challenge),
        rp: {
          id: options.relyingParty.id,
          name: options.relyingParty.name,
        },
        user: {
          id: decodeBase64Url(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        timeout: options.timeout || 60000,
        attestation: "none",
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "preferred",
        },
        excludeCredentials: (options.excludeCredentials || []).map((item: any) => ({
          type: "public-key",
          id: decodeBase64Url(item.id),
          transports: item.transports,
        })),
      };

      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error("No passkey credential was created");
      }
      const responseData = credential.response as AuthenticatorAttestationResponse & {
        getPublicKey?: () => ArrayBuffer | null;
        getPublicKeyAlgorithm?: () => number;
      };
      const publicKeyBuffer = responseData.getPublicKey ? responseData.getPublicKey() : null;
      const publicKeyAlgorithm = responseData.getPublicKeyAlgorithm
        ? responseData.getPublicKeyAlgorithm()
        : null;
      if (!publicKeyBuffer || publicKeyAlgorithm == null) {
        throw new Error("Browser did not provide passkey public key metadata");
      }
      const verifyResponse = await fetch(`${apiBase}/auth/security/passkeys/registration/verify`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          registrationId: options.registrationId,
          registrationToken: options.registrationToken,
          name: window.prompt("Passkey name (optional)") || "",
          credential: {
            id: credential.id,
            rawId: encodeBase64Url(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: encodeBase64Url(responseData.clientDataJSON),
              attestationObject: encodeBase64Url(responseData.attestationObject),
              publicKey: encodeBase64Url(publicKeyBuffer),
              publicKeyAlgorithm,
            },
            clientExtensionResults: credential.getClientExtensionResults(),
          },
        }),
      });
      if (!verifyResponse.ok) {
        const errorBody = await verifyResponse.json().catch(() => ({} as { message?: string }));
        throw new Error(errorBody.message || "Failed to verify passkey registration");
      }

      await loadSecurityMethods();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to register passkey");
      setSecurityLoading(false);
    }
  };

  const revokePasskey = async (credentialId: number) => {
    if (!authHeaders) return;
    setSecurityLoading(true);
    setSecurityError("");
    try {
      const response = await fetch(`${apiBase}/auth/security/passkeys/${credentialId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error("Failed to revoke passkey");
      }
      await loadSecurityMethods();
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to revoke passkey");
      setSecurityLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to access settings.</p>
      </div>
    );
  }

  if (generatedRecoveryCodes.length > 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Recovery Codes</h1>
        <p className="mt-2 text-gray-600">
          Save these codes now. This is the only time they will be shown.
        </p>

        {recoveryCodesActionMessage && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {recoveryCodesActionMessage}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {generatedRecoveryCodes.map((code, index) => (
            <div
              key={`${code}-${index}`}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900"
            >
              {index + 1}. {code}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={copyRecoveryCodes}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
            Copy Codes
          </button>
          <button
            onClick={downloadRecoveryCodes}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download Codes
          </button>
          <button
            onClick={closeRecoveryCodesPage}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            I Have Saved Them
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your profile and account preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserCircleIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <CheckCircleIcon className="h-5 w-5" />
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <ExclamationCircleIcon className="h-5 w-5" />
                {profileError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={user?.role || ""}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National ID Number
                </label>
                <input
                  type="text"
                  value={user?.scannedIdNumber || "Not verified"}
                  disabled
                  className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed ${
                    user?.scannedIdNumber 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-gray-50 text-gray-500"
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {user?.scannedIdNumber 
                    ? "Verified via ID scan" 
                    : "Complete verification to add ID"}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <KeyIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <CheckCircleIcon className="h-5 w-5" />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <ExclamationCircleIcon className="h-5 w-5" />
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* MFA Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <IdentificationIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Multi-Factor Security</h2>
          </div>

          {securityError && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <ExclamationCircleIcon className="h-5 w-5" />
              {securityError}
            </div>
          )}

          {securityLoading && (
            <p className="text-sm text-gray-500 mb-3">Loading security settings...</p>
          )}

          {securityMethods && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">MFA Enabled</p>
                  <p className="font-semibold text-gray-900">
                    {securityMethods.mfaEnabled ? "Yes" : "No"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Recovery Codes Left</p>
                  <p className="font-semibold text-gray-900">
                    {securityMethods.recoveryCodesRemaining}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred login method
                </label>
                <select
                  value={securityMethods.preferredMethod || "TOTP"}
                  onChange={(e) => updatePreferredMethod(e.target.value as "PASSKEY" | "TOTP" | "RECOVERY")}
                  className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
                >
                  {securityMethods.totpEnabled && <option value="TOTP">Authenticator</option>}
                  {securityMethods.passkeyEnabled && <option value="PASSKEY">Passkey</option>}
                  {securityMethods.recoveryCodesRemaining > 0 && (
                    <option value="RECOVERY">Recovery Code</option>
                  )}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={securityMethods.totpEnabled ? disableTotp : setupTotp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {securityMethods.totpEnabled ? "Disable Authenticator" : "Enable Authenticator"}
                </button>
                <button
                  onClick={regenerateRecoveryCodes}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Regenerate Recovery Codes
                </button>
                <button
                  onClick={registerPasskey}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Register Passkey
                </button>
              </div>

              {totpSetup && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-blue-900">
                    Scan this QR code with Google Authenticator, Microsoft Authenticator, Authy, or any TOTP app.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${totpSetup.qrPngBase64}`}
                      alt="TOTP QR code"
                      className="h-44 w-44 rounded border border-blue-200 bg-white p-2"
                    />
                  </div>
                  <p className="text-xs text-blue-900 break-all">
                    Manual key: {extractTotpSecretFromUri(totpSetup.otpauthUri) || totpSetup.secretMasked}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-lg border border-blue-200 px-3 py-2 bg-white text-gray-900"
                    />
                    <button
                      onClick={confirmTotpSetup}
                      disabled={totpConfirming}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {totpConfirming ? "Confirming..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => {
                        setTotpSetup(null);
                        setTotpCode("");
                      }}
                      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {securityMethods.passkeys.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Registered Passkeys</h3>
                  <div className="space-y-2">
                    {securityMethods.passkeys.map((passkey) => (
                      <div
                        key={passkey.id}
                        className="flex items-center justify-between border rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{passkey.name || "Passkey"}</p>
                          <p className="text-xs text-gray-500">
                            Last used: {passkey.lastUsedAt || "Never"}
                          </p>
                        </div>
                        <button
                          onClick={() => revokePasskey(passkey.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <TrashIcon className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium mb-4">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
