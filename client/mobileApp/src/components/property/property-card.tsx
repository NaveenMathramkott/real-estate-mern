import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { formatListingPrice, formatSize, pricePerSqft } from "@/lib/format";
import { propertyTypeLabel } from "@/lib/constants";
import type { Property } from "@/lib/types";
import { useTheme } from "@/theme";
import { Badge, Card, Txt } from "@/components/ui/primitives";
import { useFavoriteAction } from "@/hooks/use-favorite-action";
import { useIsFavorite, useIsFavoritePending } from "@/store/favorites-store";
import { PropertyTypeIcon } from "./property-type-icon";

/** Cover image with a deterministic gradient fallback for listings that have
 *  no hosted media yet — the web app uses the same placeholder-art approach. */
export function PropertyCover({
  property,
  height = 180,
  rounded = 12,
}: {
  property: Pick<Property, "thumbnail" | "images" | "title" | "type">;
  height?: number;
  rounded?: number;
}) {
  const theme = useTheme();
  const uri = property.thumbnail ?? property.images?.[0];
  const placeholder = [theme.primary, theme.gold, theme.info][
    (property.title?.length ?? 0) % 3
  ];

  return (
    <View
      style={{
        height,
        borderRadius: rounded,
        overflow: "hidden",
        backgroundColor: theme.accent,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          recyclingKey={property.thumbnail ?? undefined}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: placeholder,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <PropertyTypeIcon
            type={property.type}
            size={28}
            color="rgba(255,255,255,0.85)"
          />
        </View>
      )}
    </View>
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
  const theme = useTheme();
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
      hitSlop={8}
      onPress={() => void onFavorite(propertyId)}
      style={[
        styles.favorite,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.surface,
          opacity: isPending ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons
        name={isFavorite ? "heart" : "heart-outline"}
        size={size * 0.52}
        color={isFavorite ? theme.destructive : theme.foreground}
      />
    </Pressable>
  );
}

function SpecRow({ property }: { property: Property }) {
  const theme = useTheme();
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
    <View style={styles.specRow}>
      {items.map((item, index) => (
        <View key={item.icon} style={styles.specItem}>
          <Ionicons name={item.icon} size={13} color={theme.foregroundMuted} />
          <Txt variant="tiny" tone="muted">
            {item.label}
          </Txt>
          {index < items.length - 1 ? (
            <View style={styles.specDivider} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Primary listing card — the mobile equivalent of the web `PropertyCard`. */
export function PropertyCard({ property }: { property: Property }) {
  const theme = useTheme();
  const router = useRouter();
  const perSqft = pricePerSqft(property.price, property.size);
  const imageCount = property.images?.length ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${formatListingPrice(
        property.price,
        property.currency,
        property.purpose,
      )}`}
      onPress={() => router.push(`/property/${property._id}`)}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <Card padded={false} style={{ overflow: "hidden" }}>
        <View>
          <PropertyCover property={property} height={168} rounded={0} />
          <View style={styles.coverTopRow}>
            <Badge tone={property.purpose === "rent" ? "primary" : "info"}>
              {property.purpose === "rent" ? "For rent" : "For sale"}
            </Badge>
            {property.verifiedAt ? (
              <Badge tone="success">Verified</Badge>
            ) : null}
          </View>
          <View style={styles.coverBottomRow}>
            {property.status !== "active" ? (
              <Badge tone="warning">{property.status}</Badge>
            ) : null}
            {imageCount > 1 ? (
              <View
                style={[styles.imageCount, { backgroundColor: theme.overlay }]}
              >
                <Ionicons name="images-outline" size={11} color="#FFFFFF" />
                <Txt variant="tiny" style={styles.imageCountText}>
                  {imageCount}
                </Txt>
              </View>
            ) : null}
          </View>
          <View style={styles.favoriteSlot}>
            <FavoriteButton propertyId={property._id} />
          </View>
        </View>

        <View style={{ padding: 12, gap: 6 }}>
          <Txt variant="subheading" numberOfLines={1}>
            {property.title}
          </Txt>
          <View style={styles.priceRow}>
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
          </View>

          <SpecRow property={property} />

          <View style={styles.badgeRow}>
            <Badge tone="muted">
              <PropertyTypeIcon type={property.type} />
              {propertyTypeLabel(property.type)}
            </Badge>
            {property.furnished ? (
              <Badge tone="muted">{property.furnished.replace("-", " ")}</Badge>
            ) : null}
          </View>

          {property.address ? (
            <View style={styles.addressRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.foregroundMuted}
              />
              <Txt
                variant="tiny"
                tone="muted"
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {property.address}
              </Txt>
            </View>
          ) : null}
        </View>
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
  trailing?: React.ReactNode;
}) {
  const theme = useTheme();
  const router = useRouter();
  const size = formatSize(property.size);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/property/${property._id}`)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.accent : theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <PropertyCover property={property} height={64} rounded={8} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {property.title}
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
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  coverTopRow: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  coverBottomRow: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  favoriteSlot: { position: "absolute", top: 8, right: 8 },
  favorite: { alignItems: "center", justifyContent: "center" },
  imageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imageCountText: { color: "#FFFFFF" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  specRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specDivider: {
    width: StyleSheet.hairlineWidth,
    height: 12,
    backgroundColor: "#CBD6D1",
    marginLeft: 6,
  },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
