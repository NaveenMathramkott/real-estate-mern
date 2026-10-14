import * as React from "react";

import { PropertyTypeIcon } from "@/features/property-type-icon";
import { propertyTypeLabel } from "@/lib/constants";
import { placeholderArt, propertyImages } from "@/features/property-images";
import type { Property, PropertyMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Cover image for a listing.
 *
 * Falls back to seeded artwork whenever the listing has no image, and again if
 * the URL 404s — image links in this dataset are frequently third-party
 * thumbnails that go stale, and a broken-image glyph is far worse than an
 * empty, on-brand panel.
 */
export function PropertyCover({
  property,
  images,
  media,
  alt,
  className,
  iconSize = "size-10",
  children,
}: {
  property?: Pick<Property, "_id" | "title" | "type" | "images" | "thumbnail">;
  /** Pre-resolved urls; falls back to the property's own `images` then `media`. */
  images?: string[];
  media?: PropertyMedia[];
  alt?: string;
  className?: string;
  iconSize?: string;
  /** Overlay content, positioned over the image. */
  children?: React.ReactNode;
}) {
  const art = placeholderArt(property);
  const wanted = propertyImages(property, media, images)[0] ?? null;
  const [src, setSrc] = React.useState<string | null>(wanted);

  // A new listing (or a newly uploaded cover) has to replace the old src.
  const [loadedFor, setLoadedFor] = React.useState(wanted);
  if (wanted !== loadedFor) {
    setLoadedFor(wanted);
    setSrc(wanted);
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={art}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? property?.title ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => setSrc(null)}
          className="size-full object-cover"
        />
      ) : (
        <div className="grid-dots flex size-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <PropertyTypeIcon
              type={property?.type}
              className={cn("text-foreground/20", iconSize)}
            />
            <span className="text-foreground/25 text-[11px] font-medium tracking-wide uppercase">
              {propertyTypeLabel(property?.type)}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
