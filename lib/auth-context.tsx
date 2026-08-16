"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAppCheckToken } from "./firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ishinadwelly.com/api";
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const SESSION_EXPIRED_EVENT = "realadmin:session-expired";

/**
 * Inject the X-Firebase-AppCheck header into any existing headers object.
 */
const injectAppCheckHeader = async (
  existing?: HeadersInit
): Promise<Record<string, string>> => {
  const token = await getAppCheckToken();
  const merged: Record<string, string> = {};
  // Copy existing headers
  if (existing) {
    if (existing instanceof Headers) {
      existing.forEach((v, k) => { merged[k] = v; });
    } else if (Array.isArray(existing)) {
      existing.forEach(([k, v]) => { merged[k] = v; });
    } else {
      Object.assign(merged, existing);
    }
  }
  if (token) {
    merged["X-Firebase-AppCheck"] = token;
  }
  return merged;
};

/**
 * Fetch with a timeout AND automatic App Check token injection.
 */
const fetchWithTimeout = async (
  url: string,
  options?: RequestInit,
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await injectAppCheckHeader(options?.headers);
    return await fetch(url, { ...options, headers, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

/**
 * Plain fetch with automatic App Check token injection (no timeout).
 */
const appCheckFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const headers = await injectAppCheckHeader(options?.headers);
  return fetch(url, { ...options, headers });
};

const normalizeUser = (user: any): User | null => {
  if (!user) return null;
  const isPrem = Boolean(user.isPremiumActive || user.premiumActive || user.realadminPremiumActive);
  return {
    ...user,
    isPremiumActive: isPrem,
    premiumActive: isPrem,
    realadminPremiumActive: Boolean(user.realadminPremiumActive || user.isPremiumActive || isPrem),
  };
};

const parseStoredUser = (raw: string | null): User | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch {
    return null;
  }
};

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  verifiedPhone?: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  userType?: "INDIVIDUAL" | "AGENT" | "COMPANY";
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  emailVerified?: boolean;
  phoneVerified?: boolean;
  faceVerified?: boolean;
  scannedIdNumber?: string;
  isPremiumActive?: boolean;
  premiumActive?: boolean;
  realadminPremiumActive?: boolean;
  realadminFreeMonthClaimed?: boolean;
  primaryRole?: string;
  serviceCategory?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  emailVerified?: boolean;
  premiumActive?: boolean;
  realadminPremiumActive?: boolean;
  realadminFreeMonthClaimed?: boolean;
  premiumStartedAt?: string;
  premiumExpiresAt?: string;
  primaryRole?: string;
  serviceCategory?: string;
}

export interface MfaChallenge {
  challengeId: string;
  challengeToken: string;
  availableMethods: Array<"PASSKEY" | "TOTP" | "RECOVERY" | "PUSH">;
  preferredMethod?: "PASSKEY" | "TOTP" | "RECOVERY" | "PUSH";
  pushDeviceNames?: string[];
  expiresAt?: string;
}

