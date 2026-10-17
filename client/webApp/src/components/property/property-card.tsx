import {
  BathIcon,
  BedDoubleIcon,
  CheckCircle2Icon,
  HeartIcon,
  MapPinIcon,
  MaximizeIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavoriteIds } from "@/store/favorites-store";
import {
  bedsLabel,
  formatListingPrice,
  formatSize,
  pricePerSqft,
} from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { PropertyCover } from "@/components/property/property-cover";
import { propertyImages } from "@/features/property-images";
import {
  mergeProperty,
  usePropertyDetails,
} from "@/store/property-details-store";
import type { Property, PropertyMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  propertyId,
  className,
  size = "icon",
  onRequireAuth,
}: {
  propertyId: string;
  className?: string;
  size?: "icon" | "icon-sm";
  onRequireAuth: () => void;
}) {
  const favorites = useFavoriteIds();
  const isFavorite = favorites.includes(propertyId);

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from shortlist" : "Add to shortlist"}
      className={cn(
        "bg-background/90 backdrop-blur-sm hover:bg-background",
        className,
      )}
      onClick={(event) => {
        // The whole card is a link — don't let the heart navigate.
        event.preventDefault();
        event.stopPropagation();
        onRequireAuth();
      }}
    >
      <HeartIcon
        className={cn(
          "size-4 transition-colors",
          isFavorite && "fill-destructive text-destructive",
        )}
      />
    </Button>
  );
}

export function PropertyCard({
  property,
  media,
  onFavoriteClick,
  className,
  footer,
  eager = false,
}: {
  property: Property;
  media?: PropertyMedia[];
  /** Supplied by the parent so the card itself stays store-agnostic. */
  onFavoriteClick: () => void;
  className?: string;
  footer?: React.ReactNode;
  eager?: boolean;
}) {
  // `/favorites` and the dashboards hand back a field subset, so pull the full
  // record when it has been resolved and fill in anything missing.
  const resolved = usePropertyDetails((s) => s.details[property._id]);
  const merged = mergeProperty(property, resolved);
  const images = propertyImages(merged, media);
  const perSqft = pricePerSqft(merged.price, merged.size);
  const isVerified = Boolean(merged.verifiedAt);

  return (
    <article
      className={cn(
        "group bg-card lift-hover relative flex flex-col overflow-hidden rounded-2xl border",
        className,
      )}
    >
      <PropertyCover
        property={property}
        images={images}
        media={media}
        alt={property.title}
        eager={eager}
        className="relative block aspect-[4/3] [&>img]:transition-transform [&>img]:duration-700 [&>img]:ease-out group-hover:[&>img]:scale-105"
      >
        <Link
          to={`/properties/${property._id}`}
          className="absolute inset-0"
          aria-label={property.title}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-background/92 text-foreground backdrop-blur-sm">
              {merged.purpose === "rent" ? "For rent" : "For sale"}
            </Badge>
            {isVerified && (
              <Badge className="bg-success/95 text-success-foreground backdrop-blur-sm">
                <CheckCircle2Icon />
                Verified
              </Badge>
            )}
          </div>
          <FavoriteButton
            propertyId={property._id}
            onRequireAuth={onFavoriteClick}
            className="shadow-sm"
          />
        </div>

        {merged.status !== "active" && (
          <div className="absolute inset-x-0 bottom-0 bg-foreground/85 px-3 py-1.5 text-center text-xs font-medium text-background capitalize backdrop-blur-sm">
            {merged.status}
          </div>
        )}

        {images.length > 1 && (
          <span className="bg-foreground/70 text-background absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-[11px] font-medium tabular backdrop-blur-sm">
            1 / {images.length}
          </span>
        )}
      </PropertyCover>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-xl leading-none font-medium tracking-tight tabular">
            {formatListingPrice(
              property.price,
              property.currency,
              property.purpose,
            )}
          </p>
          {perSqft && (
            <span className="text-muted-foreground mt-1 text-xs tabular">
              ₹{perSqft}/sq.ft
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-sm font-medium">
            <Link
              to={`/properties/${property._id}`}
              className="transition-colors hover:text-primary"
            >
              {merged.title}
            </Link>
          </h3>
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
            <MapPinIcon className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-1">
              {merged.address ?? "Address on request"}
            </span>
          </p>
        </div>

        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t pt-3 text-xs">
          {merged.beds !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <BedDoubleIcon className="size-3.5" />
              {bedsLabel(merged.beds)}
            </span>
          )}
          {merged.baths !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <BathIcon className="size-3.5" />
              {merged.baths} bath
            </span>
          )}
          {merged.size ? (
            <span className="inline-flex items-center gap-1.5">
              <MaximizeIcon className="size-3.5" />
              {formatSize(merged.size)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">
            {PROPERTY_TYPE_LABELS[merged.type] ?? merged.type}
          </Badge>
          {property.furnished && property.furnished !== "unfurnished" && (
            <Badge variant="muted">
              {property.furnished === "furnished"
                ? "Furnished"
                : "Semi-furnished"}
            </Badge>
          )}
          {(property.reviews?.count ?? 0) > 0 && (
            <Badge variant="gold">
              ★ {property.reviews?.average?.toFixed(1)}
            </Badge>
          )}
        </div>

        {footer}
      </div>
    </article>
  );
}

/** Dense horizontal variant for dashboards and search results in map mode. */
export function PropertyRow({
  property: base,
  media,
  onFavoriteClick,
  actions,
  eager = false,
}: {
  property: Property;
  media?: PropertyMedia[];
  onFavoriteClick: () => void;
  actions?: React.ReactNode;
  eager?: boolean;
}) {
  const resolved = usePropertyDetails((s) => s.details[base._id]);
  const property = mergeProperty(base, resolved);

  return (
    <article className="group bg-card flex gap-4 rounded-xl border p-3 transition-colors hover:border-primary/30">
      <PropertyCover
        property={property}
        media={media}
        alt={property.title}
        eager={eager}
        iconSize="size-6"
        className="size-24 shrink-0 rounded-lg sm:size-28 [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
      >
        <Link
          to={`/properties/${property._id}`}
          className="absolute inset-0"
          aria-label={property.title}
        />
      </PropertyCover>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-lg leading-none font-medium tabular">
            {formatListingPrice(
              property.price,
              property.currency,
              property.purpose,
            )}
          </p>
          <FavoriteButton
            propertyId={property._id}
            size="icon-sm"
            onRequireAuth={onFavoriteClick}
          />
        </div>
        <Link
          to={`/properties/${property._id}`}
          className="truncate text-sm font-medium transition-colors hover:text-primary"
        >
          {property.title}
        </Link>
        <p className="text-muted-foreground truncate text-xs">
          {property.address ?? "Address on request"}
        </p>
        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-3 text-xs">
          {property.beds !== undefined && (
            <span>{bedsLabel(property.beds)}</span>
          )}
          {property.baths !== undefined && <span>{property.baths} bath</span>}
          {property.size ? <span>{formatSize(property.size)}</span> : null}
          <Badge variant="muted" className="ml-auto capitalize">
            {property.status}
          </Badge>
        </div>
        {actions}
      </div>
    </article>
  );
}
