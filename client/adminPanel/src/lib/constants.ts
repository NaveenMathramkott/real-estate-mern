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
