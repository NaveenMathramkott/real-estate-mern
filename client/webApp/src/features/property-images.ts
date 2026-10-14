import type { Property, PropertyMedia } from "@/lib/types";

/**
 * The property's image urls, in display order.
 *
 * Search and listing responses already carry `images` (plus a `thumbnail`
 * shortcut) assembled by the API from the property's media, so a card never
 * needs its own detail request. The detail endpoint returns `media` instead,
 * so both sources are accepted and merged with `images` winning on order.
 */
export function propertyImages(
  property?: Pick<Property, "images" | "thumbnail"> | null,
  media?: PropertyMedia[],
  explicit?: string[],
): string[] {
  const fromCaller = explicit?.filter(Boolean) ?? [];
  if (fromCaller.length > 0) return fromCaller;

  const fromResponse = property?.images?.filter(Boolean) ?? [];
  if (fromResponse.length > 0) return fromResponse;

  const fromMedia = (media ?? [])
    .filter((item) => item.type === "image" && Boolean(item.url))
    .sort((a, b) => a.order - b.order)
    .map((item) => item.url);
  if (fromMedia.length > 0) return fromMedia;

  // `thumbnail` is always images[0] when present, but honour it on its own in
  // case a list response ever carries just the one field.
  return property?.thumbnail ? [property.thumbnail] : [];
}

/** The cover image for a card, or `undefined` when the listing has none. */
export function propertyCover(
  property?: Pick<Property, "images" | "thumbnail"> | null,
  media?: PropertyMedia[],
): string | undefined {
  return propertyImages(property, media)[0];
}

/**
 * Deterministic gradient so an image-less listing still reads as designed
 * rather than as a broken card. Seeded from the id, so a given listing always
 * gets the same artwork.
 */
export function placeholderArt(property?: Pick<Property, "_id" | "title">) {
  const seed = (property?._id ?? property?.title ?? "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const hue = 150 + (seed % 90);
  return {
    backgroundImage: `linear-gradient(135deg, oklch(0.95 0.03 ${hue}) 0%, oklch(0.88 0.06 ${hue + 18}) 55%, oklch(0.82 0.07 ${hue + 30}) 100%)`,
  };
}

/**
 * A cover image that survives a dead URL. Google thumbnail links are short
 * lived, so an `onError` that falls back to the artwork stops the browser's
 * broken-image glyph taking over the card.
 */
export function coverImageProps(property?: Pick<Property, "_id" | "title">) {
  const art = placeholderArt(property);
  return {
    art,
    style: { backgroundImage: art.backgroundImage },
  };
}
