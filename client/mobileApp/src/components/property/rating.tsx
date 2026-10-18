import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

/** Read-only star row used on cards, detail screens and review lists. */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{ flexDirection: "row", gap: 2 }}
      accessibilityLabel={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={value >= star - 0.25 ? "star" : "star-outline"}
          size={size}
          color={theme.gold}
        />
      ))}
    </View>
  );
}

/** Tappable 1–5 picker for writing a review. */
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
            accessibilityState={{ selected: filled }}
            onPress={() => onChange(star)}
            hitSlop={4}
          >
            <Ionicons
              name={filled ? "star" : "star-outline"}
              size={26}
              color={filled ? theme.gold : theme.foregroundMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
});
