import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** Property type → icon, replacing the web app's `PropertyTypeIcon`. */
export const PROPERTY_TYPE_ICONS: Record<string, IconName> = {
  apartment: "business-outline",
  villa: "home-outline",
  plot: "map-outline",
  commercial: "storefront-outline",
  farmhouse: "leaf-outline",
};

export function PropertyTypeIcon({
  type,
  size = 14,
  color,
}: {
  type?: string;
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Ionicons
      name={PROPERTY_TYPE_ICONS[type ?? ""] ?? "home-outline"}
      size={size}
      color={color ?? theme.foregroundMuted}
    />
  );
}

/** Amenity → icon, replacing the web app's `AMENITY_ICONS` label map. */
export const AMENITY_ICONS: Record<string, IconName> = {
  parking: "car-outline",
  lift: "swap-vertical-outline",
  "power backup": "flash-outline",
  gym: "barbell-outline",
  "swimming pool": "water-outline",
  security: "shield-checkmark-outline",
  garden: "flower-outline",
  balcony: "sunny-outline",
  "modular kitchen": "restaurant-outline",
  "air conditioning": "snow-outline",
  "pet friendly": "paw-outline",
  "water supply 24x7": "water-outline",
};

export function PressableRow({
  onPress,
  children,
  style,
}: {
  onPress?: () => void;
  children: ReactNode;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.9 }, style]}
    >
      {children}
    </Pressable>
  );
}

export const ROW_STYLE = StyleSheet.create({ row: { flexDirection: "row" } });
