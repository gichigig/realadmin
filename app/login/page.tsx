"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, MfaChallenge } from "@/lib/auth-context";
import { GoogleLogin } from "@react-oauth/google";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";
const BLUVBERRY_LOGO_SRC = "/WhatsApp%20Image%202026-05-30%20at%2018.05.36.jpeg";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    verifyTotpLogin,
    verifyRecoveryLogin,
    fetchPasskeyOptions,
    verifyPasskeyLogin,
    loginWithGoogleIdToken,
    exchangeBluvberryCode,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [bluvberryLoading, setBluvberryLoading] = useState(false);
  const [showForceLoginModal, setShowForceLoginModal] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>("TOTP");
  const [mfaCode, setMfaCode] = useState("");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const requiresMfa = !!mfaChallenge;

  const handleSuccessfulAuth = () => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      router.push(redirect);
      return;
    }
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.primaryRole) {
          localStorage.setItem("workspaceMode", user.primaryRole);
          router.push(user.primaryRole === "helper" ? "/helper" : "/");
          return;
        }
      } catch { }
    }
    const wsMode = localStorage.getItem("workspaceMode");
    if (wsMode) {
      router.push(wsMode === "helper" ? "/helper" : "/");
      return;
    }
    router.push("/choose-role");
  };

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess("Password reset successfully! Please log in with your new password.");
    }
    if (searchParams.get("verified") === "true") {
      setSuccess("Email verified successfully! Please log in.");
    }
  }, [searchParams]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("Google sign-in failed: No credential returned");
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogleIdToken(credentialResponse.credential, "REALADMIN");
      handleSuccessfulAuth();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Google sign-in failed";
      if (errorMessage === "CONCURRENT_LOGIN_DETECTED") {
        setPendingGoogleToken(credentialResponse.credential);
        setShowForceLoginModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const provider = searchParams.get("provider");
    const code = searchParams.get("code");
    if (provider !== "bluvberry" || !code || bluvberryLoading) {
      return;
    }

    const redirectUri = `${window.location.origin}/login?provider=bluvberry`;
    setBluvberryLoading(true);
    setError("");

    exchangeBluvberryCode(code, redirectUri, "REALADMIN")
      .then(() => {
        handleSuccessfulAuth();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Bluvberry sign-in failed");
      })
      .finally(() => {
        setBluvberryLoading(false);
      });
  }, [searchParams, exchangeBluvberryCode, bluvberryLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.status === "AUTHENTICATED") {
        handleSuccessfulAuth();
        return;
      }
      if (!result.challenge) {
        throw new Error("MFA challenge missing");
      }
      setMfaChallenge(result.challenge);
      setMfaMethod((result.challenge.preferredMethod || result.challenge.availableMethods[0] || "TOTP") as MfaMethod);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      if (errorMessage === "CONCURRENT_LOGIN_DETECTED") {
        setShowForceLoginModal(true);
      } else {
        setError(errorMessage);
      }
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

      handleSuccessfulAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBluvberryLogin = async () => {
    setError("");
    setBluvberryLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/bluvberry/authorize?clientType=REALADMIN`
      );
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || "Bluvberry sign-in failed");
      }
      const data = await response.json();
      if (!data?.url) {
        throw new Error("Bluvberry sign-in URL is missing");
      }
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bluvberry sign-in failed");
      setBluvberryLoading(false);
    }
  };

  const handleForceLogin = async () => {
    setShowForceLoginModal(false);
    setError("");
    if (pendingGoogleToken) {
      setGoogleLoading(true);
      try {
        await loginWithGoogleIdToken(pendingGoogleToken, "REALADMIN", true);
        handleSuccessfulAuth();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      } finally {
        setGoogleLoading(false);
        setPendingGoogleToken(null);
      }
    } else {
      setLoading(true);
      try {
        const result = await login(email, password, true);
        if (result.status === "AUTHENTICATED") {
          handleSuccessfulAuth();
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center">
            <img src="/icon.png" alt="IshinaDwelly" className="h-16 w-16 object-contain" />
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
                <div className="mt-1 flex items-center justify-between">
                  <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
                    Back
                  </Link>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="flex items-start justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBluvberryLogin}
                    disabled={bluvberryLoading || googleLoading || loading}
                    aria-label="Login with Bluvberry"
                    className="h-14 w-14 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bluvberryLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="h-10 w-10 rounded-full overflow-hidden">
                        <img
                          src={BLUVBERRY_LOGO_SRC}
                          alt="Bluvberry"
                          className="h-full w-full object-cover"
                        />
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-gray-600">Bluvberry</span>
                </div>
                {googleClientId ? (
                  <div className="flex flex-col items-center gap-2 h-14 justify-center mt-2">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google sign-in failed")}
                      type="icon"
                      shape="circle"
                      size="large"
                    />
                    <span className="text-xs text-gray-600">Google</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                      G
                    </div>
                    <span className="text-xs text-gray-400">Google</span>
                  </div>
                )}
              </div>
            </div>
          )}


        </form>
      </div>

      {showForceLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowForceLoginModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Already Logged In
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You are already logged into another device. Logging in here will automatically log you out of your previous session. Do you want to continue?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleForceLogin}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Yes, Log out other device
                </button>
                <button
                  type="button"
                  onClick={() => setShowForceLoginModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

