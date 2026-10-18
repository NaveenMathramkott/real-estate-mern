import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { Txt } from "./primitives";

/**
 * Page scaffold. Native tabs apply the bottom inset, so only the top is padded
 * here — screens hide the native header and draw `ScreenHeader` instead for a
 * consistent bar.
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
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      className="flex-1 bg-background"
    >
      <Box
        style={[
          {
            paddingTop: edges && header ? insets.top : 0,
            paddingHorizontal: padded ? 16 : 0,
          },
          contentStyle,
        ]}
        className={scroll ? "flex-1" : "flex-1"}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: insets.bottom + 40,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={Boolean(refreshing)}
                  onRefresh={onRefresh}
                  tintColor="#647771"
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </Box>
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
  return (
    <VStack className="pb-2.5 pt-1.5" space="xs">
      <HStack className="min-h-[38px] items-center gap-2.5">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={10}
            className="-ml-1.5 py-1"
          >
            <Ionicons name="chevron-back" size={22} color="#0B2A23" />
          </Pressable>
        ) : null}
        <Box className="flex-1">
          <Txt variant={large ? "display" : "heading"} numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="small" tone="muted" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </Box>
        {right}
      </HStack>
    </VStack>
  );
}
