"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { GoogleLogin } from "@react-oauth/google";

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmail.net", "tempmailo.com",
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minmail.com",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz", "guerrillamailblock.com", "grr.la",
  "mailinator.com", "mailinator2.com", "sogetthis.com", "suremail.info", "mailinater.com",
  "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf", "nospam.ze.tc",
  "trashmail.com", "trashmail.net", "trashmail.me", "trashmail.org", "trashcanmail.com",
  "getnada.com", "abox.online", "wuzup.net", "givmail.com", "dropmail.me",
  "dispostable.com", "sharklasers.com", "spam4.me", "throwawaymail.com",
  "fakeinbox.com", "crazymailing.com", "maildrop.cc", "mohmal.com",
  "disposablemail.com", "tempmail.oess.net", "emailondeck.com", "mytemp.email",
  "boun.cr", "inboxalias.com", "anonbox.net", "tmpmail.org", "tmpmail.net",
  "disposable.email", "0clickemail.com", "byom.de", "dayrep.com", "teleworm.us",
  "rhyta.com", "einrot.com", "armyspy.com", "cuvox.de", "superrito.com",
  "fleckens.hu", "gustr.com", "jourrapide.com", "iinet.net.au", "tempail.com",
  "fake-box.com", "generator.email", "incognitomail.org", "burnermail.io",
  "trashmail.de", "spambox.us", "safetymail.info", "mytempmail.com",
  "mailcatch.com", "guerrillamail.info", "sharklasers.org", "yopmail.org",
  "tempmail.dev", "tempmail.app", "tempmail.plus", "vmail.dev", "disposable.com"
]);

const DISPOSABLE_KEYWORDS = [
  "tempmail", "disposable", "throwaway", "fakeinbox", "mailinator",
  "trashmail", "guerrillamail", "10minute", "maildrop", "yopmail",
  "getnada", "anonbox", "0click", "burnermail", "incognitomail",
  "spambox", "tempail", "generator.email", "receive-sms", "fake-mail"
];

function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;

  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain.endsWith("." + d)) return true;
  }
  for (const k of DISPOSABLE_KEYWORDS) {
    if (domain.includes(k)) return true;
  }
  return false;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const redirect = searchParams.get("redirect");
  const { register, loginWithGoogleIdToken } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isDisposableEmail(formData.email)) {
      setError("Disposable or temporary email addresses are not allowed. Please use a valid personal or work email address.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });

      router.push(`/choose-role?email=${encodeURIComponent(formData.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}${source ? `&source=${encodeURIComponent(source)}` : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("Google sign-up failed: No credential returned");
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogleIdToken(credentialResponse.credential, "REALADMIN");
      router.push(`/choose-role?email=${encodeURIComponent(formData.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}${source ? `&source=${encodeURIComponent(source)}` : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    } finally {
      setGoogleLoading(false);
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
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

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
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
              <div className="mt-1 flex items-center justify-start">
                <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
                  Back
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Create account"
            )}
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            {googleClientId ? (
              <div className={`w-full flex justify-center ${googleLoading ? "opacity-70" : ""}`}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-up failed")}
                  text="signup_with"
                  size="large"
                  width="400"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center">
                Google sign-up is not configured.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
