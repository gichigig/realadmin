"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, MfaChallenge } from "@/lib/auth-context";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";

type MfaMethod = "PASSKEY" | "TOTP" | "RECOVERY";

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    verifyTotpLogin,
    verifyRecoveryLogin,
    fetchPasskeyOptions,
    verifyPasskeyLogin,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>("TOTP");
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess("Password reset successfully! Please log in with your new password.");
    }
    if (searchParams.get("verified") === "true") {
      setSuccess("Email verified successfully! Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.status === "AUTHENTICATED") {
        router.push("/");
        return;
      }
      if (!result.challenge) {
        throw new Error("MFA challenge missing");
      }
      setMfaChallenge(result.challenge);
      setMfaMethod((result.challenge.preferredMethod || result.challenge.availableMethods[0] || "TOTP") as MfaMethod);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaChallenge) return;
    setError("");
    setLoading(true);

    try {
      if (mfaMethod === "TOTP") {
        await verifyTotpLogin(mfaChallenge.challengeId, mfaChallenge.challengeToken, mfaCode.trim());
      } else if (mfaMethod === "RECOVERY") {
        await verifyRecoveryLogin(mfaChallenge.challengeId, mfaChallenge.challengeToken, mfaCode.trim());
      } else {
        if (!("credentials" in navigator) || !("PublicKeyCredential" in window)) {
          throw new Error("Passkey is not supported in this browser");
        }

        const options = await fetchPasskeyOptions(mfaChallenge.challengeId, mfaChallenge.challengeToken);
        const publicKey: PublicKeyCredentialRequestOptions = {
          challenge: decodeBase64Url(options.challenge),
          rpId: options.rpId,
          timeout: options.timeout,
          userVerification: options.userVerification,
          allowCredentials: (options.allowCredentials || []).map((item: any) => ({
            type: "public-key",
            id: decodeBase64Url(item.id),
            transports: item.transports,
          })),
        };

        const credential = (await navigator.credentials.get({
          publicKey,
        })) as PublicKeyCredential | null;

        if (!credential) {
          throw new Error("No passkey credential returned");
        }

        const assertionResponse = credential.response as AuthenticatorAssertionResponse;
        await verifyPasskeyLogin(mfaChallenge.challengeId, mfaChallenge.challengeToken, {
          id: credential.id,
          rawId: encodeBase64Url(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: encodeBase64Url(assertionResponse.clientDataJSON),
            authenticatorData: encodeBase64Url(assertionResponse.authenticatorData),
            signature: encodeBase64Url(assertionResponse.signature),
            userHandle: assertionResponse.userHandle
              ? encodeBase64Url(assertionResponse.userHandle)
              : null,
          },
          clientExtensionResults: credential.getClientExtensionResults(),
        });
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  const requiresMfa = !!mfaChallenge;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {requiresMfa ? "Verify your identity" : "Sign in to Admin Panel"}
          </h2>
          {!requiresMfa && (
            <p className="mt-2 text-sm text-gray-600">
              Or{" "}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                create a new account
              </Link>
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={requiresMfa ? (e) => { e.preventDefault(); handleMfaVerify(); } : handleSubmit}>
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={requiresMfa}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                placeholder="admin@realestate.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={requiresMfa}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                placeholder="••••••••"
              />
              {!requiresMfa && (
                <div className="mt-1 text-right">
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {requiresMfa && (
              <>
                <div>
                  <label htmlFor="mfa-method" className="block text-sm font-medium text-gray-700">
                    Verification method
                  </label>
                  <select
                    id="mfa-method"
                    value={mfaMethod}
                    onChange={(e) => setMfaMethod(e.target.value as MfaMethod)}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900"
                  >
                    {mfaChallenge?.availableMethods.map((method) => (
                      <option key={method} value={method}>
                        {method === "PASSKEY" ? "Passkey" : method === "RECOVERY" ? "Recovery Code" : "Authenticator Code"}
                      </option>
                    ))}
                  </select>
                </div>

                {mfaMethod !== "PASSKEY" && (
                  <div>
                    <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
                      {mfaMethod === "RECOVERY" ? "Recovery code" : "Authenticator code"}
                    </label>
                    <input
                      id="mfa-code"
                      type="text"
                      required
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900"
                      placeholder={mfaMethod === "RECOVERY" ? "ABCD-EFGH" : "123456"}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : requiresMfa ? (
              "Verify & sign in"
            ) : (
              "Sign in"
            )}
          </button>

          {!requiresMfa && (
            <div className="text-center text-sm text-gray-500">
              <p>Demo credentials:</p>
              <p className="font-mono">admin@realestate.com / admin123</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

