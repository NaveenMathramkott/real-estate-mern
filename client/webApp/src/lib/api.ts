import { api } from "./api-client";
import type {
  AdminDashboard,
  Agency,
  AgencyDetailResponse,
  AgentDashboard,
  BuildingDetailResponse,
  BuildingReviewsResponse,
  ApiEnvelope,
  AppNotification,
  Area,
  AreaInsights,
  Building,
  BuyerDashboard,
  CommuteSearchResponse,
  Conversation,
  Favorite,
  Inquiry,
  InquiryStatus,
  Message,
  Paginated,
  PolygonSearchResponse,
  PriceHistoryEntry,
  PropertyDetailResponse,
  Profile,
  Property,
  PropertyMedia,
  PropertySearchResponse,
  Review,
  ReviewsResponse,
  SavedSearch,
  SimilarResponse,
  Suggestion,
  User,
} from "./types";

/* ------------------------------------------------------------------ auth */

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    api.post<ApiEnvelope & { user: User; accessToken: string }>(
      "/auth/login",
      payload,
    ),
  register: (payload: {
    email: string;
    password: string;
    role?: string;
    name?: string;
    locale?: string;
    currency?: string;
  }) =>
    api.post<ApiEnvelope & { user: User; accessToken: string }>(
      "/auth/register",
      payload,
    ),
  logout: () => api.post<ApiEnvelope>("/auth/logout"),
  requestOtp: (payload: { email: string }) =>
    api.post<ApiEnvelope>("/auth/otp", payload),
  verifyOtp: (payload: { email: string; otp: string }) =>
    api.post<ApiEnvelope & { user: User; accessToken: string }>(
      "/auth/otp/verify",
      payload,
    ),
  refresh: () =>
    api.post<ApiEnvelope & { user: User; accessToken: string }>(
      "/auth/refresh",
    ),
  me: () =>
    api.get<ApiEnvelope & { user: User }>("/auth/me", { cacheTtl: 15_000 }),
  health: () => api.get<ApiEnvelope & { status: string }>("/health"),
};

/* ------------------------------------------------------------- dashboard */

export const dashboardApi = {
  generic: () =>
    api.get<AdminDashboard | AgentDashboard | BuyerDashboard>("/dashboard", {
      cacheTtl: 20_000,
    }),
  admin: () =>
    api.get<AdminDashboard>("/dashboard/admin", {
      cacheTtl: 20_000,
      fresh: true,
    }),
  agent: () =>
    api.get<AgentDashboard>("/dashboard/agent", { cacheTtl: 20_000 }),
  buyer: () =>
    api.get<BuyerDashboard>("/dashboard/buyer", { cacheTtl: 20_000 }),
  verifyUser: (userId: string, verified: boolean) =>
    api.patch<ApiEnvelope & { user: User }>(
      `/dashboard/admin/users/${userId}/verify`,
      { verified },
    ),
  verifyProperty: (propertyId: string, verified: boolean) =>
    api.patch<ApiEnvelope & { property: Property }>(
      `/dashboard/admin/properties/${propertyId}/verify`,
      { verified },
    ),
  verifyAgency: (agencyId: string, verified: boolean) =>
    api.patch<ApiEnvelope & { agency: { _id: string; verified: boolean } }>(
      `/dashboard/admin/agencies/${agencyId}/verify`,
      { verified },
    ),
};

/* ------------------------------------------------------------ properties */

export type PropertyFilters = {
  purpose?: string;
  type?: string;
  beds?: number;
  priceMin?: number;
  priceMax?: number;
  furnished?: string;
  amenities?: string;
  city?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  /** Closed GeoJSON ring as a JSON string: `[[lng,lat],…]`. */
  polygon?: string;
  page?: number;
  limit?: number;
};

