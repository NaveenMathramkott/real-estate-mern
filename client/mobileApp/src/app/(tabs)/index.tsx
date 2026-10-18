import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { formatNumber } from "@/lib/format";
import { sortProperties } from "@/lib/sort-properties";
import { useSearchStore } from "@/store/search-store";
import { useTheme } from "@/theme";
import { PropertyCard } from "@/components/property/property-card";
import {
  FilterSheet,
  SaveCurrentSearchPrompt,
} from "@/components/search/filter-sheet";
import { Button, Txt } from "@/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Pagination,
} from "@/components/ui/feedback";
import { Screen } from "@/components/ui/screen";
import { useSearchResults } from "@/hooks/use-search-results";

/**
 * The Properties tab: a search box and the results list.
 *
 * Deliberately lean — every filter (purpose, sort, price, beds, type,
 * furnishing, amenities, radius) lives in the filter sheet behind the sliders
 * icon, so the screen itself is only the query and its answers.
 */
export default function PropertiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const setFilter = useSearchStore((state) => state.setFilter);
  const { data, isLoading, error, refetch, isFetching } = useSearchResults();
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Deep links from a saved search arrive as route params; fold them into the
  // store once so the chips and the query stay in sync.
  const paramKey = JSON.stringify(params ?? {});
  React.useEffect(() => {
    if (!params || Object.keys(params).length === 0) return;
    const next = params as Record<string, string | undefined>;
    setFilters({
      purpose: (next.purpose as "rent" | "buy") ?? undefined,
      city: next.city,
      q: next.q,
      beds: next.beds ? Number(next.beds) : undefined,
      priceMin: next.priceMin ? Number(next.priceMin) : undefined,
      priceMax: next.priceMax ? Number(next.priceMax) : undefined,
    });
    // `paramKey` collapses the param object into one comparable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const properties = sortProperties(
    data?.properties ?? [],
    filters.sort ?? "relevance",
  );

  return (
    <Screen>
      <View
        style={[
          styles.queryBox,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={16} color={theme.foregroundMuted} />
        <TextInput
          value={filters.q ?? ""}
          onChangeText={(value) => setFilter("q", value || undefined)}
          placeholder="Area, city or listing"
          placeholderTextColor="#98A5A0"
          returnKeyType="search"
          style={[styles.queryInput, { color: theme.foreground }]}
        />
        {filters.q ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setFilter("q", undefined)}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={theme.foregroundMuted}
            />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          onPress={() => setFiltersOpen(true)}
          style={[styles.viewToggle, { borderColor: theme.borderStrong }]}
        >
          <Ionicons name="options-outline" size={16} color={theme.foreground} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open map view"
          onPress={() => router.push("/map")}
          style={[styles.viewToggle, { borderColor: theme.borderStrong }]}
        >
          <Ionicons name="map-outline" size={16} color={theme.foreground} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <SaveCurrentSearchPrompt />
      </View>

      {isLoading ? (
        <LoadingBlock label="Loading listings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : properties.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No listings match those filters"
          description="Try widening the price range or removing an amenity."
          action={
            <Button
              title="Adjust filters"
              onPress={() => setFiltersOpen(true)}
              size="sm"
            />
          }
        />
      ) : (
        <ScrollView
          style={styles.results}
          contentContainerStyle={styles.resultsBody}
          showsVerticalScrollIndicator={false}
        >
          {isFetching ? (
            <Txt variant="tiny" tone="muted">
              Refreshing…
            </Txt>
          ) : null}
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
          <Pagination
            page={data?.page ?? filters.page ?? 1}
            pages={data?.pages ?? 1}
            onChange={(page) => setFilter("page", page)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/saved-searches")}
            style={{ paddingVertical: 8 }}
          >
            <Txt variant="tiny" tone="muted" center>
              Manage saved searches
            </Txt>
          </Pressable>
        </ScrollView>
      )}

      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={() => setFiltersOpen(false)}
        resultCount={data?.total}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  queryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    paddingRight: 6,
    height: 46,
  },
  queryInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  viewToggle: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaCount: { flex: 1 },
  results: { flex: 1, marginHorizontal: -16 },
  resultsBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 24,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
});
