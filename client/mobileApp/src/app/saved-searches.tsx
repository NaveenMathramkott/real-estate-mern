import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { savedSearchApi } from "@/lib/api";
import { ALERT_FREQUENCIES } from "@/lib/constants";
import { formatNumber, formatRelative } from "@/lib/format";
import { toast } from "@/store/toast-store";
import {
  filtersToParams,
  useSearchStore,
  type SearchFilters,
} from "@/store/search-store";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Badge, Button, Chip, Txt } from "@/components/ui/primitives";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";

function describe(filters: Record<string, unknown>) {
  const parts: string[] = [];
  if (filters.purpose) parts.push(String(filters.purpose));
  if (filters.city) parts.push(String(filters.city));
  if (filters.q) parts.push(`“${String(filters.q)}”`);
  if (filters.type) parts.push(String(filters.type).replace(/,/g, ", "));
  if (filters.beds) parts.push(`${filters.beds}+ beds`);
  if (filters.priceMin || filters.priceMax) {
    parts.push(
      `${filters.priceMin ? formatNumber(Number(filters.priceMin)) : "0"} – ${
        filters.priceMax ? formatNumber(Number(filters.priceMax)) : "any"
      }`,
    );
  }
  return parts.length ? parts.join(" · ") : "Everything";
}

/** Saved-search manager: store the current filters, then replay any of them. */
export default function SavedSearchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentFilters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const [frequency, setFrequency] = React.useState<string>("daily");

  const { data, isLoading, error, refetch } = useQuery(
    user ? "get|/saved-searches" : null,
    () => savedSearchApi.list(),
  );

  const save = useMutation({
    mutationFn: () =>
      savedSearchApi.create({
        filters: filtersToParams(currentFilters as SearchFilters),
        alertFrequency: frequency,
      }),
    successMessage: "Search saved",
  });

  const remove = useMutation({
    mutationFn: (id: string) => savedSearchApi.remove(id),
    successMessage: "Saved search removed",
  });

  const searches = data?.savedSearches ?? [];
  const hasCurrent = Object.entries(currentFilters).some(
    ([key, value]) =>
      key !== "page" &&
      key !== "limit" &&
      key !== "sort" &&
      value !== undefined,
  );

  return (
    <RequireAuth>
      <Screen>
        <ScreenHeader
          title="Saved searches"
          subtitle={`${searches.length} stored`}
          onBack={() => router.back()}
        />

        <View style={[styles.saveBox, { backgroundColor: theme.accent }]}>
          <Txt variant="subheading">Save the current search</Txt>
          <Txt variant="tiny" tone="muted" numberOfLines={2}>
            {describe(filtersToParams(currentFilters))}
          </Txt>
          <View style={styles.frequencyRow}>
            {ALERT_FREQUENCIES.map((value) => (
              <Chip
                key={value}
                label={value}
                selected={frequency === value}
                onPress={() => setFrequency(value)}
              />
            ))}
          </View>
          <Button
            title="Save this search"
            size="sm"
            onPress={() => void save.mutateAsync().catch(() => undefined)}
            loading={save.isPending}
            disabled={!hasCurrent}
            fullWidth
          />
        </View>

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : searches.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="No saved searches"
            description="Save a search above to get alerts when new stock lands."
          />
        ) : (
          <View style={styles.list}>
            {searches.map((search) => (
              <SavedSearchRow
                key={search._id}
                label={describe(search.filters ?? {})}
                frequency={search.alertFrequency}
                lastRunAt={search.lastRunAt}
                busy={remove.isPending}
                onApply={() => {
                  setFilters(search.filters as SearchFilters);
                  router.push("/");
                }}
                onRun={async () => {
                  const results = await savedSearchApi.run(search._id);
                  toast.info(
                    `${results.total} new match${results.total === 1 ? "" : "es"}`,
                    "Showing the stored filters on the search screen.",
                  );
                  setFilters(search.filters as SearchFilters);
                  router.push("/");
                }}
                onRemove={() =>
                  remove.mutateAsync(search._id).catch(() => undefined)
                }
              />
            ))}
          </View>
        )}
      </Screen>
    </RequireAuth>
  );
}

function SavedSearchRow({
  label,
  frequency,
  lastRunAt,
  busy,
  onApply,
  onRun,
  onRemove,
}: {
  label: string;
  frequency: string;
  lastRunAt: string | null;
  busy: boolean;
  onApply: () => void;
  onRun: () => Promise<void>;
  onRemove: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: busy ? 0.6 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>
          {label}
        </Txt>
        <Badge tone="muted">Alerts {frequency}</Badge>
        <Txt variant="tiny" tone="muted">
          {lastRunAt ? `Last run ${formatRelative(lastRunAt)}` : "Never run"}
        </Txt>
      </View>
      <View style={styles.rowActions}>
        <Button
          title="Run"
          size="sm"
          variant="outline"
          onPress={() => void onRun()}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply filters"
          onPress={onApply}
          hitSlop={8}
        >
          <Ionicons name="funnel-outline" size={17} color={theme.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete saved search"
          onPress={onRemove}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={17} color={theme.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  saveBox: { gap: 10, padding: 14, borderRadius: 14 },
  frequencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  list: { flex: 1, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 12 },
});
