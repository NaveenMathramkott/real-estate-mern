import { Image as ExpoImage } from "expo-image";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from "react-native";

import { initials } from "@/lib/format";
import { useTheme } from "@/theme";

type Tone =
  | "default"
  | "muted"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "destructive";

/* --------------------------------------------------------------- typography */

type Variant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "bodyStrong"
  | "small"
  | "tiny"
  | "mono";

const VARIANTS: Record<
  Variant,
  {
    fontSize: number;
    fontWeight?: "400" | "500" | "600" | "700";
    letterSpacing?: number;
  }
> = {
  display: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  subheading: { fontSize: 15, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyStrong: { fontSize: 15, fontWeight: "600" },
  small: { fontSize: 13, fontWeight: "400" },
  tiny: { fontSize: 11, fontWeight: "500", letterSpacing: 0.3 },
  mono: { fontSize: 12, fontWeight: "400" },
};

export type TextProps_ = TextProps & {
  variant?: Variant;
  tone?:
    | "default"
    | "muted"
    | "primary"
    | "destructive"
    | "success"
    | "warning"
    | "gold"
    | "onPrimary";
  center?: boolean;
  uppercase?: boolean;
};

export function Txt({
  variant = "body",
  tone = "default",
  center,
  uppercase,
  style,
  ...rest
}: TextProps_) {
  const theme = useTheme();
  const colors: Record<string, string> = {
    default: theme.foreground,
    muted: theme.foregroundMuted,
    primary: theme.primary,
    destructive: theme.destructive,
    success: theme.success,
    warning: theme.warning,
    gold: theme.gold,
    onPrimary: theme.onPrimary,
  };
  return (
    <Text
      {...rest}
      style={[
        VARIANTS[variant],
        { color: colors[tone] },
        center && { textAlign: "center" },
        uppercase && styles.uppercase,
        variant === "mono" && styles.mono,
        style,
      ]}
    />
  );
}

/* -------------------------------------------------------------------- card */

export function Card({
  style,
  padded = true,
  ...rest
}: ViewProps & { padded?: boolean }) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 14,
          padding: padded ? 16 : 0,
          gap: 12,
        },
        style,
      ]}
    />
  );
}

export function Divider({ style }: { style?: object }) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
        style,
      ]}
    />
  );
}

/* ------------------------------------------------------------------- badge */

const BADGE_TONES: Record<Tone, { bg: string; fg: string }> = {
  default: { bg: "#0E9F6E", fg: "#FFFFFF" },
  muted: { bg: "#EEF2F0", fg: "#41544E" },
  primary: { bg: "#0E9F6E", fg: "#FFFFFF" },
  success: { bg: "#1E9E64", fg: "#FFFFFF" },
  warning: { bg: "#B07C14", fg: "#FFFFFF" },
  destructive: { bg: "#D4483A", fg: "#FFFFFF" },
  info: { bg: "#2C6BCF", fg: "#FFFFFF" },
};

export function Badge({
  tone = "muted",
  icon,
  children,
  style,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  style?: object;
}) {
  const theme = useTheme();
  const dark = theme.dark;
  const resolved = dark
    ? {
        default: { bg: theme.primarySoft, fg: theme.primary },
        primary: { bg: theme.primarySoft, fg: theme.primary },
        success: { bg: theme.successSoft, fg: theme.success },
        warning: { bg: theme.warningSoft, fg: theme.warning },
        destructive: { bg: theme.destructiveSoft, fg: theme.destructive },
        info: { bg: theme.surfaceRaised, fg: theme.info },
        muted: { bg: theme.surfaceRaised, fg: theme.foregroundMuted },
      }[tone]
    : BADGE_TONES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: resolved.bg }, style]}>
      {icon}
      <Text style={[styles.badgeText, { color: resolved.fg }]}>{children}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ button */

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  fullWidth,
  style,
}: {
  title?: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: object;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: "transparent" },
    secondary: {
      bg: theme.accent,
      fg: theme.foreground,
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      fg: theme.foreground,
      border: theme.borderStrong,
    },
    ghost: { bg: "transparent", fg: theme.primary, border: "transparent" },
    danger: { bg: theme.destructive, fg: "#FFFFFF", border: "transparent" },
  }[variant];

  const heights = { sm: 34, md: 44, lg: 52 };
  const fonts = { sm: 13, md: 15, lg: 16 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(isDisabled),
        busy: Boolean(loading),
      }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          height: heights[size],
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth:
            palette.border === "transparent" ? 0 : StyleSheet.hairlineWidth,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && { alignSelf: "stretch" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {icon}
          {title ? (
            <Text
              style={[
                styles.buttonText,
                { color: palette.fg, fontSize: fonts[size] },
              ]}
            >
              {title}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

/** Square icon-only button used in headers and on cards. */
export function IconButton({
  onPress,
  children,
  label,
  tone = "surface",
  disabled,
  style,
}: {
  onPress?: () => void;
  children: ReactNode;
  label: string;
  tone?: "surface" | "primary" | "ghost";
  disabled?: boolean;
  style?: object;
}) {
  const theme = useTheme();
  const bg =
    tone === "primary"
      ? theme.primary
      : tone === "ghost"
        ? "transparent"
        : theme.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: bg,
          borderColor: tone === "ghost" ? "transparent" : theme.border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/* -------------------------------------------------------------------- chips */

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tone = "primary",
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const theme = useTheme();
  const accent = tone === "primary" ? theme.primary : theme.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : theme.surface,
          borderColor: selected ? accent : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: selected ? theme.onPrimary : theme.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Dismissible summary of an applied filter. */
export function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove filter ${label}`}
      onPress={onClear}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: theme.accent,
          borderColor: theme.borderStrong,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: theme.foreground }]}>
        {label}
      </Text>
      <Text style={{ color: theme.foregroundMuted, fontSize: 14 }}>✕</Text>
    </Pressable>
  );
}

/** Horizontally scrolling chip strip — the mobile stand-in for a filter panel. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {children}
    </ScrollView>
  );
}

/* ------------------------------------------------------------- segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: theme.accent, borderColor: theme.border },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              active && { backgroundColor: theme.surface },
            ]}
          >
            {option.icon}
            <Text
              style={[
                styles.segmentText,
                {
                  color: active ? theme.foreground : theme.foregroundMuted,
                  fontWeight: active ? "600" : "500",
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  uppercase: { textTransform: "uppercase" },
  mono: { fontFamily: "monospace" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.2 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: { fontWeight: "600" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  segmented: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentText: { fontSize: 13 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "700" },
});
/* ------------------------------------------------------------------ avatar */

/** Circular avatar that falls back to initials, mirroring the web `Avatar`. */
export function Avatar({
  name,
  uri,
  size = 40,
}: {
  name?: string;
  uri?: string;
  size?: number;
}) {
  const theme = useTheme();
  const label = initials(name);

  if (uri) {
    return (
      <ExpoImage
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primarySoft,
        },
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          { color: theme.primary, fontSize: size * 0.36 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
