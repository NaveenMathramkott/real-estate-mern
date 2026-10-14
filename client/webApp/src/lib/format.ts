import {
  format as formatDate,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
} from "date-fns";

const currencyCache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, compact: boolean) {
  const key = `${currency}:${compact}`;
  let f = currencyCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 0,
    });
    currencyCache.set(key, f);
  }
  return f;
}

export function formatCurrency(
  value?: number | null,
  currency = "INR",
  compact = false,
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return formatter(currency || "INR", compact).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-IN")}`;
  }
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-IN");
}

export function formatCompact(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatArea(size?: number | null) {
  if (!size) return "—";
  return `${formatNumber(size)} sq.ft`;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDateTime(value?: string | null) {
  const d = toDate(value);
  return d ? formatDate(d, "dd MMM yyyy, HH:mm") : "—";
}

export function formatShortDate(value?: string | null) {
  const d = toDate(value);
  return d ? formatDate(d, "dd MMM yyyy") : "—";
}

export function formatRelative(value?: string | null) {
  const d = toDate(value);
  if (!d) return "—";
  return `${formatDistanceToNowStrict(d)} ago`;
}

export function initials(value?: string | null) {
  if (!value) return "?";
  const parts = value.trim().split(/\s+|\s*@\s*/);
  return (
    (parts[0]?.[0].toUpperCase() ?? "") + (parts[1]?.[0].toUpperCase() ?? "") ||
    value.slice(0, 2)
  );
}

export function coordinatesToLatLng(
  coordinates?: [number, number],
): { lat: number; lng: number } | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lat, lng };
}

export function slug(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/\s+/g, "-");
}

/** Listing price with the unit a buyer actually cares about. */
export function formatListingPrice(
  price?: number | null,
  currency = "INR",
  purpose: "rent" | "buy" = "rent",
) {
  const value = formatCurrency(price, currency, purpose === "buy");
  if (price === null || price === undefined) return value;
  return purpose === "rent" ? `${value}/mo` : value;
}

/** Compact area used on cards: `1,100 sq.ft`. */
export function formatSize(size?: number | null) {
  if (!size) return null;
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} ac`;
  if (size >= 10_000)
    return `${formatNumber(Math.round(size / 100) / 10)}k sq.ft`;
  return `${formatNumber(size)} sq.ft`;
}

/** Price per square foot, rounded to keep the card grid aligned. */
export function pricePerSqft(price?: number | null, size?: number | null) {
  if (!price || !size) return null;
  const value = price / size;
  return value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
}

export function formatPriceDelta(oldPrice?: number, newPrice?: number) {
  if (oldPrice === undefined || newPrice === undefined) return null;
  const delta = newPrice - oldPrice;
  if (delta === 0) return { direction: "flat" as const, percent: 0, delta: 0 };
  const percent = Math.round((delta / oldPrice) * 1000) / 10;
  return {
    direction: delta > 0 ? ("up" as const) : ("down" as const),
    percent: Math.abs(percent),
    delta,
  };
}

export function formatDistance(metres?: number | null) {
  if (metres === null || metres === undefined) return "—";
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(metres < 10_000 ? 1 : 0)} km`;
}

const BED_LABELS = ["Studio", "1 bed", "2 beds", "3 beds", "4 beds", "5+ beds"];
export function bedsLabel(beds?: number | null) {
  if (beds === null || beds === undefined) return null;
  const index = Math.max(0, Math.min(5, beds));
  return BED_LABELS[index] ?? `${beds} beds`;
}

export function pluralise(count: number, singular: string, plural?: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/**
 * Reads the id out of a reference that may arrive as a bare id or as a
 * populated document — list endpoints populate `ownerId`/`agentId`, detail
 * endpoints usually do not.
 */
export function idOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}
