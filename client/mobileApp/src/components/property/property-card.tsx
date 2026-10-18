import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import type { ReactNode } from "react";

import { useFavoriteAction } from "@/hooks/use-favorite-action";
import { formatListingPrice, formatSize, pricePerSqft } from "@/lib/format";
import { propertyTypeLabel } from "@/lib/constants";
import type { Property } from "@/lib/types";
import { useIsFavorite, useIsFavoritePending } from "@/store/favorites-store";
import { Box } from "@/components/ui/box";
import { Image as GSImage } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Text as GSText } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Badge, Card, Txt } from "@/components/ui/primitives";
import { PropertyTypeIcon } from "./property-type-icon";

/** Cover image with a deterministic accent fallback for listings that have no
 *  hosted media yet — the same placeholder-art approach the web client uses. */
export function PropertyCover({
  property,
  height = 180,
  rounded = 12,
}: {
  property: Pick<Property, "thumbnail" | "images" | "title" | "type">;
  height?: number;
  rounded?: number;
}) {
  const uri = property.thumbnail ?? property.images?.[0];
  const placeholder = ["bg-primary", "bg-gold", "bg-info"][
    (property.title?.length ?? 0) % 3
  ];

  // Measured instead of relying on `w-full`: the card can be rendered at a
  // width the screen query does not know about (dashboards, list rows).
  const [containerWidth, setContainerWidth] = React.useState(0);
  const boxWidth = containerWidth || undefined;

  return (
    <Box
      className="overflow-hidden bg-accent"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      style={{ width: boxWidth, height, borderRadius: rounded }}
    >
      {uri ? (
        <GSImage
          source={{ uri }}
          resizeMode="cover"
          alt={property.title}
          style={{ width: boxWidth, height }}
        />
      ) : (
        <Box
          className={`h-full w-full items-center justify-center ${placeholder}`}
        >
          <PropertyTypeIcon
            type={property.type}
            size={28}
            color="rgba(255,255,255,0.85)"
          />
        </Box>
      )}
    </Box>
  );
}

/** Shortlist heart, sized for a card corner. Optimistic via the favourites store. */
export function FavoriteButton({
  propertyId,
  size = 34,
}: {
  propertyId: string;
  size?: number;
}) {
  const isFavorite = useIsFavorite(propertyId);
  const isPending = useIsFavoritePending(propertyId);
  const onFavorite = useFavoriteAction();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isFavorite, busy: isPending }}
      accessibilityLabel={
        isFavorite ? "Remove from shortlist" : "Add to shortlist"
      }
      onPress={() => void onFavorite(propertyId)}
      className="items-center justify-center rounded-full border border-border bg-card"
      style={{ width: size, height: size, opacity: isPending ? 0.6 : 1 }}
    >
      <Ionicons
        name={isFavorite ? "heart" : "heart-outline"}
        size={size * 0.52}
        color={isFavorite ? "#D4483A" : "#0B2A23"}
      />
    </Pressable>
  );
}

function SpecRow({ property }: { property: Property }) {
  const size = formatSize(property.size);
  const items = [
    {
      icon: "bed-outline" as const,
      label: property.beds ? `${property.beds}` : "—",
    },
    {
      icon: "water-outline" as const,
      label: property.baths ? `${property.baths}` : "—",
    },
    { icon: "resize-outline" as const, label: size ?? "—" },
  ];

  return (
    <Box className="flex-row items-center gap-2.5">
      {items.map((item, index) => (
        <Box key={item.icon} className="flex-row items-center gap-1">
          <Ionicons name={item.icon} size={13} color="#647771" />
          <Txt variant="tiny" tone="muted">
            {item.label}
          </Txt>
          {index < items.length - 1 ? (
            <Box className="ml-1.5 h-3 w-px bg-border" />
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

/** Primary listing card — the mobile equivalent of the web `PropertyCard`. */
export function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const imageCount = property.images?.length ?? 0;
  const perSqft = pricePerSqft(property.price, property.size);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${property.title ?? "Listing"}, ${formatListingPrice(
        property.price,
        property.currency,
        property.purpose,
      )}`}
      onPress={() => router.push(`/property/${property._id}`)}
    >
      <Card padded={false} className="overflow-hidden">
        <Box>
          <PropertyCover property={property} height={168} rounded={0} />

          <Box className="absolute left-2.5 top-2.5 flex-row gap-1.5">
            <Badge tone={property.purpose === "rent" ? "primary" : "info"}>
              {property.purpose === "rent" ? "For rent" : "For sale"}
            </Badge>
            {property.verifiedAt ? (
              <Badge tone="success">Verified</Badge>
            ) : null}
          </Box>

          <Box className="absolute bottom-2.5 left-2.5 flex-row items-center gap-1.5">
            {property.status && property.status !== "active" ? (
              <Badge tone="warning">{property.status}</Badge>
            ) : null}
            {imageCount > 1 ? (
              <Box className="flex-row items-center gap-1 rounded-md bg-black/45 px-2 py-0.5">
                <Ionicons name="images-outline" size={11} color="#FFFFFF" />
                <GSText className="text-xs text-white">{imageCount}</GSText>
              </Box>
            ) : null}
          </Box>

          <Box className="absolute right-2 top-2">
            <FavoriteButton propertyId={property._id} />
          </Box>
        </Box>

        <VStack space="xs" className="p-3">
          <Txt variant="subheading" numberOfLines={1}>
            {property.title ?? "Untitled listing"}
          </Txt>

          <Box className="flex-row items-baseline gap-2">
            <Txt variant="heading">
              {formatListingPrice(
                property.price,
                property.currency,
                property.purpose,
              )}
            </Txt>
            {perSqft ? (
              <Txt variant="tiny" tone="muted">
                ₹{perSqft}/sq.ft
              </Txt>
            ) : null}
          </Box>

          <SpecRow property={property} />

          <Box className="flex-row flex-wrap gap-1.5">
            <Badge tone="muted">
              <PropertyTypeIcon type={property.type} />
              {propertyTypeLabel(property.type)}
            </Badge>
            {property.furnished ? (
              <Badge tone="muted">{property.furnished.replace("-", " ")}</Badge>
            ) : null}
          </Box>

          {property.address ? (
            <Box className="mt-0.5 flex-row items-center gap-1">
              <Ionicons name="location-outline" size={12} color="#647771" />
              <Txt
                variant="tiny"
                tone="muted"
                numberOfLines={1}
                className="flex-1"
              >
                {property.address}
              </Txt>
            </Box>
          ) : null}
        </VStack>
      </Card>
    </Pressable>
  );
}

/** Dense horizontal variant used by dashboards and the favourites list. */
export function PropertyRow({
  property,
  trailing,
}: {
  property: Property;
  trailing?: ReactNode;
}) {
  const router = useRouter();
  const size = formatSize(property.size);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/property/${property._id}`)}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-2.5"
    >
      <PropertyCover property={property} height={64} rounded={8} />
      <VStack space="xs" className="flex-1">
        <Txt variant="bodyStrong" numberOfLines={1}>
          {property.title ?? "Untitled listing"}
        </Txt>
        <Txt variant="small" tone="primary">
          {formatListingPrice(
            property.price,
            property.currency,
            property.purpose,
          )}
        </Txt>
        <Txt variant="tiny" tone="muted" numberOfLines={1}>
          {[
            property.beds ? `${property.beds} bed` : null,
            size,
            property.address,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Txt>
      </VStack>
      {trailing}
    </Pressable>
  );
}
