import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { coordinatesToLatLng, formatCompact } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useTheme } from "@/theme";
import { Txt } from "@/components/ui/primitives";

type Props = {
  properties: Property[];
  center?: [number, number];
  height?: number | `${number}%`;
  activeId?: string;
  onSelect?: (propertyId: string) => void;
  polygon?: [number, number][];
  radius?: number;
  onRegionChange?: (region: never) => void;
  showRecenter?: boolean;
};

/**
 * Web fallback. `react-native-maps` is native-only, so the browser build renders
 * an equivalent static listing instead of crashing the bundle. The dedicated
 * React web client under `../webApp` is the full map experience.
 */
export function PropertyMap({ properties, height }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          height: height ?? 260,
          width: "100%",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.accent,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          gap: 8,
        },
      ]}
    >
      <Ionicons name="map-outline" size={22} color={theme.foregroundMuted} />
      <Txt variant="small" tone="muted" center>
        Map view is available in the iOS and Android apps.
      </Txt>
      {properties.slice(0, 6).map((property) => (
        <View key={property._id} style={{ alignSelf: "stretch", gap: 2 }}>
          <Txt variant="small" numberOfLines={1}>
            {property.title}
          </Txt>
          <Txt variant="tiny" tone="muted">
            {formatCompact(property.price)} ·{" "}
            {coordinatesToLatLng(property.location?.coordinates)
              ? `${coordinatesToLatLng(property.location?.coordinates)!.lat.toFixed(4)}, ${coordinatesToLatLng(property.location?.coordinates)!.lng.toFixed(4)}`
              : "no coordinates"}
          </Txt>
        </View>
      ))}
    </View>
  );
}
