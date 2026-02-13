const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
const SESSION_EXPIRED_EVENT = "realadmin:session-expired";

// Helper to get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Authenticated fetch wrapper that handles expired tokens
const authenticatedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  });
  if (response.status === 401 || response.status === 403) {
    // Token is expired or invalid; clear auth and notify UI to redirect.
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new Error("Session expired. Please log in again.");
  }
  return response;
};

export interface Rental {
  id?: number;
  title: string;
  description: string;
  price: number;
  address: string;
  // Kenya location fields
  ward: string;
  constituency: string;
  county: string;
  areaName?: string;
  directions?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: PropertyType;
  status: RentalStatus;
  imageUrls: string[];
  amenities: string[];
  petsAllowed: boolean;
  parkingAvailable: boolean;
  availableFrom: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number;
  createdByName?: string;
  // Approval fields
  requiresApproval?: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  approvalRequestedAt?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  approvedById?: number | null;
  approvedByName?: string | null;
  // Owner verification info
  ownerIsVerified?: boolean;
  ownerUserType?: string | null;
  ownerVerificationStatus?: string | null;
  // Owner contact info
  ownerPhone?: string | null;
}

export type PropertyType = "APARTMENT" | "HOUSE" | "CONDO" | "TOWNHOUSE" | "STUDIO" | "BEDSITTER" | "SINGLE_ROOM" | "DOUBLE_ROOM" | "ROOM" | "VILLA" | "AIR_BNB" | "PENTHOUSE" | "DUPLEX" | "OFFICE" | "SHOP" | "WAREHOUSE" | "OTHER";
export type RentalStatus = "ACTIVE" | "RENTED" | "PENDING" | "INACTIVE";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface RentalSearchRequest {
  county?: string;
  constituency?: string;
  ward?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  status?: RentalStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  rentedRentals?: number;
  pendingRentals?: number;
  inactiveRentals?: number;
}

export interface AreaAnalytics {
  areaName: string;
  rank: number;
  averageRent: number;
  minRent: number;
  maxRent: number;
  rentRank: number;
  rentTier: 'PREMIUM' | 'HIGH' | 'MODERATE' | 'AFFORDABLE' | 'BUDGET';
  averageDaysToRent: number;
  speedRank: number;
  speedTier: 'VERY_FAST' | 'FAST' | 'MODERATE' | 'SLOW' | 'VERY_SLOW';
  totalListings: number;
  activeListings: number;
  rentedListings: number;
  occupancyRate: number;
  demandLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';
  marketDescription: string;
  propertyTypeMix: Record<string, number>;
  avgSquareFeet: number;
  avgBedrooms: number;
}

export interface AnalyticsData {
  totalRentals: number;
  activeRentals: number;
  pendingRentals: number;
  rentedRentals: number;
  inactiveRentals: number;
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  totalRevenuePotential: number;
  averageBedrooms: number;
  averageBathrooms: number;
  averageSquareFeet: number;
  rentalsByPropertyType: Record<string, number>;
  rentalsByStatus: Record<string, number>;
  rentalsByCounty: Record<string, number>;
  areaAnalytics: AreaAnalytics[];
  recentActivity: RecentActivity[];
  monthlyTrends: MonthlyTrend[];
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  entityId: number;
}

export interface MonthlyTrend {
  month: string;
  rentalsCreated: number;
  usersRegistered: number;
  messagesCount: number;
}

