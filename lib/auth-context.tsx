"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const SESSION_EXPIRED_EVENT = "realadmin:session-expired";

const fetchWithTimeout = async (
  url: string,
  options?: RequestInit,
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const parseStoredUser = (raw: string | null): User | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
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
  availableMethods: Array<"PASSKEY" | "TOTP" | "RECOVERY">;
  preferredMethod?: "PASSKEY" | "TOTP" | "RECOVERY";
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
  fetchPasskeyOptions: (challengeId: string, challengeToken: string) => Promise<any>;
  verifyPasskeyLogin: (challengeId: string, challengeToken: string, credential: any) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogleIdToken: (idToken: string, clientType?: string, forceLogin?: boolean) => Promise<void>;
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
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
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
    const userData: User = {
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
    };
    setUser(userData);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = async (email: string, password: string, forceLogin = false): Promise<LoginResult> => {
    const response = await fetch(`${API_BASE_URL}/auth/login/init`, {
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
          const fullUser: User = await meRes.json();
          setUser(fullUser);
          localStorage.setItem("user", JSON.stringify(fullUser));
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
    const response = await fetch(`${API_BASE_URL}/auth/login/verify-totp`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/login/verify-recovery`, {
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

  const fetchPasskeyOptions = async (challengeId: string, challengeToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/passkey/options`, {
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

  const loginWithGoogleIdToken = async (idToken: string, clientType = "REALADMIN", forceLogin = false) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
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

    const data: AuthResponse = await response.json();
    applyAuthResponse(data);
  };

  const exchangeBluvberryCode = async (
    code: string,
    redirectUri: string,
    clientType = "REALADMIN"
  ) => {
    const response = await fetch(`${API_BASE_URL}/auth/bluvberry/exchange`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/login/passkey/verify`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
      fetch(`${API_BASE_URL}/auth/logout`, {
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
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
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

export function getAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

