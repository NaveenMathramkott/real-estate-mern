import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conversationApi, propertyApi, reviewApi } from "@/lib/api";
import {
  formatCurrency,
  formatDateTime,
  formatListingPrice,
  formatPriceDelta,
  formatRelative,
  formatShortDate,
  idOf,
  pricePerSqft,
} from "@/lib/format";
import { propertyTypeLabel } from "@/lib/constants";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { useIsFavorite } from "@/store/favorites-store";
import { useFavoriteAction } from "@/hooks/use-favorite-action";
import { useTheme } from "@/theme";
import {
  AMENITY_ICONS,
  PropertyTypeIcon,
} from "@/components/property/property-type-icon";
import { StarPicker, Stars } from "@/components/property/rating";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyMap } from "@/components/property/property-map";
import { PropertyCard } from "@/components/property/property-card";
import { Badge, Button, Divider, Txt } from "@/components/ui/primitives";
import {
  Modal as GSModal,
  ModalBackdrop as GSModalBackdrop,
  ModalBody as GSModalBody,
  ModalContent as GSModalContent,
  ModalFooter as GSModalFooter,
  ModalHeader as GSModalHeader,
} from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/form";
import {
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingBlock,
  SectionCard,
  SectionHeading,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

export default function PropertyDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id: string }>();

  const user = useAuthStore((state) => state.user)!;
  const isShortlisted = useIsFavorite(id);
  const onFavorite = useFavoriteAction();

  const detail = useQuery(id ? `get|/properties/${id}` : null, () =>
    propertyApi.detail(id),
  );
  const similar = useQuery(id ? `get|/properties/${id}/similar` : null, () =>
    propertyApi.similar(id),
  );

  const [inquiryOpen, setInquiryOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const property = detail.data?.property;
  const media = detail.data?.media ?? [];

  const sendInquiry = useMutation({
    mutationFn: () => propertyApi.inquire(id, message),
    successMessage: "Enquiry sent",
    onSuccess: () => {
      setInquiryOpen(false);
      setMessage("");
    },
  });

  const startChat = useMutation({
    mutationFn: () => {
      const participantId = idOf(property?.agentId) ?? idOf(property?.ownerId);
      if (!participantId) throw new Error("This listing has no contact yet");
      return conversationApi.create({ participantId, propertyId: id });
    },
    successMessage: "Conversation opened",
  });

  // ownerId/agentId arrive populated on some routes and as bare ids on others.
  const canManage = Boolean(
    user &&
    (user.role === "admin" ||
      idOf(property?.ownerId) === user._id ||
      idOf(property?.agentId) === user._id),
  );

  const share = async () => {
    try {
      await Share.share({
        message:
          `${property?.title ?? "Listing"} — ${property?.address ?? ""}`.trim(),
      });
    } catch {
      toast.error("Could not share this listing");
    }
  };

  if (detail.isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Listing" />
        <LoadingBlock label="Loading listing…" />
      </Screen>
    );
  }

  if (detail.error) {
    return (
      <Screen>
        <ScreenHeader title="Listing" onBack={() => router.back()} />
        <ErrorState
          message={detail.error}
          onRetry={() => void detail.refetch()}
        />
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen>
        <ScreenHeader title="Listing" onBack={() => router.back()} />
        <EmptyState
          icon="home-outline"
          title="Listing not found"
          description="This property may have been removed or the link is wrong."
        />
      </Screen>
    );
  }

  const perSqft = pricePerSqft(property.price, property.size);
  const coordinates = property.location?.coordinates;
  const contactId = idOf(property.agentId) ?? idOf(property.ownerId);

  return (
    <Screen scroll padded={false} edges={false}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.barButton, { backgroundColor: theme.surface }]}>
          <TopBarBack />
        </View>
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share listing"
            onPress={() => void share()}
            style={[styles.barButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="share-outline" size={18} color={theme.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isShortlisted }}
            accessibilityLabel={
              isShortlisted ? "Remove from shortlist" : "Add to shortlist"
            }
            onPress={() => void onFavorite(property._id)}
            style={[styles.barButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name={isShortlisted ? "heart" : "heart-outline"}
              size={18}
              color={isShortlisted ? theme.destructive : theme.foreground}
            />
          </Pressable>
        </View>
      </View>

      <PropertyGallery property={property} media={media} />

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <Badge tone={property.purpose === "rent" ? "primary" : "info"}>
            {property.purpose === "rent" ? "For rent" : "For sale"}
          </Badge>
          <Badge tone="muted">
            <PropertyTypeIcon type={property.type} />
            {propertyTypeLabel(property.type)}
          </Badge>
          {property.verifiedAt ? <Badge tone="success">Verified</Badge> : null}
          {property.status !== "active" ? (
            <Badge tone="warning">{property.status}</Badge>
          ) : null}
        </View>

        <View style={{ gap: 6 }}>
          <Txt variant="title">{property.title}</Txt>
          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.foregroundMuted}
            />
            <Txt variant="small" tone="muted" style={{ flex: 1 }}>
              {property.address ?? "Address on request"}
            </Txt>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Txt variant="display">
            {formatListingPrice(
              property.price,
              property.currency,
              property.purpose,
            )}
          </Txt>
          {perSqft ? (
            <Txt variant="small" tone="muted">
              ₹{perSqft} per sq.ft
            </Txt>
          ) : null}
        </View>

        <View style={styles.specRow}>
          <Spec icon="bed-outline" label={`${property.beds ?? "—"} beds`} />
          <Spec icon="water-outline" label={`${property.baths ?? "—"} baths`} />
          <Spec
            icon="resize-outline"
            label={property.size ? `${property.size} sq.ft` : "—"}
          />
          {property.furnished ? (
            <Spec
              icon="cube-outline"
              label={property.furnished.replace("-", " ")}
            />
          ) : null}
        </View>

        <Divider />

        <View style={styles.kvRow}>
          <KeyValue
            label="Property ID"
            value={property._id.slice(-8)}
            icon="pricetag-outline"
          />
          <KeyValue label="Type" value={propertyTypeLabel(property.type)} />
          <KeyValue label="Status" value={property.status} />
          <KeyValue label="Floor" value={property.floor ?? "—"} />
        </View>
        <View style={styles.kvRow}>
          <KeyValue
            label="Available from"
            value={
              property.availableFrom
                ? formatShortDate(property.availableFrom)
                : "Immediately"
            }
            icon="calendar-outline"
          />
          {property.verifiedAt ? (
            <KeyValue
              label="Verified on"
              value={formatShortDate(property.verifiedAt)}
            />
          ) : null}
        </View>

        {property.description ? (
          <View style={{ gap: 8 }}>
            <Txt variant="heading">About this property</Txt>
            <Txt variant="body" tone="muted">
              {property.description}
            </Txt>
          </View>
        ) : null}

        {(property.amenities?.length ?? 0) > 0 ? (
          <View style={{ gap: 10 }}>
            <Txt variant="heading">Amenities</Txt>
            <View style={styles.amenityGrid}>
              {property.amenities!.map((amenity) => (
                <View
                  key={amenity}
                  style={[
                    styles.amenity,
                    {
                      backgroundColor: theme.accent,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={AMENITY_ICONS[amenity] ?? "checkmark-circle-outline"}
                    size={14}
                    color={theme.primary}
                  />
                  <Txt variant="small" style={{ flex: 1 }} numberOfLines={1}>
                    {amenity}
                  </Txt>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {coordinates ? (
          <View style={{ gap: 10 }}>
            <Txt variant="heading">Location</Txt>
            <PropertyMap
              properties={[property]}
              height={220}
              showRecenter={false}
            />
          </View>
        ) : null}

        <PriceHistory propertyId={property._id} currency={property.currency} />

        <ReviewsPanel
          propertyId={property._id}
          buildingId={property.buildingId}
        />

        <View style={styles.actions}>
          <Button
            title="Send an enquiry"
            onPress={() => setInquiryOpen(true)}
            fullWidth
            icon={
              <Ionicons name="mail-outline" size={16} color={theme.onPrimary} />
            }
          />
          <Button
            title="Message the agent"
            variant="outline"
            onPress={() => void startChat.mutate()}
            loading={startChat.isPending}
            disabled={!contactId}
            fullWidth
            icon={
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={theme.foreground}
              />
            }
          />
          {canManage ? (
            <Button
              title="Edit this listing"
              variant="secondary"
              onPress={() => router.push(`/listings/${id}/edit`)}
              fullWidth
            />
          ) : null}
        </View>

        <Txt variant="tiny" tone="muted">
          Listed {formatDateTime(property.createdAt)} · Updated{" "}
          {formatDateTime(property.updatedAt)}
        </Txt>
      </View>

      {(similar.data?.properties?.length ?? 0) > 0 ? (
        <View style={[styles.body, { paddingTop: 8 }]}>
          <SectionHeading
            eyebrow="You might also like"
            title="Similar homes nearby"
            description="Same purpose and type, within 20% of this price and 5 km away."
          />
          {similar.data!.properties.map((item) => (
            <PropertyCard key={item._id} property={item} />
          ))}
        </View>
      ) : null}

      <InquirySheet
        visible={inquiryOpen}
        message={message}
        setMessage={setMessage}
        pending={sendInquiry.isPending}
        onClose={() => setInquiryOpen(false)}
        onSend={() => void sendInquiry.mutate()}
      />
    </Screen>
  );
}

function TopBarBack() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={10}
      onPress={() => router.back()}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons name="chevron-back" size={20} color={theme.foreground} />
    </Pressable>
  );
}

function Spec({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={14} color={theme.foregroundMuted} />
      <Txt variant="small" numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

function PriceHistory({
  propertyId,
  currency,
}: {
  propertyId: string;
  currency?: string;
}) {
  const theme = useTheme();
  const { data, isLoading } = useQuery(
    `get|/properties/${propertyId}/price-history`,
    () => propertyApi.priceHistory(propertyId),
  );

  const history = data?.history ?? [];
  const latest = history[0];
  const delta = latest
    ? formatPriceDelta(latest.oldPrice, latest.newPrice)
    : null;

  return (
    <SectionCard
      title="Price history"
      action={
        delta && delta.direction !== "flat" ? (
          <Badge tone={delta.direction === "down" ? "success" : "warning"}>
            {delta.direction === "down" ? "▼" : "▲"} {delta.percent}%
          </Badge>
        ) : undefined
      }
    >
      {isLoading ? (
        <LoadingBlock />
      ) : history.length === 0 ? (
        <Txt variant="small" tone="muted">
          No price changes recorded — this is the listing&apos;s first price.
        </Txt>
      ) : (
        history.slice(0, 6).map((entry) => {
          const change = formatPriceDelta(entry.oldPrice, entry.newPrice);
          return (
            <View key={entry._id} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">
                  {formatCurrency(entry.newPrice, currency)}
                </Txt>
                <Txt variant="tiny" tone="muted">
                  {formatShortDate(entry.changedAt)} · from{" "}
                  {formatCurrency(entry.oldPrice, currency)}
                </Txt>
              </View>
              {change && change.direction !== "flat" ? (
                <Txt
                  variant="small"
                  tone={change.direction === "down" ? "success" : "destructive"}
                >
                  {change.direction === "down" ? "▼" : "▲"}{" "}
                  {Math.abs(change.delta).toLocaleString("en-IN")}
                </Txt>
              ) : null}
            </View>
          );
        })
      )}
      <Txt variant="tiny" tone="muted" style={{ marginTop: 4 }}>
        Recorded automatically whenever the listing price changes.
      </Txt>
      {history.length > 0 ? (
        <View style={[styles.sparkRow, { backgroundColor: theme.accent }]} />
      ) : null}
    </SectionCard>
  );
}

function ReviewsPanel({
  propertyId,
  buildingId,
}: {
  propertyId: string;
  buildingId?: string;
}) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user)!;
  const [rating, setRating] = React.useState(0);
  const [body, setBody] = React.useState("");

  const { data, isLoading } = useQuery(
    `get|/properties/${propertyId}/reviews`,
    () => propertyApi.reviews(propertyId),
  );

  const submit = useMutation({
    // Reviews attach to the building when the listing has one; the API upserts on
    // (targetType, targetId, userId) so re-rating edits rather than duplicates.
    mutationFn: () =>
      reviewApi.create({
        targetType: buildingId ? "building" : "area",
        targetId: buildingId ?? propertyId,
        rating,
        body: body || undefined,
      }),
    successMessage: "Review saved",
    onSuccess: () => {
      setRating(0);
      setBody("");
    },
  });

  const reviews = data?.reviews ?? [];
  const distribution = data?.distribution ?? {};

  return (
    <SectionCard title="What residents say">
      {isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <View style={styles.ratingSummary}>
            <View style={{ alignItems: "center" }}>
              <Txt variant="display">{(data?.avgRating ?? 0).toFixed(1)}</Txt>
              <Stars value={data?.avgRating ?? 0} />
              <Txt variant="tiny" tone="muted">
                {data?.total ?? 0} reviews
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[String(star)] ?? 0;
                const percent =
                  (data?.total ?? 0) > 0
                    ? (count / (data?.total ?? 1)) * 100
                    : 0;
                return (
                  <View key={star} style={styles.distRow}>
                    <Txt variant="tiny" tone="muted" style={{ width: 18 }}>
                      {star}★
                    </Txt>
                    <View
                      style={[
                        styles.distBar,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      <View
                        style={[
                          styles.distFill,
                          { width: `${percent}%`, backgroundColor: theme.gold },
                        ]}
                      />
                    </View>
                    <Txt
                      variant="tiny"
                      tone="muted"
                      style={{ width: 20, textAlign: "right" }}
                    >
                      {count}
                    </Txt>
                  </View>
                );
              })}
            </View>
          </View>

          {user ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <Txt variant="small" tone="muted">
                Reviews are tied to the building, so they carry across listings.
              </Txt>
              <StarPicker value={rating} onChange={setRating} />
              <Textarea
                value={body}
                onChangeText={setBody}
                placeholder="Share what it was like living here…"
              />
              <Button
                title="Post review"
                size="sm"
                disabled={rating === 0}
                loading={submit.isPending}
                onPress={() => void submit.mutate()}
              />
            </View>
          ) : (
            <Txt variant="small" tone="muted">
              Sign in to write a review.
            </Txt>
          )}

          {reviews.length > 0
            ? reviews.slice(0, 5).map((review) => (
                <View key={review._id} style={{ gap: 4 }}>
                  <Stars value={review.rating} />
                  {review.body ? (
                    <Txt variant="small">{review.body}</Txt>
                  ) : null}
                  <Txt variant="tiny" tone="muted">
                    {formatRelative(review.createdAt)}
                  </Txt>
                </View>
              ))
            : null}
        </>
      )}
    </SectionCard>
  );
}

function InquirySheet({
  visible,
  message,
  setMessage,
  pending,
  onClose,
  onSend,
}: {
  visible: boolean;
  message: string;
  setMessage: (value: string) => void;
  pending: boolean;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <GSModal
      isOpen={visible}
      onClose={onClose}
      isKeyboardDismissable
      className="bg-background"
    >
      <GSModalBackdrop className="bg-black/45" />
      <GSModalContent className="mb-8 gap-4 rounded-2xl border border-border bg-background p-5">
        <GSModalHeader className="flex-col items-start gap-1.5">
          <Txt variant="heading">Send an enquiry</Txt>
          <Txt variant="small" tone="muted">
            Mention when you want to move and your budget — agents reply faster
            with specifics.
          </Txt>
        </GSModalHeader>

        <GSModalBody>
          <Field label="Message">
            <Textarea
              value={message}
              onChangeText={setMessage}
              placeholder="I'd like to know more about this property…"
            />
          </Field>
        </GSModalBody>

        <GSModalFooter className="mt-1 gap-2.5">
          <Button title="Cancel" variant="ghost" onPress={onClose} />
          <Button
            title={pending ? "Sending…" : "Send"}
            onPress={onSend}
            loading={pending}
            disabled={!message.trim()}
          />
        </GSModalFooter>
      </GSModalContent>
    </GSModal>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  topBarActions: { flexDirection: "row", gap: 8 },
  barButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 16, gap: 18 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    flexWrap: "wrap",
  },
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  spec: { flexDirection: "row", alignItems: "center", gap: 5 },
  kvRow: { flexDirection: "row", gap: 16 },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "48%",
  },
  actions: { gap: 10 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  sparkRow: { height: 2, borderRadius: 1 },
  ratingSummary: { flexDirection: "row", gap: 16, alignItems: "center" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  distBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  distFill: { height: 6, borderRadius: 3 },
});