// Rentals API
export const rentalsApi = {
  getAll: async (page = 0, size = 10, sortBy = "createdAt", sortDirection = "DESC"): Promise<PageResponse<Rental>> => {
    const response = await fetch(
      `${API_BASE_URL}/rentals?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
    );
    if (!response.ok) throw new Error("Failed to fetch rentals");
    return response.json();
  },

  getById: async (id: number): Promise<Rental> => {
    const response = await fetch(`${API_BASE_URL}/rentals/${id}`);
    if (!response.ok) throw new Error("Failed to fetch rental");
    return response.json();
  },

  create: async (rental: Rental, userId: number): Promise<Rental> => {
    const response = await fetch(`${API_BASE_URL}/rentals?userId=${userId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(rental),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to create rentals");
      }
      // Parse validation errors from backend
      try {
        const errorBody = await response.json();
        if (errorBody.errors && typeof errorBody.errors === 'object') {
          const fieldErrors = Object.entries(errorBody.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          throw new Error(`Validation failed:\n${fieldErrors}`);
        }
        if (errorBody.message) {
          throw new Error(errorBody.message);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith('Validation')) {
          throw parseErr;
        }
      }
      throw new Error("Failed to create rental");
    }
    return response.json();
  },

  update: async (id: number, rental: Rental): Promise<Rental> => {
    const response = await fetch(`${API_BASE_URL}/rentals/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(rental),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to update rentals");
      }
      try {
        const errorBody = await response.json();
        if (errorBody.errors && typeof errorBody.errors === 'object') {
          const fieldErrors = Object.entries(errorBody.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          throw new Error(`Validation failed:\n${fieldErrors}`);
        }
        if (errorBody.message) {
          throw new Error(errorBody.message);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith('Validation')) {
          throw parseErr;
        }
      }
      throw new Error("Failed to update rental");
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/rentals/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to delete rentals");
      }
      throw new Error("Failed to delete rental");
    }
  },

  updateStatus: async (id: number, status: RentalStatus): Promise<Rental> => {
    const response = await fetch(`${API_BASE_URL}/rentals/${id}/status?status=${status}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to update status");
      }
      throw new Error("Failed to update rental status");
    }
    return response.json();
  },

  search: async (request: RentalSearchRequest): Promise<PageResponse<Rental>> => {
    const response = await fetch(`${API_BASE_URL}/rentals/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error("Failed to search rentals");
    return response.json();
  },

  getStats: async (): Promise<RentalStats> => {
    const response = await fetch(`${API_BASE_URL}/rentals/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  getUserStats: async (userId: number): Promise<RentalStats> => {
    const response = await fetch(`${API_BASE_URL}/rentals/stats/user/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch user stats");
    return response.json();
  },

  getCities: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/rentals/cities`);
    if (!response.ok) throw new Error("Failed to fetch cities");
    return response.json();
  },

  getByUser: async (userId: number, page = 0, size = 10, sortBy = "createdAt", sortDirection = "DESC"): Promise<PageResponse<Rental>> => {
    const response = await fetch(
      `${API_BASE_URL}/rentals/user/${userId}/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error("Failed to fetch user rentals");
    return response.json();
  },
};

// Files API
type BasicUploadResponse = { filename: string; url: string };
type FileUrlUploadResponse = { url: string; storage: string };
type AdMediaUploadResponse = { url: string; type: string; storage: string };
type MultipleBasicUploadResponse = { files: BasicUploadResponse[] };
type MultiplePropertyUploadResponse = { files: { url: string }[]; storage: string };
type FileStorageInfo = {
  usingR2: boolean;
  maxImageSize: number;
  maxVideoSize: number;
  maxDocumentSize: number;
};

interface FilesApi {
  upload: (file: File) => Promise<BasicUploadResponse>;
  uploadMultiple: (files: File[]) => Promise<MultipleBasicUploadResponse>;
  delete: (filename: string) => Promise<void>;
  getUrl: (filename: string | undefined | null) => string;
  uploadVideo: (file: File) => Promise<FileUrlUploadResponse>;
  uploadDocument: (file: File) => Promise<FileUrlUploadResponse>;
  uploadAdMedia: (file: File) => Promise<AdMediaUploadResponse>;
  uploadPropertyImage: (file: File) => Promise<FileUrlUploadResponse>;
  uploadAvatar: (file: File) => Promise<FileUrlUploadResponse>;
  uploadMultiplePropertyImages: (files: File[]) => Promise<MultiplePropertyUploadResponse>;
  getStorageInfo: () => Promise<FileStorageInfo>;
  deleteByUrl: (url: string) => Promise<void>;
}

export const filesApi = {
  upload: async (file: File): Promise<BasicUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload file");
    }
    return response.json();
  },

  uploadMultiple: async (files: File[]): Promise<MultipleBasicUploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload files");
    }
    return response.json();
  },

  delete: async (filename: string): Promise<void> => {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/${filename}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to delete files");
      }
      throw new Error("Failed to delete file");
    }
  },

  getUrl: (filename: string | undefined | null): string => {
    // Return empty string for undefined/null to prevent "undefined" in URLs
    if (!filename) return '';
    // If it's already a full URL (R2 or external), return as-is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    // Otherwise, construct the local API URL
    return `${API_BASE_URL}/files/${filename}`;
  },
} as FilesApi;

// Analytics API
export const analyticsApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const response = await fetch(`${API_BASE_URL}/analytics`);
    if (!response.ok) throw new Error("Failed to fetch analytics");
    return response.json();
  },

  getUserAnalytics: async (userId: number): Promise<AnalyticsData> => {
    const response = await fetch(`${API_BASE_URL}/analytics/user/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch user analytics");
    return response.json();
  },
};

// Conversation/Message types
export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType?: string;
  mediaUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: number;
  rentalId: number;
  rentalTitle: string;
  userId: number;
  userName: string;
  ownerId: number;
  ownerName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export const conversationsApi = {
  getAll: async (): Promise<Conversation[]> => {
    // Use admin endpoint to get all conversations
    const response = await authenticatedFetch(`${API_BASE_URL}/conversations/all`);
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return response.json();
  },

  getById: async (id: number): Promise<Conversation> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/conversations/${id}`);
    if (!response.ok) throw new Error("Failed to fetch conversation");
    return response.json();
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  },

  sendMessage: async (conversationId: number, content: string): Promise<Message> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  },

  sendFile: async (conversationId: number, file: File): Promise<Message> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/file`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to send file" }));
      throw new Error(error.error || "Failed to send file");
    }
    return response.json();
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to mark as read");
  },
};

// Account API
export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  message?: string;
}

