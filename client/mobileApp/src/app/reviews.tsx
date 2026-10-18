import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { reviewApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useTheme } from "@/theme";
import { Button, Txt } from "@/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionCard,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";
import { Stars } from "@/components/property/rating";

const TARGET_LABELS: Record<string, string> = {
  building: "Building",
  area: "Area",
  agent: "Agent",
};

/** Reviews the signed-in user has written, with a delete action. */
export default function ReviewsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery("get|/reviews", () =>
    reviewApi.mine(),
  );

  const remove = useMutation({
    mutationFn: (id: string) => reviewApi.remove(id),
    successMessage: "Review deleted",
  });

  const reviews = data?.reviews ?? [];

  return (
    <RequireAuth>
      <Screen>
        <ScreenHeader
          title="My reviews"
          subtitle={`${reviews.length} written`}
          onBack={() => router.back()}
        />

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title="No reviews yet"
            description="Open a building or area and rate it — reviewing twice edits your earlier review instead of duplicating it."
          />
        ) : (
          <View style={styles.list}>
            {reviews.map((review) => (
              <SectionCard
                key={review._id}
                title={TARGET_LABELS[review.targetType] ?? review.targetType}
              >
                <Stars value={review.rating} size={14} />
                {review.body ? <Txt variant="small">{review.body}</Txt> : null}
                <View style={styles.metaRow}>
                  <Txt variant="tiny" tone="muted" style={{ flex: 1 }}>
                    {formatRelative(review.createdAt)} ·{" "}
                    {review.targetId.slice(-8)}
                  </Txt>
                  <Button
                    title="Delete"
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      void remove.mutateAsync(review._id).catch(() => undefined)
                    }
                    style={{ backgroundColor: theme.destructiveSoft }}
                  />
                </View>
              </SectionCard>
            ))}
          </View>
        )}
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, gap: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