export const propertyApi = {
  search: (filters: PropertyFilters) =>
    api.get<PropertySearchResponse>("/properties", {
      params: filters,
      cacheTtl: 30_000,
    }),
  detail: (id: string) =>
    api.get<PropertyDetailResponse>(`/properties/${id}`, { cacheTtl: 30_000 }),
  create: (payload: Partial<Property>) =>
    api.post<ApiEnvelope & { property: Property }>("/properties", payload),
  update: (id: string, payload: Partial<Property>) =>
    api.patch<ApiEnvelope & { property: Property }>(
      `/properties/${id}`,
      payload,
    ),
  remove: (id: string) => api.delete<ApiEnvelope>(`/properties/${id}`),
  inquire: (id: string, message: string) =>
    api.post<ApiEnvelope & { inquiry: Inquiry }>(`/properties/${id}/inquire`, {
      message,
    }),
  addMedia: (id: string, payload: Omit<PropertyMedia, "_id" | "propertyId">) =>
    api.post<ApiEnvelope & { media: PropertyMedia }>(
      `/properties/${id}/media`,
      payload,
    ),
  reorderMedia: (id: string, mediaIds: string[]) =>
    api.patch<ApiEnvelope & { media: PropertyMedia[] }>(
      `/properties/${id}/media/reorder`,
      { order: mediaIds },
    ),
  removeMedia: (id: string, mediaId: string) =>
    api.delete<ApiEnvelope>(`/properties/${id}/media/${mediaId}`),
  priceHistory: (id: string) =>
    api.get<ApiEnvelope & { history: PriceHistoryEntry[] }>(
      `/properties/${id}/price-history`,
      { cacheTtl: 60_000 },
    ),
  similar: (id: string) =>
    api.get<SimilarResponse>(`/properties/${id}/similar`, {
      cacheTtl: 60_000,
    }),
  reviews: (id: string, page = 1) =>
    api.get<ReviewsResponse>(`/properties/${id}/reviews`, {
      params: { page },
      cacheTtl: 60_000,
    }),
};

/* ---------------------------------------------------------------- search */

export const searchApi = {
  suggest: (q: string) =>
    api.get<ApiEnvelope & { suggestions: Suggestion[] }>("/search/suggest", {
      params: { q },
      cacheTtl: 120_000,
    }),
  polygon: (coordinates: [number, number][]) =>
    api.post<PolygonSearchResponse>("/search/polygon", { coordinates }),
  commute: (payload: {
    lat: number;
    lng: number;
    minutes: number;
    speedKph?: number;
  }) => api.post<CommuteSearchResponse>("/search/commute", payload),
};

/* ------------------------------------------------- reference data (admin) */