export const accountApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Not authenticated");
      throw new Error("Failed to fetch profile");
    }
    return response.json();
  },

  updateProfile: async (data: UpdateProfileData): Promise<ProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Not authenticated");
      const error = await response.json();
      throw new Error(error.message || "Failed to update profile");
    }
    return response.json();
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Not authenticated");
      const error = await response.json();
      throw new Error(error.error || "Failed to change password");
    }
    return response.json();
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/account`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Not authenticated");
      throw new Error("Failed to delete account");
    }
    return response.json();
  },
};

// Verification types and API
export interface VerificationRequest {
  nationalIdImageUrl: string;
  phone: string;
  faceImageUrl: string;
  faceImageLeftUrl?: string;
  faceImageRightUrl?: string;
  userType?: "INDIVIDUAL" | "AGENT" | "COMPANY";
  // Scanned Kenyan ID data
  scannedIdNumber?: string;
  scannedSerialNumber?: string;
  scannedDateOfBirth?: string;
  scannedFullNames?: string;
  scannedFirstName?: string;
  scannedMiddleName?: string;
  scannedLastName?: string;
  scannedSex?: string;
  scannedDistrictOfBirth?: string;
  scannedPlaceOfIssue?: string;
  scannedDateOfIssue?: string;
}

export interface VerificationStatus {
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  userType: string;
  nationalId: string | null;
  nationalIdImageUrl: string | null;
  phoneVerified: boolean;
  verifiedPhone: string | null;
  faceVerified: boolean;
  faceImageUrl: string | null;
  faceImageLeftUrl: string | null;
  faceImageRightUrl: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

export const verificationApi = {
  submitVerification: async (data: VerificationRequest): Promise<{ message: string; verificationStatus: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/verification/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit verification");
    }
    return response.json();
  },

  getStatus: async (): Promise<VerificationStatus> => {
    const response = await fetch(`${API_BASE_URL}/auth/verification/status`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get verification status");
    }
    return response.json();
  },
};

// Super Admin types and API
export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
  userType: string;
  enabled: boolean;
  nationalId: string | null;
  nationalIdImageUrl: string | null;
  phoneVerified: boolean;
  verifiedPhone: string | null;
  faceVerified: boolean;
  faceImageUrl: string | null;
  faceImageLeftUrl: string | null;
  faceImageRightUrl: string | null;
  verificationStatus: string;
  verificationSubmittedAt: string | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
  rentalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminStats {
  totalAdmins: number;
  totalUsers: number;
  pendingVerifications: number;
  verifiedUsers: number;
  totalRentals: number;
  pendingApprovals: number;
  approvedRentals: number;
  activeRentals: number;
}

export interface RentalWithOwnerInfo extends Rental {
  requiresApproval: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvalRequestedAt: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  ownerVerificationStatus: string | null;
  ownerUserType: string | null;
  ownerIsVerified: boolean;
}

export const superAdminApi = {
  getStats: async (): Promise<SuperAdminStats> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get super admin stats");
    }
    return response.json();
  },

  getAllAdmins: async (): Promise<AdminUser[]> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/admins`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get admins");
    }
    return response.json();
  },

  getPendingVerifications: async (): Promise<AdminUser[]> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/admins/pending`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get pending verifications");
    }
    return response.json();
  },

  verifyAdmin: async (userId: number, decision: "VERIFIED" | "REJECTED", notes?: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/admins/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, decision, notes }),
    });
    if (!response.ok) {
      throw new Error("Failed to verify admin");
    }
    return response.json();
  },

  getAllRentals: async (): Promise<RentalWithOwnerInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rentals`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get all rentals");
    }
    return response.json();
  },

  getPendingRentals: async (): Promise<RentalWithOwnerInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rentals/pending`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to get pending rentals");
    }
    return response.json();
  },

  approveRental: async (rentalId: number, decision: "APPROVED" | "REJECTED", notes?: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/rentals/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ rentalId, decision, notes }),
    });
    if (!response.ok) {
      throw new Error("Failed to approve rental");
    }
    return response.json();
  },

  updateUserRole: async (userId: number, role: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/admins/${userId}/role`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      throw new Error("Failed to update user role");
    }
    return response.json();
  },
};

