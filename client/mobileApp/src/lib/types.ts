export type Id = string;

export type Role = "buyer" | "renter" | "agent" | "landlord" | "admin";
export type PropertyPurpose = "rent" | "buy";
export type PropertyType =
  | "apartment"
  | "villa"
  | "plot"
  | "commercial"
  | "farmhouse";
export type PropertyStatus = "draft" | "active" | "rented" | "sold" | "expired";
export type Furnished = "unfurnished" | "semi-furnished" | "furnished";
export type InquiryStatus = "new" | "contacted" | "closed";
export type MediaType = "image" | "video" | "floorplan" | "tour";
export type ReviewTargetType = "building" | "area" | "agent";

export interface User {
  _id: Id;
  email: string;
  phone?: string;
  role: Role;
  verified: boolean;
  locale?: string;
  currency?: string;
  createdAt: string;
}

export interface Profile {
  _id: Id;
  userId: Id | User;
  name?: string;
  avatar?: string;
  agencyId?: Id;
  bio?: string;
}

export interface Agency {
  _id: Id;
  name: string;
  logo?: string;
  licenseNo?: string;
  verified: boolean;
  memberCount?: number;
  createdAt: string;
}

export interface PropertyMedia {
  _id: Id;
  propertyId: Id;
  type: MediaType;
  url: string;
  publicId?: string;
  blurhash?: string;
  order: number;
}

export interface Property {
  _id: Id;
  title: string;
  description?: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  price: number;
  currency?: string;
  size?: number;
  beds?: number;
  baths?: number;
  floor?: string;
  furnished?: Furnished;
  amenities?: string[];
  location?: { type: "Point"; coordinates: [number, number] };
  address?: string;
  buildingId?: Id;
  ownerId?: Id;
  agentId?: Id;
  status: PropertyStatus;
  verifiedAt?: string | null;
  availableFrom?: string;
  /** Image urls and the first of them, attached by GET /properties so a grid needs no detail
   *  request per card. Not schema paths — the controller spreads them onto a plain object. */
  images?: string[];
  thumbnail?: string | null;
  createdAt: string;
  updatedAt: string;
  reviews?: { average: number; count: number };
}

export interface Area {
  _id: Id;
  name: string;
  city: string;
  boundary?: { type: "Polygon"; coordinates: number[][][] };
  createdAt?: string;
}

export interface Building {
  _id: Id;
  name: string;
  developer?: string;
  yearBuilt?: number;
  amenities?: string[];
  location?: { type: "Point"; coordinates: [number, number] };
  createdAt?: string;
}

