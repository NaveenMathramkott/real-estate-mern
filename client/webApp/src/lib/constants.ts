export const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "plot",
  "commercial",
  "farmhouse",
] as const;

export const PROPERTY_STATUSES = [
  "draft",
  "active",
  "rented",
  "sold",
  "expired",
] as const;

export const PURPOSES = ["rent", "buy"] as const;

export const FURNISHED = [
  "unfurnished",
  "semi-furnished",
  "furnished",
] as const;

export const INQUIRY_STATUSES = ["new", "contacted", "closed"] as const;

export const ROLES = ["buyer", "renter", "agent", "landlord", "admin"] as const;

export const AMENITIES = [
  "parking",
  "lift",
  "power backup",
  "gym",
  "swimming pool",
  "security",
  "garden",
  "balcony",
  "modular kitchen",
  "air conditioning",
  "pet friendly",
  "water supply 24x7",
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];
export const LOCALES = ["en", "hi", "fr", "de", "es", "ar"];
export const ALERT_FREQUENCIES = ["off", "daily", "weekly", "instant"] as const;

export const MEDIA_TYPES = ["image", "video", "floorplan", "tour"] as const;

export const ROLE_VARIANT: Record<
  string,
  "default" | "secondary" | "warning" | "muted"
> = {
  admin: "default",
  agent: "default",
  landlord: "secondary",
  buyer: "secondary",
  renter: "muted",
};

export const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "muted" | "outline"
> = {
  active: "success",
  verified: "success",
  closed: "muted",
  sold: "outline",
  rented: "warning",
  draft: "muted",
  expired: "destructive",
  new: "default",
  contacted: "warning",
};

/** Sort options offered on the results page. */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "size-desc", label: "Largest first" },
  { value: "newest", label: "Newest first" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  plot: "Plot",
  commercial: "Commercial",
  farmhouse: "Farmhouse",
};

export const FURNISHED_LABELS: Record<string, string> = {
  unfurnished: "Unfurnished",
  "semi-furnished": "Semi-furnished",
  furnished: "Furnished",
};

export const PURPOSE_LABELS: Record<string, string> = {
  rent: "For rent",
  buy: "For sale",
};

/** Only render an amenity chip if it has an icon in this map. */
export const AMENITY_ICONS: Record<string, string> = {
  parking: "Parking",
  lift: "Lift",
  "power backup": "Power backup",
  gym: "Gym",
  "swimming pool": "Pool",
  security: "Security",
  garden: "Garden",
  balcony: "Balcony",
  "modular kitchen": "Kitchen",
  "air conditioning": "A/C",
  "pet friendly": "Pet friendly",
  "water supply 24x7": "24x7 water",
};

/** Fallback price bands shown before the visitor narrows the range. */
export const PRICE_BANDS: Record<
  "rent" | "buy",
  { label: string; min?: number; max?: number }[]
> = {
  rent: [
    { label: "Under ₹15k", max: 15000 },
    { label: "₹15k–₹30k", min: 15000, max: 30000 },
    { label: "₹30k–₹60k", min: 30000, max: 60000 },
    { label: "₹60k–₹1L", min: 60000, max: 100000 },
    { label: "₹1L+", min: 100000 },
  ],
  buy: [
    { label: "Under ₹50L", max: 5_000_000 },
    { label: "₹50L–₹1Cr", min: 5_000_000, max: 10_000_000 },
    { label: "₹1Cr–₹2Cr", min: 10_000_000, max: 20_000_000 },
    { label: "₹2Cr–₹4Cr", min: 20_000_000, max: 40_000_000 },
    { label: "₹4Cr+", min: 40_000_000 },
  ],
};

export const CITIES = [
  "New Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Jaipur",
  "Ahmedabad",
  "Kochi",
] as const;

/** Default map view when the visitor has not shared a location. */
export const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
export const DEFAULT_ZOOM = 11;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
};

/** Display label for a property type, falling back to the raw value. */
export function propertyTypeLabel(type?: string) {
  return type ? (PROPERTY_TYPE_LABELS[type] ?? type) : "Property";
}