// Paginated response type
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Advertiser types
export interface Advertiser {
  id: number;
  companyName: string;
  companyDescription?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  businessCertificateUrl?: string;
  taxRegistrationUrl?: string;
  additionalDocumentUrl?: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedById?: number;
  accountBalance: number;
  totalSpent: number;
  billingEmail?: string;
  preferredPaymentMethod: "MPESA" | "BANK_TRANSFER" | "CARD" | "INVOICE";
  blocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  blockedById?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertiserRequest {
  companyName: string;
  companyDescription?: string;
  companyWebsite?: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  businessCertificateUrl?: string;
  taxRegistrationUrl?: string;
  additionalDocumentUrl?: string;
  billingEmail?: string;
  billingAddress?: string;
  preferredPaymentMethod?: string;
  mpesaPhone?: string;
  bankAccountNumber?: string;
  bankName?: string;
}

const mapAdvertiser = (raw: unknown): Advertiser => {
  const source = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(source.id),
    companyName: (source.companyName as string) ?? "",
    companyDescription: source.companyDescription as string | undefined,
    website: (source.website as string) ?? (source.companyWebsite as string) ?? undefined,
    contactEmail: (source.contactEmail as string) ?? (source.companyEmail as string) ?? "",
    contactPhone: (source.contactPhone as string) ?? (source.companyPhone as string) ?? undefined,
    address: (source.address as string) ?? (source.companyAddress as string) ?? undefined,
    logoUrl: source.logoUrl as string | undefined,
    businessCertificateUrl: source.businessCertificateUrl as string | undefined,
    taxRegistrationUrl: source.taxRegistrationUrl as string | undefined,
    additionalDocumentUrl: source.additionalDocumentUrl as string | undefined,
    verificationStatus:
      ((source.verificationStatus as Advertiser["verificationStatus"]) ??
        (source.status as Advertiser["verificationStatus"]) ??
        "UNVERIFIED"),
    verificationNotes: source.verificationNotes as string | undefined,
    verifiedAt: source.verifiedAt as string | undefined,
    verifiedById: source.verifiedById as number | undefined,
    accountBalance: Number(source.accountBalance ?? 0),
    totalSpent: Number(source.totalSpent ?? 0),
    billingEmail: source.billingEmail as string | undefined,
    preferredPaymentMethod:
      ((source.preferredPaymentMethod as Advertiser["preferredPaymentMethod"]) ?? "MPESA"),
    blocked: Boolean(source.blocked),
    blockedReason: source.blockedReason as string | undefined,
    blockedAt: source.blockedAt as string | undefined,
    blockedById: source.blockedById as number | undefined,
    createdAt: (source.createdAt as string) ?? "",
    updatedAt: (source.updatedAt as string) ?? "",
  };
};