export interface Inquiry {
  _id: Id;
  propertyId: Id | Property;
  userId: Id | User;
  agentId: Id;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

/** `GET /conversations` populates `propertyId` with this subset of fields. */
export interface ConversationListing {
  _id: Id;
  title: string;
  address?: string;
  price?: number;
  currency?: string;
}

export interface Conversation {
  _id: Id;
  participants: User[];
  /** Populated object from the API, or a bare id when not expanded. */
  propertyId?: Id | ConversationListing;
  lastMessageAt?: string;
  lastMessage?: { body: string; senderId: Id };
}

export interface Message {
  _id: Id;
  conversationId: Id;
  senderId: Id | User;
  body: string;
  attachments?: string[];
  readAt: string | null;
  createdAt: string;
}

export interface AppNotification {
  _id: Id;
  userId: Id;
  type: string;
  payload: Record<string, unknown> & {
    preview?: string;
    conversationId?: string;
    messageId?: string;
  };
  readAt: string | null;
  createdAt: string;
}

export interface Review {
  _id: Id;
  targetType: ReviewTargetType;
  targetId: Id;
  rating: number;
  body?: string;
  userId: Id | User;
  createdAt: string;
}

export interface PriceHistoryEntry {
  _id: Id;
  propertyId: Id;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
}

export interface SavedSearch {
  _id: Id;
  userId: Id;
  filters: Record<string, unknown>;
  alertFrequency: "off" | "daily" | "weekly" | "instant";
  lastRunAt: string | null;
  createdAt: string;
}

export interface Favorite {
  _id: Id;
  userId: Id;
  propertyId: Id | Property;
  createdAt: string;
}

export interface AdminDashboard {
  success: true;
  role: "admin";
  summary: {
    totalUsers: number;
    usersByRole: Record<string, number>;
    verifiedUsers: number;
    unverifiedUsers: number;
    totalProperties: number;
    propertiesByStatus: Record<string, number>;
    verifiedProperties: number;
    unverifiedProperties: number;
    totalAgencies: number;
    verifiedAgencies: number;
    unverifiedAgencies: number;
    totalAreas: number;
    totalBuildings: number;
    totalReviews: number;
    reviewsByTarget: Record<string, number>;
    totalMessages: number;
    inquiriesByStatus: Record<string, number>;
    closedDeals: number;
    closedDealValue: number;
  };
  verified: {
    users: { count: number; sample: User[] };
    properties: { count: number; sample: Property[] };
    agencies: { count: number; sample: Agency[] };
  };
  unverified: {
    users: { count: number; sample: User[] };
    properties: { count: number; sample: Property[] };
    agencies: { count: number; sample: Agency[] };
  };
  recentUsers: User[];
  recentProperties: Property[];
}

export interface AgentDashboard {
  success: true;
  role: "agent";
  summary: {
    totalListings: number;
    activeListings: number;
    totalInquiries: number;
    newInquiries: number;
    mediaAssets: number;
    portfolioValue: number;
    avgPrice: number;
    priceRange: { min: number; max: number };
    livePortfolioValue: number;
  };
  listingsByStatus: Record<string, number>;
  listingsByPurpose: Record<
    string,
    { count: number; avgPrice: number; totalValue: number }
  >;
  inquiriesByStatus: Record<string, number>;
  recentListings: Property[];
  recentInquiries: Inquiry[];
  recentPriceChanges: PriceHistoryEntry[];
}

export interface BuyerDashboard {
  success: true;
  role: "buyer";
  summary: {
    favorites: number;
    savedSearches: number;
    inquiriesSent: number;
    conversations: number;
    unreadNotifications: number;
  };
  favoriteSummary: Record<
    string,
    {
      count: number;
      totalValue: number;
      avgPrice: number;
      minPrice: number;
      maxPrice: number;
    }
  >;
  recentFavorites: Favorite[];
  recentInquiries: Inquiry[];
}

export interface AreaInsights {
  success: true;
  area: Area;
  total: number;
  priceStats: {
    avgPrice: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
  };
  byPurpose: Record<string, { count: number; avgPrice: number }>;
  byType: Record<string, number>;
  byBeds: Record<string, number>;
  rating: { average: number; count: number };
}

export interface Paginated {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PropertySearchResponse extends Paginated {
  success: true;
  properties: Property[];
}

export interface Suggestion {
  type: "area" | "property" | "city";
  label: string;
  areaId?: string;
  address?: string;
  price?: number;
  currency?: string;
  coordinates?: [number, number];
  propertyId?: string;
}

export type PropertyMapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export interface PolygonSearchResponse {
  success: true;
  total: number;
  stats: { avgPrice: number; minPrice: number; maxPrice: number };
  properties: Property[];
}

export interface CommuteSearchResponse {
  success: true;
  origin: { lat: number; lng: number };
  minutes: number;
  radiusMetres: number;
  total: number;
  properties: Property[];
}

export interface BuildingReviewsResponse {
  success: true;
  page: number;
  total: number;
  avgRating: number;
  reviews: Review[];
  distribution: Record<string, number>;
}

export type ReviewsResponse = BuildingReviewsResponse;

export interface AgencyDetailResponse {
  success: true;
  agency: Agency;
  members: { _id: string; name?: string; avatar?: string; userId: string }[];
}

export interface BuildingDetailResponse {
  success: true;
  building: Building;
  properties: Property[];
}

export interface PropertyDetailResponse {
  success: true;
  property: Property;
  media: PropertyMedia[];
}

export interface SimilarResponse {
  success: true;
  properties: Property[];
}

export interface ApiEnvelope {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}
