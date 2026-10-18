import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import { Txt } from "./primitives";

/**
 * Page scaffold: background, safe-area handling and optional scrolling.
 * Native tabs apply the bottom inset, so only the top is padded here — screens
 * hide the native header and draw `ScreenHeader` instead for a consistent bar.
 */
export function Screen({
  children,
  scroll = false,
  refreshing,
  onRefresh,
  contentStyle,
  padded = true,
  header = true,
  edges = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: object;
  padded?: boolean;
  /** Set false when the screen draws its own top chrome (map, gallery). */
  header?: boolean;
  /** Set false for full-bleed content such as a map or an image carousel. */
  edges?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges && header ? insets.top : 0,
    paddingHorizontal: padded ? 16 : 0,
  };

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        pad,
        { paddingBottom: insets.bottom + 40, gap: 16 },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.foregroundMuted}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      style={[styles.flex, { backgroundColor: theme.background }]}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

/** App bar drawn inside a screen — keeps every tab on the same chrome. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  large,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={10}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={theme.foreground} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Txt variant={large ? "display" : "heading"} numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="small" tone="muted" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingTop: 6, paddingBottom: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 38,
  },
  back: { marginLeft: -6, paddingVertical: 4 },
});