// Advertisement types
export interface Advertisement {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaType: "IMAGE" | "VIDEO";
  linkType: "WEBSITE" | "PLAYSTORE" | "APPSTORE" | "APP_BOTH" | "FORM" | "NONE";
  targetUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  formTitle?: string;
  formSchema?: string;
  formSubmitButtonText?: string;
  formSuccessMessage?: string;
  placement:
    | "HOME_BANNER"
    | "HOME_FEED"
    | "LISTING_DETAIL"
    | "SEARCH_RESULTS"
    | "INTERSTITIAL"
    | "SPLASH"
    | "APP_LAUNCH"
    | "RENTAL_FEED"
    | "LOCATION_FILTER";
  priority: number;
  startDate?: string;
  endDate?: string;
  isNationwide?: boolean;
  targetCounties?: string[] | string;
  targetConstituencies?: string[] | string;
  locationInstructions?: string;
  sponsored?: boolean;
  sponsorshipMultiplier?: number;
  skipDelaySeconds?: number;
  active: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  approvalNotes?: string;
  approvedAt?: string;
  approvedById?: number;
  impressionCount: number;
  clickCount: number;
  formSubmissionCount: number;
  videoViewCount: number;
  videoCompletionCount: number;
  budgetTotal?: number;
  budgetSpent: number;
  costPerImpression?: number;
  costPerClick?: number;
  blocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  blockedById?: number;
  advertiserId: number;
  advertiserName: string;
  advertiserLogoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertisementRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaType: "IMAGE" | "VIDEO";
  linkType: string;
  targetUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  formTitle?: string;
  formSchema?: string;
  formSubmitButtonText?: string;
  formSuccessMessage?: string;
  placement: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  isNationwide?: boolean;
  targetCounties?: string[];
  targetConstituencies?: string[];
  locationInstructions?: string;
  sponsored?: boolean;
  sponsorshipMultiplier?: number;
  skipDelaySeconds?: number;
  budgetTotal?: number;
  costPerImpression?: number;
  costPerClick?: number;
  advertiserId?: number;
}

export interface AdFormSubmission {
  id: number;
  advertisementId: number;
  advertisementTitle: string;
  formData: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  deviceInfo?: string;
  status: "NEW" | "VIEWED" | "CONTACTED" | "CONVERTED" | "SPAM" | "ARCHIVED";
  notes?: string;
  submittedAt: string;
  viewedAt?: string;
  contactedAt?: string;
  convertedAt?: string;
}