export interface LoginResult {
  status: "AUTHENTICATED" | "MFA_REQUIRED";
  challenge?: MfaChallenge;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, forceLogin?: boolean) => Promise<LoginResult>;
  verifyTotpLogin: (challengeId: string, challengeToken: string, code: string) => Promise<void>;
  verifyRecoveryLogin: (challengeId: string, challengeToken: string, recoveryCode: string) => Promise<void>;
  sendPushChallenge: (challengeId: string, challengeToken: string) => Promise<void>;
  pollPushChallengeStatus: (challengeId: string) => Promise<{ status: string; authResponse?: AuthResponse }>;
  fetchPasskeyOptions: (challengeId: string, challengeToken: string) => Promise<any>;
  verifyPasskeyLogin: (challengeId: string, challengeToken: string, credential: any) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogleIdToken: (idToken: string, clientType?: string, forceLogin?: boolean) => Promise<{ status: "AUTHENTICATED" | "MFA_REQUIRED"; challenge?: MfaChallenge }>;
  exchangeBluvberryCode: (code: string, redirectUri: string, clientType?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isVerified: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedStoredUser = parseStoredUser(storedUser);

    if (storedToken && storedUser) {
      fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (res.ok) {
            setToken(storedToken);
            return res.json();
          } else if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return null;
          } else {
            throw new Error(`Server error: ${res.status}`);
          }
        })
        .then((userData) => {
          if (userData) {
            const normalized = normalizeUser(userData)!;
            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
          }
          setIsLoading(false);
        })
        .catch(() => {
          if (parsedStoredUser) {
            setToken(storedToken);
            setUser(parsedStoredUser);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const applyAuthResponse = (data: AuthResponse) => {
    setToken(data.token);
    const userData: User = normalizeUser({
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      role: data.role,
      emailVerified: data.emailVerified,
      premiumActive: data.premiumActive,
      isPremiumActive: data.premiumActive || data.realadminPremiumActive,
      realadminPremiumActive: data.realadminPremiumActive,
      realadminFreeMonthClaimed: data.realadminFreeMonthClaimed,
      primaryRole: data.primaryRole,
      serviceCategory: data.serviceCategory,
    })!;
    setUser(userData);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = async (email: string, password: string, forceLogin = false): Promise<LoginResult> => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, clientType: "WEB", forceLogin }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.error === "CONCURRENT_LOGIN_DETECTED") {
        throw new Error("CONCURRENT_LOGIN_DETECTED");
      }
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    if (data.status === "AUTHENTICATED") {
      if (!data.auth) {
        throw new Error("Invalid login response");
      }
      applyAuthResponse(data.auth as AuthResponse);
      // Immediately fetch full user profile (includes premium status, verification, etc.)
      try {
        const meRes = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${(data.auth as AuthResponse).token}` },
        });
        if (meRes.ok) {
          const fullUser = normalizeUser(await meRes.json());
          if (fullUser) {
            setUser(fullUser);
            localStorage.setItem("user", JSON.stringify(fullUser));
          }
        }
      } catch (e) {
        // Non-critical — applyAuthResponse already set basic user data
      }
      return { status: "AUTHENTICATED" };
    }

    if (data.status === "MFA_REQUIRED") {
      return {
        status: "MFA_REQUIRED",
        challenge: {
          challengeId: data.challengeId,
          challengeToken: data.challengeToken,
          availableMethods: (data.availableMethods ?? []) as Array<"PASSKEY" | "TOTP" | "RECOVERY">,
          preferredMethod: data.preferredMethod as "PASSKEY" | "TOTP" | "RECOVERY" | undefined,
          expiresAt: data.expiresAt,
        },
      };
    }

    throw new Error("Unknown login status");
  };

  const verifyTotpLogin = async (challengeId: string, challengeToken: string, code: string) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/verify-totp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, challengeToken, code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Invalid authenticator code");
    }

    const data: AuthResponse = await response.json();
    applyAuthResponse(data);
  };

  const verifyRecoveryLogin = async (
    challengeId: string,
    challengeToken: string,
    recoveryCode: string
  ) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/verify-recovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, challengeToken, recoveryCode }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Invalid recovery code");
    }

    const data: AuthResponse = await response.json();
    applyAuthResponse(data);
  };

  const sendPushChallenge = async (challengeId: string, challengeToken: string) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, challengeToken }),
    });
    if (!response.ok) {
      throw new Error("Failed to send verification prompt to your phone");
    }
  };

  const pollPushChallengeStatus = async (challengeId: string) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/push/status?challengeId=${encodeURIComponent(challengeId)}`);
    if (!response.ok) {
      throw new Error("Failed to check push status");
    }
    const data = await response.json();
    if (data.status === "APPROVED" && data.authResponse) {
      applyAuthResponse(data.authResponse);
    }
    return data;
  };

  const fetchPasskeyOptions = async (challengeId: string, challengeToken: string) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/passkey/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, challengeToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to fetch passkey options");
    }

    return response.json();
  };

  const loginWithGoogleIdToken = async (
    idToken: string,
    clientType = "REALADMIN",
    forceLogin = false
  ): Promise<{ status: "AUTHENTICATED" | "MFA_REQUIRED"; challenge?: MfaChallenge }> => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, clientType, forceLogin }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.error === "CONCURRENT_LOGIN_DETECTED") {
        throw new Error("CONCURRENT_LOGIN_DETECTED");
      }
      throw new Error(error.message || "Google sign-in failed");
    }

    const data = await response.json();

    if (data.status === "MFA_REQUIRED") {
      return {
        status: "MFA_REQUIRED",
        challenge: {
          challengeId: data.challengeId,
          challengeToken: data.challengeToken,
          availableMethods: (data.availableMethods ?? []) as Array<"PASSKEY" | "TOTP" | "RECOVERY" | "PUSH">,
          preferredMethod: data.preferredMethod as "PASSKEY" | "TOTP" | "RECOVERY" | "PUSH" | undefined,
          pushDeviceNames: data.pushDeviceNames,
          expiresAt: data.expiresAt,
        },
      };
    }

    const authPayload: AuthResponse = data.auth ? data.auth : data;
    applyAuthResponse(authPayload);
    return { status: "AUTHENTICATED" };
  };

  const exchangeBluvberryCode = async (
    code: string,
    redirectUri: string,
    clientType = "REALADMIN"
  ) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/bluvberry/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri, clientType }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Bluvberry sign-in failed");
    }

    const data: AuthResponse = await response.json();
    applyAuthResponse(data);
  };

  const verifyPasskeyLogin = async (
    challengeId: string,
    challengeToken: string,
    credential: any
  ) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/login/passkey/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, challengeToken, credential }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Passkey login failed");
    }

    const data: AuthResponse = await response.json();
    applyAuthResponse(data);
  };

  const register = async (registerData: RegisterData) => {
    const response = await appCheckFetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data: AuthResponse = await response.json();
    applyAuthResponse(data);
  };

  const logout = () => {
    if (token) {
      appCheckFetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = normalizeUser({ ...user, ...userData });
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = normalizeUser(await response.json());
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isVerified = user?.verificationStatus === "VERIFIED";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        verifyTotpLogin,
        verifyRecoveryLogin,
        sendPushChallenge,
        pollPushChallengeStatus,
        fetchPasskeyOptions,
        verifyPasskeyLogin,
        register,
        loginWithGoogleIdToken,
        exchangeBluvberryCode,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: !!token,
        isSuperAdmin,
        isVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export async function getAuthHeaders(token: string | null): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const appCheckToken = await getAppCheckToken();
  if (appCheckToken) {
    headers["X-Firebase-AppCheck"] = appCheckToken;
  }
  return headers;
}

