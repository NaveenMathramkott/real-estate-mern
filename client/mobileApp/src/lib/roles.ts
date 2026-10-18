import type { Role } from "./types";

/** Roles that publish listings — the ones the API lets create and own stock. */
export const LISTER_ROLES: Role[] = ["agent", "landlord", "admin"];

/** Roles self-service signup may pick. `admin` is excluded until the API restricts it. */
export const SELECTABLE_ROLES: Role[] = [
  "buyer",
  "renter",
  "agent",
  "landlord",
];

export type Capabilities = {
  /** Can browse listings without an account. */
  public: boolean;
  canFavorite: boolean;
  canSaveSearch: boolean;
  canInquire: boolean;
  canChat: boolean;
  /** `POST /properties` — agent, landlord or admin. */
  canCreateListing: boolean;
  /** `PATCH`/`DELETE /properties/:id` — owner, assigned agent or admin. */
  canManageListings: boolean;
  /** `GET /inquiries` + status updates. */
  canAnswerInquiries: boolean;
  /** Landlords have no lead pipeline of their own but do own stock. */
  ownsListings: boolean;
  hasDashboard: boolean;
};

const NONE: Capabilities = {
  public: false,
  canFavorite: false,
  canSaveSearch: false,
  canInquire: false,
  canChat: false,
  canCreateListing: false,
  canManageListings: false,
  canAnswerInquiries: false,
  ownsListings: false,
  hasDashboard: false,
};

const CAPABILITIES: Record<Role, Capabilities> = {
  buyer: {
    ...NONE,
    public: true,
    canFavorite: true,
    canSaveSearch: true,
    canInquire: true,
    canChat: true,
    hasDashboard: true,
  },
  renter: {
    ...NONE,
    public: true,
    canFavorite: true,
    canSaveSearch: true,
    canInquire: true,
    canChat: true,
    hasDashboard: true,
  },
  agent: {
    ...NONE,
    public: true,
    canFavorite: true,
    canSaveSearch: true,
    canInquire: true,
    canChat: true,
    canCreateListing: true,
    canManageListings: true,
    canAnswerInquiries: true,
    ownsListings: false,
    hasDashboard: true,
  },
  landlord: {
    ...NONE,
    public: true,
    canFavorite: true,
    canSaveSearch: true,
    canInquire: true,
    canChat: true,
    canCreateListing: true,
    canManageListings: true,
    canAnswerInquiries: true,
    ownsListings: true,
    hasDashboard: true,
  },
  admin: {
    ...NONE,
    public: true,
    canFavorite: true,
    canSaveSearch: true,
    canInquire: true,
    canChat: true,
    canCreateListing: true,
    canManageListings: true,
    canAnswerInquiries: true,
    ownsListings: true,
    hasDashboard: true,
  },
};

const ANONYMOUS: Capabilities = {
  ...NONE,
  public: true,
};

export function capabilitiesFor(role?: Role | null): Capabilities {
  if (!role) return ANONYMOUS;
  return CAPABILITIES[role] ?? ANONYMOUS;
}

export const ROLE_LABELS: Record<Role, string> = {
  buyer: "Buyer",
  renter: "Renter",
  agent: "Agent",
  landlord: "Landlord",
  admin: "Admin",
};

/** One line explaining what the role gets — used on the register picker. */
export const ROLE_BLURBS: Record<string, string> = {
  buyer: "Browse homes to buy, shortlist and track your offers.",
  renter: "Find a place to rent, shortlist and message landlords.",
  agent: "Publish listings, manage media and answer incoming leads.",
  landlord: "List your own property and handle tenant enquiries.",
};

/** Where the app lands after sign-in. Buyers resume browsing; listers and
 *  admins go straight to the role dashboard. */
export function homeRouteFor(role?: Role | null) {
  if (!role) return "/";
  if (role === "admin" || role === "agent" || role === "landlord") {
    return "/dashboard";
  }
  return "/";
}

/** The route a role lands on when it asks for a screen it cannot open. */
export function deniedRouteFor(role?: Role | null) {
  return role ? "/dashboard" : "/login";
}

/** Landlords own stock; agents may be assigned stock — used for copy only. */
export function listingNoun(role?: Role | null) {
  if (role === "landlord") return "Property";
  if (role === "agent") return "Listing";
  return "Listing";
}