// Advertisers API
export const advertisersApi = {
  list: async (params: {
    page?: number;
    size?: number;
    status?: string;
    blocked?: boolean;
  }): Promise<PaginatedResponse<Advertiser>> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append("page", params.page.toString());
    if (params.size !== undefined) searchParams.append("size", params.size.toString());
    if (params.status) searchParams.append("status", params.status);
    if (params.blocked !== undefined) searchParams.append("blocked", params.blocked.toString());
    
    const response = await fetch(`${API_BASE_URL}/advertisers?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch advertisers");
    const payload = await response.json();
    return {
      ...payload,
      content: Array.isArray(payload.content)
        ? payload.content.map((item: unknown) => mapAdvertiser(item))
        : [],
    };
  },

  get: async (id: number): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/advertisers/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch advertiser");
    const payload = await response.json();
    return mapAdvertiser(payload);
  },

  getMe: async (): Promise<Advertiser | null> => {
    const response = await fetch(`${API_BASE_URL}/advertisers/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to fetch advertiser profile");
    }
    const payload = await response.json().catch(() => null);
    if (!payload || payload.exists === false) {
      return null;
    }
    return mapAdvertiser(payload);
  },

  create: async (data: CreateAdvertiserRequest): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/advertisers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to create advertiser");
    }
    const payload = await response.json();
    return mapAdvertiser(payload);
  },

  update: async (id: number, data: Partial<CreateAdvertiserRequest>): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/advertisers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to update advertiser");
    }
    const payload = await response.json();
    return mapAdvertiser(payload);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/advertisers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete advertiser");
  },

  submitVerification: async (
    id: number,
    request?: {
      businessCertificateUrl?: string;
      taxRegistrationUrl?: string;
      additionalDocumentUrl?: string;
    }
  ): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/advertisers/${id}/verification`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        businessCertificateUrl: request?.businessCertificateUrl,
        taxRegistrationUrl: request?.taxRegistrationUrl,
        additionalDocumentUrl: request?.additionalDocumentUrl,
      }),
    });
    if (!response.ok) throw new Error("Failed to submit verification");
    const payload = await response.json();
    return mapAdvertiser(payload);
  },

  verify: async (id: number, decision: "VERIFIED" | "REJECTED", notes?: string): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/advertisers/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        advertiserId: id,
        approved: decision === "VERIFIED",
        notes,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to verify advertiser");
    }
    const payload = await response.json();
    return mapAdvertiser(payload);
  },

  block: async (id: number, reason: string): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/advertisers/${id}/block`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to block advertiser");
    const payload = await response.json();
    return mapAdvertiser(payload);
  },

  unblock: async (id: number): Promise<Advertiser> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/advertisers/${id}/unblock`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to unblock advertiser");
    const payload = await response.json();
    return mapAdvertiser(payload);
  },
};

const parseStringList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // fall through to CSV-style split fallback
    }
    return trimmed
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((item) => item.replace(/^"+|"+$/g, "").trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

const normalizeAd = (value: unknown): Advertisement => {
  const source = (value ?? {}) as Record<string, unknown>;
  const advertiserObj = (source.advertiser as Record<string, unknown> | undefined) ?? {};
  return {
    id: Number(source.id ?? 0),
    title: String(source.title ?? ""),
    description: source.description as string | undefined,
    imageUrl: source.imageUrl as string | undefined,
    videoUrl: source.videoUrl as string | undefined,
    thumbnailUrl: source.thumbnailUrl as string | undefined,
    mediaType: (source.mediaType as Advertisement["mediaType"]) ?? "IMAGE",
    linkType: (source.linkType as Advertisement["linkType"]) ?? "NONE",
    targetUrl: source.targetUrl as string | undefined,
    playStoreUrl: source.playStoreUrl as string | undefined,
    appStoreUrl: source.appStoreUrl as string | undefined,
    formTitle: source.formTitle as string | undefined,
    formSchema: source.formSchema as string | undefined,
    formSubmitButtonText: source.formSubmitButtonText as string | undefined,
    formSuccessMessage: source.formSuccessMessage as string | undefined,
    placement: (source.placement as Advertisement["placement"]) ?? "HOME_BANNER",
    priority: Number(source.priority ?? 0),
    startDate: source.startDate as string | undefined,
    endDate: source.endDate as string | undefined,
    isNationwide: source.isNationwide as boolean | undefined,
    targetCounties: parseStringList(source.targetCounties),
    targetConstituencies: parseStringList(source.targetConstituencies),
    locationInstructions: source.locationInstructions as string | undefined,
    sponsored: source.sponsored as boolean | undefined,
    sponsorshipMultiplier: Number(source.sponsorshipMultiplier ?? 1),
    skipDelaySeconds: Number(source.skipDelaySeconds ?? 5),
    active: Boolean(source.active ?? true),
    approvalStatus:
      (source.approvalStatus as Advertisement["approvalStatus"]) ?? "PENDING",
    approvalNotes: source.approvalNotes as string | undefined,
    approvedAt: source.approvedAt as string | undefined,
    approvedById: Number(source.approvedById ?? 0) || undefined,
    impressionCount: Number(source.impressionCount ?? 0),
    clickCount: Number(source.clickCount ?? 0),
    formSubmissionCount: Number(source.formSubmissionCount ?? 0),
    videoViewCount: Number(source.videoViewCount ?? 0),
    videoCompletionCount: Number(source.videoCompletionCount ?? 0),
    budgetTotal: source.budgetTotal != null ? Number(source.budgetTotal) : undefined,
    budgetSpent: Number(source.budgetSpent ?? 0),
    costPerImpression:
      source.costPerImpression != null ? Number(source.costPerImpression) : undefined,
    costPerClick: source.costPerClick != null ? Number(source.costPerClick) : undefined,
    blocked: Boolean(source.blocked),
    blockedReason: source.blockedReason as string | undefined,
    blockedAt: source.blockedAt as string | undefined,
    blockedById: Number(source.blockedById ?? 0) || undefined,
    advertiserId:
      Number(source.advertiserId ?? advertiserObj.id ?? 0) || 0,
    advertiserName:
      (source.advertiserName as string | undefined) ??
      (advertiserObj.companyName as string | undefined) ??
      "",
    advertiserLogoUrl:
      (source.advertiserLogoUrl as string | undefined) ??
      (advertiserObj.logoUrl as string | undefined),
    createdAt: (source.createdAt as string | undefined) ?? "",
    updatedAt: (source.updatedAt as string | undefined) ?? "",
  };
};

export interface SponsoredAdSettingsRequest {
  sponsored?: boolean;
  sponsorshipMultiplier?: number;
  placement?: Advertisement["placement"];
  priority?: number;
  active?: boolean;
  isNationwide?: boolean;
  targetCounties?: string[];
  targetConstituencies?: string[];
  locationInstructions?: string;
}

// Advertisements API
export const adsApi = {
  list: async (params: {
    page?: number;
    size?: number;
    search?: string;
    placement?: string;
    status?: string;
    blocked?: boolean;
    advertiserId?: number;
  }): Promise<PaginatedResponse<Advertisement>> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append("page", params.page.toString());
    if (params.size !== undefined) searchParams.append("size", params.size.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.placement) searchParams.append("placement", params.placement);
    if (params.status) searchParams.append("status", params.status);
    if (params.blocked !== undefined) searchParams.append("blocked", params.blocked.toString());
    if (params.advertiserId !== undefined) searchParams.append("advertiserId", params.advertiserId.toString());
    
    const response = await fetch(`${API_BASE_URL}/ads?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch ads");
    return response.json();
  },

  get: async (id: number): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/ads/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch ad");
    return response.json();
  },

  create: async (data: CreateAdvertisementRequest): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/ads`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to create ad");
    }
    return response.json();
  },

  update: async (id: number, data: Partial<CreateAdvertisementRequest>): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/ads/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to update ad");
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/ads/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete ad");
  },

  approve: async (id: number, decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED", notes?: string): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        adId: id,
        approved: decision === "APPROVED",
        notes,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to approve ad");
    }
    return response.json();
  },

  block: async (id: number, reason: string): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/${id}/block`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to block ad");
    return response.json();
  },

  unblock: async (id: number): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/${id}/unblock`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to unblock ad");
    return response.json();
  },

  getFormSubmissions: async (adId: number, params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdFormSubmission>> => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", params.page.toString());
    if (params?.size !== undefined) searchParams.append("size", params.size.toString());
    if (params?.status) searchParams.append("status", params.status);
    
    const response = await fetch(`${API_BASE_URL}/ads/${adId}/submissions?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch form submissions");
    return response.json();
  },

  updateSubmissionStatus: async (adId: number, submissionId: number, status: string, notes?: string): Promise<AdFormSubmission> => {
    const response = await fetch(`${API_BASE_URL}/ads/${adId}/submissions/${submissionId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (!response.ok) throw new Error("Failed to update submission status");
    return response.json();
  },
};

export const sponsoredAdsApi = {
  list: async (params: {
    page?: number;
    size?: number;
    sponsored?: boolean;
    placement?: Advertisement["placement"];
    search?: string;
  }): Promise<PaginatedResponse<Advertisement>> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append("page", params.page.toString());
    if (params.size !== undefined) searchParams.append("size", params.size.toString());
    if (params.sponsored !== undefined) {
      searchParams.append("sponsored", params.sponsored.toString());
    }
    if (params.placement) searchParams.append("placement", params.placement);
    if (params.search) searchParams.append("search", params.search);

    const response = await fetch(`${API_BASE_URL}/super-admin/ads/sponsored?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch sponsored ad settings");
    const payload = await response.json();
    return {
      ...payload,
      content: Array.isArray(payload.content) ? payload.content.map(normalizeAd) : [],
    };
  },

  update: async (id: number, data: SponsoredAdSettingsRequest): Promise<Advertisement> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/${id}/sponsored`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || body?.message || "Failed to update sponsored ad settings");
    }
    const payload = await response.json();
    return normalizeAd(payload);
  },
};

// Ad Display Config API (Super Admin only)
export interface AdDisplayConfig {
  [key: string]: string;
}

export interface AdAnalyticsSummary {
  adId: number;
  title: string;
  impressions: number;
  clicks: number;
  skips: number;
  videoStarts: number;
  videoCompletes: number;
  formSubmits: number;
}

export interface AdAnalyticsDetail {
  adId: number;
  period: {
    days: number;
    start: string;
    end: string;
  };
  events: Record<string, number>;
  daily: Record<string, Record<string, number>>;
  locations: Array<{ county: string; constituency: string; count: number }>;
  devices: Record<string, number>;
  uniqueViewers: number;
}

export const adConfigApi = {
  getConfig: async (): Promise<AdDisplayConfig> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/config`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to get ad config");
    return response.json();
  },

  updateConfig: async (key: string, value: string): Promise<{ key: string; value: string }> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/config`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });
    if (!response.ok) throw new Error("Failed to update config");
    return response.json();
  },
};

export const adAnalyticsApi = {
  getSummary: async (days: number = 30): Promise<{ period: { days: number; start: string; end: string }; ads: AdAnalyticsSummary[] }> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/analytics/summary?days=${days}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to get analytics summary");
    return response.json();
  },

  getTopAds: async (metric: string = "impressions", limit: number = 10, days: number = 30): Promise<{
    metric: string;
    period: { days: number };
    ads: Array<{ adId: number; title: string; count: number }>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/analytics/top?metric=${metric}&limit=${limit}&days=${days}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to get top ads");
    return response.json();
  },

  getAdAnalytics: async (adId: number, days: number = 30): Promise<AdAnalyticsDetail> => {
    const response = await fetch(`${API_BASE_URL}/super-admin/ads/analytics/${adId}?days=${days}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to get ad analytics");
    return response.json();
  },
};

