import * as React from "react";

import { PropertyTypeIcon } from "@/features/property-type-icon";
import { propertyTypeLabel } from "@/lib/constants";
import { placeholderArt, propertyImages } from "@/features/property-images";
import { usePropertyDetails } from "@/store/property-details-store";
import type { Property, PropertyMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Fires once when the element scrolls into view, so a card only asks for its
 * media when it is actually about to be seen. The callback is expected to be
 * memoised; a changing identity simply re-runs the effect, which bails out
 * once the trigger has fired.
 */
function useInView<T extends HTMLElement>(
  onEnter: () => void,
  options: IntersectionObserverInit = { rootMargin: "300px" },
  eager = false,
) {
  const ref = React.useRef<T>(null);
  const fired = React.useRef(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || fired.current) return;
    // Short lists resolve straight away: waiting for a below-the-fold card to
    // scroll into view just means a page of placeholders on first paint.
    if (eager) {
      fired.current = true;
      onEnter();
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      fired.current = true;
      onEnter();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      fired.current = true;
      onEnter();
      observer.disconnect();
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onEnter, options, eager]);

  return ref;
}

/** Stable observer config, so the effect above does not re-run every render. */
const VIEWPORT_MARGIN: IntersectionObserverInit = { rootMargin: "300px" };

/**
 * Cover image for a listing.
 *
 * Three states, in order of preference: images already on the payload, media
 * fetched on demand because the endpoint returned a partial property, and
 * seeded artwork. The artwork also replaces an image that fails to load —
 * third-party thumbnail links in this dataset go stale, and a broken-image
 * glyph is far worse than an empty, on-brand panel.
 */
export function PropertyCover({
  property,
  images,
  media,
  alt,
  className,
  iconSize = "size-10",
  /** Set false for decorative covers that need no network work. */
  resolve = true,
  /** Resolve immediately instead of waiting for the card to scroll into view. */
  eager = false,
  children,
}: {
  property?: Pick<Property, "_id" | "title" | "type" | "images" | "thumbnail">;
  /** Pre-resolved urls; falls back to the property's own `images` then `media`. */
  images?: string[];
  media?: PropertyMedia[];
  alt?: string;
  className?: string;
  iconSize?: string;
  resolve?: boolean;
  /** Resolve immediately instead of waiting for the card to scroll into view. */
  eager?: boolean;
  /** Overlay content, positioned over the image. */
  children?: React.ReactNode;
}) {
  const art = placeholderArt(property);
  const id = property?._id;

  // Watch the whole store so a resolution for this id re-renders the cover.
  const resolved = usePropertyDetails((s) => (id ? s.details[id] : undefined));
  const resolveProperty = usePropertyDetails((s) => s.resolve);

  const known = propertyImages(
    images?.length ? { images } : resolved ? resolved : property,
    media,
  );
  const wanted = known[0] ?? null;

  const handleEnter = React.useCallback(() => {
    if (resolve && id && wanted === null) void resolveProperty(id);
  }, [resolve, id, wanted, resolveProperty]);

  const ref = useInView<HTMLDivElement>(handleEnter, VIEWPORT_MARGIN, eager);

  const [src, setSrc] = React.useState<string | null>(wanted);
  const [loadedFor, setLoadedFor] = React.useState(wanted);
  // A newly uploaded cover has to replace the old src.
  if (wanted !== loadedFor) {
    setLoadedFor(wanted);
    setSrc(wanted);
  }

  return (
    <div
      ref={ref}
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
