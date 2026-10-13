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
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "") || value.slice(0, 2);
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