// Files API - add video, document, and specialized upload endpoints
Object.assign(filesApi, {
  uploadVideo: async (file: File): Promise<{ url: string; storage: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-video`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload video");
    }
    return response.json();
  },

  uploadDocument: async (file: File): Promise<{ url: string; storage: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-document`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload document");
    }
    return response.json();
  },
  
  uploadAdMedia: async (file: File): Promise<{ url: string; type: string; storage: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-ad-media`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload ad media");
    }
    return response.json();
  },
  
  uploadPropertyImage: async (file: File): Promise<{ url: string; storage: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-property`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload property image");
    }
    return response.json();
  },
  
  uploadAvatar: async (file: File): Promise<{ url: string; storage: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-avatar`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload avatar");
    }
    return response.json();
  },
  
  uploadMultiplePropertyImages: async (files: File[]): Promise<{ files: { url: string }[]; storage: string }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files/upload-multiple-properties`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to upload files");
      }
      throw new Error("Failed to upload property images");
    }
    return response.json();
  },
  
  getStorageInfo: async (): Promise<{ usingR2: boolean; maxImageSize: number; maxVideoSize: number; maxDocumentSize: number }> => {
    const response = await fetch(`${API_BASE_URL}/files/storage-info`);
    if (!response.ok) throw new Error("Failed to get storage info");
    return response.json();
  },
  
  deleteByUrl: async (url: string): Promise<void> => {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/files?url=${encodeURIComponent(url)}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Please login to delete files");
      }
      throw new Error("Failed to delete file");
    }
  },
});

