export type LatLng = { lat: number; lng: number };

/** GeoJSON coordinate pair, always `[longitude, latitude]`. */
export type Ring = [number, number][];

/**
 * One decimal coordinate, non-capturing so callers can wrap it and keep their
 * own capture indices — a capturing group here would shift every index.
 */
const NUMBER = "(?:-?\\d{1,3}(?:\\.\\d+)?)";

const SHORT_LINK =
  /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|maps\.googleusercontent\.com)/i;

const inRange = (lat: number, lng: number) =>
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

type CapturedPair = { latGroup: number; lngGroup: number };

function coordinatesIn(input: string): LatLng | undefined {
  // `!4d`/`!3d` puts longitude first, everything else puts latitude first, so
  // each pattern declares its own capture order rather than assuming one.
  const patterns: { pattern: RegExp; pair: CapturedPair }[] = [
    // /data=!3m1!4b1!4d<lng>!3d<lat>
    {
      pattern: new RegExp(`!4d(${NUMBER})!3d(${NUMBER})`, "i"),
      pair: { latGroup: 2, lngGroup: 1 },
    },
    // ?q= / &ll= / /place/<lat>,<lng>
    {
      pattern: new RegExp(`[?&](?:q|ll|center)=(${NUMBER}),(${NUMBER})`, "i"),
      pair: { latGroup: 1, lngGroup: 2 },
    },
    {
      pattern: new RegExp(`/place/[^/]*?(${NUMBER}),(${NUMBER})`, "i"),
      pair: { latGroup: 1, lngGroup: 2 },
    },
    // @<lat>,<lng>,<zoom>z
    {
      pattern: new RegExp(`@(${NUMBER}),(${NUMBER})`, "i"),
      pair: { latGroup: 1, lngGroup: 2 },
    },
  ];

  for (const { pattern, pair } of patterns) {
    const match = pattern.exec(input);
    if (!match) continue;

    const lat = Number(match[pair.latGroup]);
    const lng = Number(match[pair.lngGroup]);
    // Each pattern states its own order, and both of these sources put latitude
    // first, so the pair is taken as declared rather than guessed at.
    if (inRange(lat, lng)) return { lat, lng };
  }
  return undefined;
}

/**
 * A bare `lat, lng` pair, as copied from the Maps right-click menu. Maps always
 * prints latitude first, so the order is taken literally.
 */
function barePair(input: string): LatLng | undefined {
  const match = new RegExp(`^\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*$`).exec(
    input,
  );
  if (!match) return undefined;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return inRange(lat, lng) ? { lat, lng } : undefined;
}

export type ParsedLocation = {
  point?: LatLng;
  label?: string;
  warning?: string;
};

/**
 * Pull coordinates out of anything a user is likely to paste from Maps.
 *
 * Handles share links, place URLs, `@lat,lng,zoom` fragments and bare pairs.
 * Google orders share-link coordinates latitude-first, which is the opposite of
 * GeoJSON, so the result is normalised here rather than at every call site.
 */
export function parseLocationInput(raw: string): ParsedLocation | null {
  const input = raw.trim();
  if (!input) return null;

  if (SHORT_LINK.test(input)) {
    return {
      warning:
        "That is a shortened Maps link, which cannot be resolved here. Open it, copy the full URL from the address bar, or paste the lat, lng pair instead.",
    };
  }

  const point = coordinatesIn(input) ?? barePair(input);
  if (!point) {
    return {
      warning:
        "No coordinates found in that link. Make sure it is a Google Maps link containing /maps/, or paste a `latitude, longitude` pair.",
    };
  }

  return { point, label: describePoint(point) };
}

export function describePoint({ lat, lng }: LatLng) {
  return `${formatCoordinate(lat)}, ${formatCoordinate(lng)}`;
}

export function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(6) : "—";
}

export function parseNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Reads two numeric inputs as a point, returning undefined unless both parse. */
export function pointFromInputs(lat: string, lng: string): LatLng | undefined {
  const latValue = parseNumber(lat);
  const lngValue = parseNumber(lng);
  if (latValue === undefined || lngValue === undefined) return undefined;
  if (Math.abs(latValue) > 90 || Math.abs(lngValue) > 180) return undefined;
  return { lat: latValue, lng: lngValue };
}

/** A single vertex in GeoJSON `[lng, lat]` order. */
export function pointToRing({ lat, lng }: LatLng): [number, number] {
  return [lng, lat];
}

export function ringToPoint(ring: Ring | undefined): LatLng | undefined {
  const first = ring?.[0];
  if (!first) return undefined;
  return { lat: first[1], lng: first[0] };
}

export function ringIsClosed(ring: Ring): boolean {
  if (ring.length < 2) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

/** Closes a ring for submission. The server rejects unclosed rings with 400. */
export function closeRing(ring: Ring): Ring {
  if (ring.length === 0 || ringIsClosed(ring)) return ring;
  return [...ring, ring[0]];
}

export function isValidRing(ring: Ring): boolean {
  return ring.length >= 4 && ringIsClosed(closeRing(ring));
}

/** Swaps a ring in and out of `[lng, lat]` order — the usual authoring mistake. */
export function swapRingOrder(ring: Ring): Ring {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

/** Drops any malformed entries so the result is safe to spread into Leaflet. */
export function toRing(ring: Ring): Ring {
  return ring.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1])),
  );
}

export function centroid(ring: Ring): LatLng | undefined {
  const points = toRing(ring);
  if (points.length === 0) return undefined;
  const lng = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const lat = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  return { lat, lng };
}

/** Smallest box containing every vertex, as `[[south, west], [north, east]]`. */
export function boundsOf(
  ring: Ring,
): [[number, number], [number, number]] | undefined {
  const points = toRing(ring);
  if (points.length === 0) return undefined;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

/** Parses a pasted GeoJSON Polygon, ring or coordinate list into a ring. */
export function parseRingInput(raw: string): Ring {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const parsed: unknown = JSON.parse(trimmed);
  const candidate = Array.isArray(parsed)
    ? parsed
    : (parsed as { type?: string; coordinates?: unknown })?.type === "Polygon"
      ? ((parsed as { coordinates: unknown[] }).coordinates?.[0] as unknown[])
      : undefined;

  if (!Array.isArray(candidate)) {
    throw new Error(
      "Expected a coordinate list, or a GeoJSON Polygon to read the outer ring from",
    );
  }

  const ring = candidate.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1])),
  ) as Ring;

  if (ring.length === 0) {
    throw new Error("No valid [lng, lat] points found");
  }

  return ring;
}

export const DEFAULT_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };
