import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { favoriteApi, savedSearchApi } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { Favorite, Property } from "@/lib/types";
import { useTheme } from "@/theme";
import { useQuery } from "@/hooks/use-query";
import { PropertyCard } from "@/components/property/property-card";
import { Segmented, Txt } from "@/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Pagination,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { useFavoritesStore } from "@/store/favorites-store";

const PAGE_SIZE = 20;

function populatedProperty(favorite: Favorite): Property | undefined {
  return typeof favorite.propertyId === "string"
    ? undefined
    : (favorite.propertyId as Property);
}

export default function SavedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const ids = useFavoritesStore((state) => state.ids);
  const [page, setPage] = React.useState(1);
  const [tab, setTab] = React.useState<"shortlist" | "searches">("shortlist");

  const favourites = useQuery(`get|/favorites|saved|${page}`, () =>
    favoriteApi.list(),
  );

  const properties = (favourites.data?.favorites ?? [])
    .map(populatedProperty)
    .filter((property): property is Property => Boolean(property));

  const value = properties.reduce(
    (sum, property) => sum + (property.price ?? 0),
    0,
  );

  return (
    <Screen>
      <ScreenHeader
        title="Saved"
        subtitle={`${formatNumber(ids.length)} shortlisted · ${properties.length} loaded`}
      />

      <Segmented
        options={[
          { value: "shortlist", label: "Shortlist" },
          { value: "searches", label: "Saved searches" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "searches" ? (
        <View style={{ gap: 12 }}>
          <SavedSearches onOpen={() => router.push("/saved-searches")} />
        </View>
      ) : favourites.isLoading ? (
        <LoadingBlock label="Loading your shortlist…" />
      ) : favourites.error ? (
        <ErrorState
          message={favourites.error}
          onRetry={() => void favourites.refetch()}
        />
      ) : properties.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your shortlist is empty"
          description="Tap the heart on any listing and it will appear here with its value."
          action={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/")}
            >
              <Txt variant="small" style={{ color: theme.primary }}>
                Start searching
              </Txt>
            </Pressable>
          }
        />
      ) : (
        <View style={styles.list}>
          <View style={[styles.summary, { backgroundColor: theme.accent }]}>
            <Ionicons name="wallet-outline" size={16} color={theme.primary} />
            <Txt variant="small">
              Combined asking value{" "}
              {value > 0
                ? `${formatNumber(Math.round(value / 1000))}k/month`
                : "—"}
            </Txt>
          </View>

          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}

          <Pagination
            page={page}
            pages={Math.max(1, Math.ceil(ids.length / PAGE_SIZE))}
            onChange={setPage}
          />
        </View>
      )}
    </Screen>
  );
}

/** Compact list of saved searches; the full manager lives at /saved-searches. */
function SavedSearches({ onOpen }: { onOpen: () => void }) {
  const theme = useTheme();
  const { data, isLoading } = useQuery("get|/saved-searches|tab", () =>
    savedSearchApi.list(),
  );

  if (isLoading) return <LoadingBlock />;
  const searches = data?.savedSearches ?? [];
  if (searches.length === 0) {
    return (
      <EmptyState
        icon="bookmark-outline"
        title="No saved searches"
        description="Save a search from the results screen to get alerts when new stock lands."
      />
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {searches.map((search) => (
        <Pressable
          key={search._id}
          accessibilityRole="button"
          onPress={onOpen}
          style={[
            styles.searchRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Txt variant="bodyStrong">
              {String(search.filters?.purpose ?? "Any")} ·{" "}
              {String(search.filters?.city ?? search.filters?.q ?? "All areas")}
            </Txt>
            <Txt variant="tiny" tone="muted">
              Alerts {search.alertFrequency} ·{" "}
              {search.lastRunAt ? "ran recently" : "not run yet"}
            </Txt>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.foregroundMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, gap: 12 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
