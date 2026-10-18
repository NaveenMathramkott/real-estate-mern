import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { toast } from "@/store/toast-store";
import { sortProperties } from "@/lib/sort-properties";
import { useSearchStore } from "@/store/search-store";
import { useTheme } from "@/theme";
import { PropertyMap } from "@/components/property/property-map";
import { PropertyRow } from "@/components/property/property-card";
import { Txt } from "@/components/ui/primitives";
import { LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useSearchResults } from "@/hooks/use-search-results";

/**
 * Map surface for the current search. Panning updates the centre locally and
 * "Search this area" commits it to the store, which re-runs the same query the
 * list tab uses.
 */
export default function SearchMapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const { data, isLoading } = useSearchResults();
  const geolocation = useGeolocation();

  const [activeId, setActiveId] = React.useState<string | undefined>();
  const [centre, setCentre] = React.useState<{
    lat: number;
    lng: number;
  } | null>(
    filters.lat && filters.lng ? { lat: filters.lat, lng: filters.lng } : null,
  );

  const properties = sortProperties(
    data?.properties ?? [],
    filters.sort ?? "relevance",
  );
  const active = properties.find((property) => property._id === activeId);

  const centreOnMe = async () => {
    await geolocation.request();
    if (!geolocation.coords) {
      toast.error(
        "Location unavailable",
        "Grant location access to search nearby.",
      );
      return;
    }
    setCentre(geolocation.coords);
    toast.info(
      "Map centred on you",
      "Tap “Search this area” to run the query.",
    );
  };

  const searchHere = () => {
    if (!centre) {
      toast.info(
        "Pan the map first",
        "Then search the area you are looking at.",
      );
      return;
    }
    setFilters({
      lat: centre.lat,
      lng: centre.lng,
      radius: filters.radius ?? 3000,
    });
    toast.success("Searching this area");
  };

  return (
    <Screen>
      <ScreenHeader
        title="Map"
        subtitle={`${data?.total ?? 0} listings in view`}
        onBack={() => router.back()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to list view"
            onPress={() => router.replace("/")}
            style={[styles.toggle, { borderColor: theme.borderStrong }]}
          >
            <Ionicons name="list-outline" size={16} color={theme.foreground} />
            <Txt variant="small">List</Txt>
          </Pressable>
        }
      />

      <View style={styles.mapWrap}>
        <PropertyMap
          properties={properties}
          activeId={activeId}
          polygon={filters.polygon}
          radius={filters.lat && filters.lng ? filters.radius : undefined}
          center={centre ? [centre.lng, centre.lat] : undefined}
          showRecenter={false}
          onSelect={setActiveId}
          onRegionChange={(region) =>
            setCentre({ lat: region.latitude, lng: region.longitude })
          }
        />

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void centreOnMe()}
            style={[
              styles.control,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name={
                geolocation.status === "granted" ? "locate" : "locate-outline"
              }
              size={16}
              color={theme.foreground}
            />
            <Txt variant="small">
              {geolocation.status === "granted"
                ? "My location"
                : "Use my location"}
            </Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={searchHere}
            style={[styles.control, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="search" size={16} color="#FFFFFF" />
            <Txt variant="small" style={{ color: "#FFFFFF" }}>
              Search this area
            </Txt>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.overlay}>
            <LoadingBlock label="Searching…" />
          </View>
        ) : null}

        {active ? (
          <View
            style={[
              styles.preview,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <PropertyRow
              property={active}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open listing"
                  onPress={() => router.push(`/property/${active._id}`)}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.primary}
                  />
                </Pressable>
              }
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mapWrap: { flex: 1, overflow: "hidden", borderRadius: 14 },
  controls: { position: "absolute", top: 12, left: 12, gap: 8 },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
  },
});
