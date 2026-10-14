import {
  BathIcon,
  BedDoubleIcon,
  Building2Icon,
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
import type { Property, PropertyMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Deterministic gradient so every card gets stable, distinct placeholder art. */
function placeholderStyle(property: Property) {
  const seed = (property._id ?? property.title ?? "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const hue = 150 + (seed % 90);
  return {
    backgroundImage: `linear-gradient(135deg, oklch(0.95 0.03 ${hue}) 0%, oklch(0.88 0.06 ${hue + 18}) 55%, oklch(0.82 0.07 ${hue + 30}) 100%)`,
  };
}

function firstImage(media?: PropertyMedia[]) {
  return media?.find((item) => item.type === "image")?.url;
}

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
}: {
  property: Property;
  media?: PropertyMedia[];
  /** Supplied by the parent so the card itself stays store-agnostic. */
  onFavoriteClick: () => void;
  className?: string;
  footer?: React.ReactNode;
}) {
  const image = firstImage(media);
  const perSqft = pricePerSqft(property.price, property.size);
  const isVerified = Boolean(property.verifiedAt);

  return (
    <article
      className={cn(
        "group bg-card lift-hover relative flex flex-col overflow-hidden rounded-2xl border",
        className,
      )}
    >
      <Link
        to={`/properties/${property._id}`}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={property.title}
      >
        {image ? (
          <img
            src={image}
            alt={property.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="grid-dots flex size-full items-center justify-center"
            style={placeholderStyle(property)}
          >
            <Building2Icon className="size-10 text-foreground/25" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-background/92 text-foreground backdrop-blur-sm">
              {property.purpose === "rent" ? "For rent" : "For sale"}
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

        {property.status !== "active" && (
          <div className="absolute inset-x-0 bottom-0 bg-foreground/85 px-3 py-1.5 text-center text-xs font-medium text-background capitalize backdrop-blur-sm">
            {property.status}
          </div>
        )}
      </Link>

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
              {property.title}
            </Link>
          </h3>
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
            <MapPinIcon className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-1">
              {property.address ?? "Address on request"}
            </span>
          </p>
        </div>

        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t pt-3 text-xs">
          {property.beds !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <BedDoubleIcon className="size-3.5" />
              {bedsLabel(property.beds)}
            </span>
          )}
          {property.baths !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <BathIcon className="size-3.5" />
              {property.baths} bath
            </span>
          )}
          {property.size ? (
            <span className="inline-flex items-center gap-1.5">
              <MaximizeIcon className="size-3.5" />
              {formatSize(property.size)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">
            {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
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
  property,
  media,
  onFavoriteClick,
  actions,
}: {
  property: Property;
  media?: PropertyMedia[];
  onFavoriteClick: () => void;
  actions?: React.ReactNode;
}) {
  const image = firstImage(media);

  return (
    <article className="group bg-card flex gap-4 rounded-xl border p-3 transition-colors hover:border-primary/30">
      <Link
        to={`/properties/${property._id}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg sm:size-28"
      >
        {image ? (
          <img
            src={image}
            alt={property.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="grid-dots flex size-full items-center justify-center"
            style={placeholderStyle(property)}
          >
            <Building2Icon className="size-6 text-foreground/25" />
          </div>
        )}
      </Link>

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
