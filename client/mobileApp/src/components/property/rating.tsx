import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";

/** Read-only star row used on cards, detail screens and review lists. */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <Box
      accessibilityLabel={`${value} out of 5 stars`}
      className="flex-row gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={value >= star - 0.25 ? "star" : "star-outline"}
          size={size}
          color="#C08A1E"
        />
      ))}
    </Box>
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
  return (
    <Box className="flex-row gap-1.5">
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
              color={filled ? "#C08A1E" : "#647771"}
            />
          </Pressable>
        );
      })}
    </Box>
  );
}
