import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { buildingApi, reviewApi } from "@/lib/api";
import { formatNumber, formatRelative } from "@/lib/format";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { Stars, StarPicker } from "@/components/property/rating";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyMap } from "@/components/property/property-map";
import {
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingBlock,
  SectionCard,
  SectionHeading,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Textarea } from "@/components/ui/form";

/** Building detail: active listings, location and resident reviews. */
export default function BuildingDetailScreen() {
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const detail = useQuery(id ? `get|/buildings/${id}` : null, () =>
    buildingApi.detail(id),
  );
  const reviews = useQuery(id ? `get|/buildings/${id}/reviews` : null, () =>
    buildingApi.reviews(id, 1),
  );

  const building = detail.data?.building;
  const distribution = reviews.data?.distribution ?? {};

  return (
    <Screen scroll>
      <ScreenHeader
        title={building?.name ?? "Building"}
        subtitle={building?.developer}
        onBack={() => router.back()}
      />

      {detail.isLoading ? <LoadingBlock /> : null}
      {detail.error ? (
        <ErrorState
          message={detail.error}
          onRetry={() => void detail.refetch()}
        />
      ) : null}

      {building ? (
        <>
          <SectionCard title="Overview">
            <KeyValue label="Developer" value={building.developer ?? "—"} />
            <KeyValue
              label="Year built"
              value={building.yearBuilt ? String(building.yearBuilt) : "—"}
            />
            {building.amenities?.length ? (
              <View style={styles.chips}>
                {building.amenities.map((amenity) => (
                  <Badge key={amenity} tone="muted">
                    {amenity}
                  </Badge>
                ))}
              </View>
            ) : null}
          </SectionCard>

          {building.location ? (
            <View style={{ gap: 10 }}>
              <Txt variant="heading">Location</Txt>
              <PropertyMap
                properties={[]}
                height={220}
                center={building.location.coordinates}
              />
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <SectionHeading
              eyebrow={`${(detail.data?.properties ?? []).length} active`}
              title="Listings in this building"
            />
            {(detail.data?.properties ?? []).length === 0 ? (
              <EmptyState
                icon="home-outline"
                title="No active listings"
                description="Nothing is published here right now."
              />
            ) : (
              detail.data!.properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))
            )}
          </View>

          <BuildingReviews
            buildingId={id}
            reviews={reviews.data?.reviews ?? []}
            total={reviews.data?.total ?? 0}
            average={reviews.data?.avgRating ?? 0}
            distribution={distribution}
            loading={reviews.isLoading}
            error={reviews.error}
            onRetry={() => void reviews.refetch()}
            signedIn={Boolean(user)}
          />
        </>
      ) : null}
    </Screen>
  );
}

function BuildingReviews({
  buildingId,
  reviews,
  total,
  average,
  distribution,
  loading,
  error,
  onRetry,
  signedIn,
}: {
  buildingId: string;
  reviews: { _id: string; rating: number; body?: string; createdAt: string }[];
  total: number;
  average: number;
  distribution: Record<string, number>;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  signedIn: boolean;
}) {
  const theme = useTheme();
  const [rating, setRating] = React.useState(0);
  const [body, setBody] = React.useState("");

  const submit = useMutation({
    mutationFn: () =>
      reviewApi.create({
        targetType: "building",
        targetId: buildingId,
        rating,
        body: body || undefined,
      }),
    successMessage: "Review saved",
    onSuccess: () => {
      setRating(0);
      setBody("");
      toast.info(
        "Thanks",
        "Your review now counts toward the building average.",
      );
    },
  });

  return (
    <SectionCard title="Resident reviews">
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <>
          <View style={styles.ratingHeader}>
            <View style={{ alignItems: "center" }}>
              <Txt variant="display">{average.toFixed(1)}</Txt>
              <Stars value={average} />
              <Txt variant="tiny" tone="muted">
                {formatNumber(total)} reviews
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[String(star)] ?? 0;
                const percent = total > 0 ? (count / total) * 100 : 0;
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
                      style={{ width: 22, textAlign: "right" }}
                    >
                      {count}
                    </Txt>
                  </View>
                );
              })}
            </View>
          </View>

          {signedIn ? (
            <View style={{ gap: 10 }}>
              <StarPicker value={rating} onChange={setRating} />
              <Textarea
                value={body}
                onChangeText={setBody}
                placeholder="What is it like living here?"
              />
              <Button
                title="Post review"
                size="sm"
                disabled={rating === 0}
                loading={submit.isPending}
                onPress={() => void submit.mutateAsync().catch(() => undefined)}
              />
            </View>
          ) : (
            <Txt variant="small" tone="muted">
              Sign in to rate this building.
            </Txt>
          )}

          {reviews.slice(0, 8).map((review) => (
            <View key={review._id} style={{ gap: 4 }}>
              <Stars value={review.rating} />
              {review.body ? <Txt variant="small">{review.body}</Txt> : null}
              <Txt variant="tiny" tone="muted">
                {formatRelative(review.createdAt)}
              </Txt>
            </View>
          ))}
        </>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ratingHeader: { flexDirection: "row", gap: 16, alignItems: "center" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  distBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  distFill: { height: 6, borderRadius: 3 },
});
