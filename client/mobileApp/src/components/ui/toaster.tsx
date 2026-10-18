import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { Txt } from "./primitives";
import { useToastStore } from "@/store/toast-store";

const ICONS = {
  default: "information-circle-outline",
  success: "checkmark-circle",
  destructive: "close-circle",
  warning: "alert-circle",
} as const;

/**
 * Absolute-positioned toast host. Mounted once in the root layout so a mutation
 * anywhere in the tree can surface feedback without prop drilling.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + 78 }]}
    >
      {toasts.map((item) => {
        const accent =
          item.variant === "success"
            ? theme.success
            : item.variant === "destructive"
              ? theme.destructive
              : item.variant === "warning"
                ? theme.warning
                : theme.primary;

        return (
          <ToastCard
            key={item.id}
            icon={ICONS[item.variant]}
            accent={accent}
            title={item.title}
            description={item.description}
            onDismiss={() => dismiss(item.id)}
          />
        );
      })}
    </View>
  );
}

function ToastCard({
  icon,
  accent,
  title,
  description,
  onDismiss,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  title: string;
  description?: string;
  onDismiss: () => void;
}) {
  const theme = useTheme();

  React.useEffect(() => {
    // Auto-dismiss mirrors the web toaster's fixed duration.
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <Pressable
      accessibilityRole="alert"
      onPress={onDismiss}
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceRaised,
          borderColor: theme.border,
          shadowColor: "#000",
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={accent} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {description ? (
          <Txt variant="tiny" tone="muted" style={{ marginTop: 2 }}>
            {description}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