export const areaApi = {
  list: (params: {
    city?: string;
    name?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<Paginated & { success: true; areas: Area[] }>("/areas", {
      params,
      cacheTtl: 60_000,
    }),
  detail: (id: string) =>
    api.get<ApiEnvelope & { area: Area }>(`/areas/${id}`, { cacheTtl: 60_000 }),
  insights: (id: string) =>
    api.get<AreaInsights>(`/areas/${id}/insights`, { cacheTtl: 60_000 }),
  create: (payload: Partial<Area>) =>
    api.post<ApiEnvelope & { area: Area }>("/areas", payload),
  update: (id: string, payload: Partial<Area>) =>
    api.patch<ApiEnvelope & { area: Area }>(`/areas/${id}`, payload),
  remove: (id: string) => api.delete<ApiEnvelope>(`/areas/${id}`),
};

export const buildingApi = {
  list: (params: {
    name?: string;
    developer?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<Paginated & { success: true; buildings: Building[] }>(
      "/buildings",
      { params, cacheTtl: 60_000 },
    ),
  detail: (id: string) =>
    api.get<BuildingDetailResponse>(`/buildings/${id}`, { cacheTtl: 60_000 }),
  reviews: (id: string, page = 1) =>
    api.get<BuildingReviewsResponse>(`/buildings/${id}/reviews`, {
      params: { page },
      cacheTtl: 60_000,
    }),
  create: (payload: Partial<Building>) =>
    api.post<ApiEnvelope & { building: Building }>("/buildings", payload),
  update: (id: string, payload: Partial<Building>) =>
    api.patch<ApiEnvelope & { building: Building }>(
      `/buildings/${id}`,
      payload,
    ),
  remove: (id: string) => api.delete<ApiEnvelope>(`/buildings/${id}`),
};

export const agencyApi = {
  list: (params: { verified?: boolean; page?: number; limit?: number }) =>
    api.get<
      Paginated & {
        success: true;
        agencies: Agency[];
      }
    >("/agencies", { params, cacheTtl: 60_000 }),
  detail: (id: string) =>
    api.get<AgencyDetailResponse>(`/agencies/${id}`, { cacheTtl: 60_000 }),
  create: (payload: Partial<Agency>) =>
    api.post<ApiEnvelope & { agency: Agency }>("/agencies", payload),
  update: (id: string, payload: Partial<Agency>) =>
    api.patch<ApiEnvelope & { agency: Agency }>(`/agencies/${id}`, payload),
  remove: (id: string) => api.delete<ApiEnvelope>(`/agencies/${id}`),
};

/* -------------------------------------------------------- user-side reads */

export const profileApi = {
  me: () =>
    api.get<ApiEnvelope & { profile: Profile }>("/profiles/me", {
      cacheTtl: 60_000,
    }),
  update: (payload: Partial<Profile>) =>
    api.patch<ApiEnvelope & { profile: Profile }>("/profiles/me", payload),
  updatePreferences: (payload: { locale: string; currency: string }) =>
    api.patch<ApiEnvelope & { user: User }>(
      "/profiles/me/preferences",
      payload,
    ),
  of: (userId: string) =>
    api.get<ApiEnvelope & { profile: Profile }>(`/profiles/${userId}`, {
      cacheTtl: 60_000,
    }),
};

export const inquiryApi = {
  list: () =>
    api.get<ApiEnvelope & { inquiries: Inquiry[] }>("/inquiries", {
      cacheTtl: 20_000,
    }),
  setStatus: (id: string, status: InquiryStatus) =>
    api.patch<ApiEnvelope & { inquiry: Inquiry }>(`/inquiries/${id}/status`, {
      status,
    }),
};

export const conversationApi = {
  list: () =>
    api.get<ApiEnvelope & { conversations: Conversation[] }>("/conversations", {
      cacheTtl: 15_000,
    }),
  /** Reuses an existing thread between the pair; 200 means one already existed. */
  create: (payload: { participantId: string; propertyId?: string }) =>
    api.post<ApiEnvelope & { conversation: Conversation; existing?: boolean }>(
      "/conversations",
      payload,
    ),
  detail: (id: string) =>
    api.get<ApiEnvelope & { conversation: Conversation }>(
      `/conversations/${id}`,
      {
        cacheTtl: 15_000,
      },
    ),
  messages: (id: string, before?: string) =>
    api.get<ApiEnvelope & { messages: Message[] }>(
      `/conversations/${id}/messages`,
      { params: { before }, cacheTtl: 10_000 },
    ),
  send: (id: string, payload: { body: string; attachments?: string[] }) =>
    api.post<ApiEnvelope & { message: Message }>(
      `/conversations/${id}/messages`,
      payload,
    ),
  markRead: (id: string) => api.post<ApiEnvelope>(`/conversations/${id}/read`),
};

export const notificationApi = {
  list: (params: { unreadOnly?: boolean; limit?: number } = {}) =>
    api.get<ApiEnvelope & { notifications: AppNotification[] }>(
      "/notifications",
      {
        params,
        cacheTtl: 15_000,
      },
    ),
  markRead: (id: string) => api.patch<ApiEnvelope>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<ApiEnvelope>("/notifications/read-all"),
};

export const reviewApi = {
  mine: () =>
    api.get<ApiEnvelope & { reviews: Review[] }>("/reviews", {
      cacheTtl: 30_000,
    }),
  create: (payload: {
    targetType: string;
    targetId: string;
    rating: number;
    body?: string;
  }) => api.post<ApiEnvelope & { review: Review }>("/reviews", payload),
  remove: (id: string) => api.delete<ApiEnvelope>(`/reviews/${id}`),
};

export const savedSearchApi = {
  list: () =>
    api.get<ApiEnvelope & { savedSearches: SavedSearch[] }>("/saved-searches", {
      cacheTtl: 30_000,
    }),
  create: (payload: {
    filters: Record<string, unknown>;
    alertFrequency: string;
  }) =>
    api.post<ApiEnvelope & { savedSearch: SavedSearch }>(
      "/saved-searches",
      payload,
    ),
  remove: (id: string) => api.delete<ApiEnvelope>(`/saved-searches/${id}`),
  run: (id: string) =>
    api.get<PropertySearchResponse>(`/saved-searches/${id}/results`, {
      cacheTtl: 30_000,
    }),
};

export const favoriteApi = {
  list: () =>
    api.get<ApiEnvelope & { favorites: Favorite[] }>("/favorites", {
      cacheTtl: 30_000,
    }),
  add: (propertyId: string) =>
    api.post<ApiEnvelope & { favorite: Favorite }>("/favorites", {
      propertyId,
    }),
  /** `DELETE /favorites` — the server also accepts the id in the body. */
  removeByBody: (propertyId: string) =>
    api.delete<ApiEnvelope>("/favorites", { data: { propertyId } }),
  remove: (propertyId: string) =>
    api.delete<ApiEnvelope>(`/favorites/${propertyId}`),
};