// ==================== Email Verification & Password Reset ====================

export interface EmailCodeResponse {
  success: boolean;
  message: string;
  expiresInMinutes?: number;
  cooldownSeconds?: number;
  cooldownRemaining?: number;
}

export const authApi = {
  sendVerificationCode: async (email: string): Promise<EmailCodeResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/email/send-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  verifyEmail: async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/email/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    return response.json();
  },

  resendVerificationCode: async (email: string): Promise<EmailCodeResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/email/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  sendPasswordResetCode: async (email: string): Promise<EmailCodeResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  verifyPasswordResetCode: async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/password/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    return response.json();
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return response.json();
  },
};

// M-Pesa Types
export interface MpesaStkRequest {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}

export interface MpesaStkResponse {
  success: boolean;
  message: string;
  requiresLogin?: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
}

export interface MpesaStatusResponse {
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  resultDesc: string;
  mpesaReceiptNumber: string;
}

// M-Pesa API
export const mpesaApi = {
  // Format phone number to 254XXXXXXXXX
  formatPhoneNumber: (phone: string): string | null => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    } else if (digits.startsWith('0') && digits.length === 10) {
      return '254' + digits.substring(1);
    } else if (digits.startsWith('7') && digits.length === 9) {
      return '254' + digits;
    } else if (digits.startsWith('1') && digits.length === 9) {
      return '254' + digits;
    }
    
    return null;
  },

  // Validate phone number
  isValidPhoneNumber: (phone: string): boolean => {
    return mpesaApi.formatPhoneNumber(phone) !== null;
  },

  // Initiate STK Push
  initiateSTKPush: async (request: MpesaStkRequest): Promise<MpesaStkResponse> => {
    const formattedPhone = mpesaApi.formatPhoneNumber(request.phoneNumber);
    if (!formattedPhone) {
      return { success: false, message: 'Invalid phone number format' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/stk-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          phoneNumber: formattedPhone,
        }),
      });
      const data = await response.json();
      if (response.status === 429) {
        return { success: false, message: data.message || 'Limit reached. Please login.', requiresLogin: true };
      }
      return data;
    } catch (error) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  // Check payment status
  checkStatus: async (checkoutRequestId: string): Promise<MpesaStatusResponse | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/status/${checkoutRequestId}`);
      if (response.ok) {
        return response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Poll for payment completion
  waitForPayment: async (
    checkoutRequestId: string,
    onUpdate: (status: MpesaStatusResponse) => void,
    maxAttempts: number = 40,
    intervalMs: number = 3000
  ): Promise<MpesaStatusResponse | null> => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
      const status = await mpesaApi.checkStatus(checkoutRequestId);
      if (status) {
        onUpdate(status);
        
        if (status.status !== 'PENDING') {
          return status;
        }
      }
      
      attempts++;
    }
    
    return null;
  },
};
