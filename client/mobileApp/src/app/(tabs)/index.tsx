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

import { areaApi } from "@/lib/api";
import {
  CITIES,
  PRICE_BANDS,
  PROPERTY_TYPES,
  PURPOSES,
  propertyTypeLabel,
} from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { sortProperties } from "@/lib/sort-properties";
import { describeFilters, useSearchStore } from "@/store/search-store";
import { useTheme } from "@/theme";
import { PropertyCard } from "@/components/property/property-card";
import {
  ActiveFilterChips,
  FilterSheet,
  SaveCurrentSearchPrompt,
  SortRow,
} from "@/components/search/filter-sheet";
import { Button, Chip, Txt } from "@/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Pagination,
  SectionHeading,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { useQuery } from "@/hooks/use-query";
import { useSearchResults } from "@/hooks/use-search-results";

/**
 * The Properties tab: search, filter, sort and browse the whole marketplace.
 * With no filters applied it also surfaces the discovery strips the landing page
 * used to carry, so the four tabs cover everything the web home page offered.
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
  const isBrowsing = describeFilters(filters).length === 0;

  return (
    <Screen>
      <ScreenHeader
        title="Properties"
        subtitle={
          isLoading
            ? "Loading listings…"
            : `${formatNumber(data?.total ?? 0)} listing${(data?.total ?? 0) === 1 ? "" : "s"}`
        }
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            onPress={() => setFiltersOpen(true)}
            style={[styles.filterButton, { borderColor: theme.borderStrong }]}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={theme.foreground}
            />
            <Txt variant="small">Filters</Txt>
          </Pressable>
        }
      />

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
          accessibilityLabel="Open map view"
          onPress={() => router.push("/map")}
          style={[styles.viewToggle, { borderColor: theme.borderStrong }]}
        >
          <Ionicons name="map-outline" size={16} color={theme.foreground} />
        </Pressable>
      </View>

      <View style={styles.purposeRow}>
        {PURPOSES.map((purpose) => (
          <Chip
            key={purpose}
            label={purpose === "rent" ? "Rent" : "Buy"}
            selected={filters.purpose === purpose}
            onPress={() =>
              setFilter(
                "purpose",
                filters.purpose === purpose ? undefined : purpose,
              )
            }
          />
        ))}
      </View>

      <ActiveFilterChips />
      <SortRow />

      {isBrowsing ? <DiscoveryStrips /> : null}

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
          <View style={styles.footerRow}>
            <SaveCurrentSearchPrompt />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/saved-searches")}
            >
              <Txt variant="tiny" tone="muted">
                Saved searches
              </Txt>
            </Pressable>
          </View>
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

/**
 * Quick-entry strips shown above an unfiltered result set: the jump points the
 * web landing page offered, without giving them a tab of their own.
 */
function DiscoveryStrips() {
  const theme = useTheme();
  const router = useRouter();
  const setFilters = useSearchStore((state) => state.setFilters);

  const areas = useQuery("get|/areas|properties", () =>
    areaApi.list({ limit: 12 }),
  );

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading eyebrow="Price bands" title="Start from a range" />
      {(["rent", "buy"] as const).map((purpose) => (
        <ScrollView
          key={purpose}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {PRICE_BANDS[purpose].map((band) => (
            <Chip
              key={band.label}
              label={band.label}
              onPress={() =>
                setFilters({ purpose, priceMin: band.min, priceMax: band.max })
              }
            />
          ))}
        </ScrollView>
      ))}

      <SectionHeading eyebrow="Neighbourhoods" title="Browse by area" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {(areas.data?.areas ?? []).map((area) => (
          <Chip
            key={area._id}
            label={`${area.name}, ${area.city}`}
            onPress={() => router.push(`/areas/${area._id}`)}
          />
        ))}
      </ScrollView>

      <SectionHeading eyebrow="Cities" title="Where people are looking" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {CITIES.map((city) => (
          <Chip key={city} label={city} onPress={() => setFilters({ city })} />
        ))}
      </ScrollView>

      <SectionHeading eyebrow="Property types" title="Every kind of place" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {PROPERTY_TYPES.map((type) => (
          <Chip
            key={type}
            label={propertyTypeLabel(type)}
            onPress={() => setFilters({ type: [type] })}
          />
        ))}
      </ScrollView>

      <View style={{ height: 4, backgroundColor: theme.background }} />
    </View>
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
  purposeRow: { flexDirection: "row", gap: 8 },
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
  strip: { gap: 8, paddingVertical: 2 },
});
