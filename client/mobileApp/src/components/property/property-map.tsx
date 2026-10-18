import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polygon,
  Circle,
  type Region,
} from "react-native-maps";

import { coordinatesToLatLng, formatCompact } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useTheme } from "@/theme";
import { Txt } from "@/components/ui/primitives";

type Props = {
  properties: Property[];
  /** `[lng, lat]`; ignored when properties carry coordinates. */
  center?: [number, number];
  height?: number | `${number}%`;
  /** Pin selected by id — rendered larger and in the accent colour. */
  activeId?: string;
  onSelect?: (propertyId: string) => void;
  /** Closed `[lng, lat]` ring drawn as a search polygon. */
  polygon?: [number, number][];
  /** Radius in metres drawn around `center`. */
  radius?: number;
  /** Reported on every camera settle so the host screen can offer "search here". */
  onRegionChange?: (region: Region) => void;
  /** Hide the recenter button when the host owns the camera. */
  showRecenter?: boolean;
};

const FALLBACK = { latitude: 28.6139, longitude: 77.209 };

/** Native map with price pills for listings — replaces the web app's Leaflet map. */
export function PropertyMap({
  properties,
  center,
  height,
  activeId,
  onSelect,
  polygon,
  radius,
  onRegionChange,
  showRecenter = true,
}: Props) {
  const theme = useTheme();
  const mapRef = React.useRef<MapView>(null);
  const initialRegion = React.useMemo<Region>(() => {
    const first = properties
      .map((property) => coordinatesToLatLng(property.location?.coordinates))
      .find(Boolean);
    const fallback = center ? coordinatesToLatLng(center) : null;
    const point = first ?? fallback;
    // `coordinatesToLatLng` speaks lat/lng; `Region` speaks latitude/longitude.
    return point
      ? {
          latitude: point.lat,
          longitude: point.lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }
      : { ...FALLBACK, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [properties, center]);

  const centerPoint = center ? coordinatesToLatLng(center) : null;

  const fitToProperties = () => {
    const points = properties
      .map((property) => coordinatesToLatLng(property.location?.coordinates))
      .filter((point): point is { lat: number; lng: number } => Boolean(point));
    if (points.length === 0) return;
    if (points.length === 1) {
      mapRef.current?.animateToRegion(
        {
          latitude: points[0].lat,
          longitude: points[0].lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400,
      );
      return;
    }
    const latitudes = points.map((point) => point.lat);
    const longitudes = points.map((point) => point.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    mapRef.current?.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.4),
        longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.4),
      },
      400,
    );
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          height,
          flex: height === undefined ? 1 : undefined,
          borderColor: theme.border,
          backgroundColor: theme.accent,
        },
      ]}
    >
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        mapType="standard"
      >
        {polygon && polygon.length >= 3 ? (
          <Polygon
            coordinates={polygon.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            strokeColor={theme.primary}
            fillColor={`${theme.primary}22`}
            strokeWidth={2}
          />
        ) : null}

        {radius && centerPoint ? (
          <Circle
            center={{ latitude: centerPoint.lat, longitude: centerPoint.lng }}
            radius={radius}
            strokeColor={theme.primary}
            fillColor={`${theme.primary}1A`}
            strokeWidth={2}
          />
        ) : null}

        {properties.map((property) => {
          const point = coordinatesToLatLng(property.location?.coordinates);
          if (!point) return null;
          const active = property._id === activeId;
          return (
            <Marker
              key={property._id}
              coordinate={{ latitude: point.lat, longitude: point.lng }}
              onPress={() => onSelect?.(property._id)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View
                style={[
                  styles.pin,
                  {
                    backgroundColor: active ? theme.primary : theme.foreground,
                    transform: [{ scale: active ? 1.08 : 1 }],
                  },
                ]}
              >
                <Txt variant="tiny" style={styles.pinText}>
                  {formatCompact(property.price)}
                </Txt>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {showRecenter ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fit map to listings"
          onPress={fitToProperties}
          style={[
            styles.control,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="locate-outline" size={18} color={theme.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pin: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinText: { color: "#FFFFFF", fontWeight: "700" },
  control: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
