import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ScrollView, type StyleProp } from "react-native";

import { initials } from "@/lib/format";
import {
  Avatar as GSAvatar,
  AvatarFallback,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge as GSBadge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import {
  Button as GSButton,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Divider as GSDivider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text as GSText } from "@/components/ui/text";

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

const VARIANT_STYLE: Record<Variant, string> = {
  display: "text-3xl font-bold tracking-tight",
  title: "text-2xl font-bold tracking-tight",
  heading: "text-lg font-semibold tracking-tight",
  subheading: "text-base font-semibold",
  body: "text-base font-normal",
  bodyStrong: "text-base font-semibold",
  small: "text-sm font-normal",
  tiny: "text-xs font-medium tracking-wide",
  mono: "text-xs font-normal font-mono",
};

const TONE_STYLE = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  destructive: "text-destructive",
  success: "text-success",
  warning: "text-warning",
  gold: "text-gold",
  onPrimary: "text-primary-foreground",
} as const;

export type Tone = keyof typeof TONE_STYLE;

/** `display` and `title` render as a Gluestack `Heading`; the rest as `Text`. */
const HEADING_VARIANTS = new Set<Variant>(["display", "title", "heading"]);

export type TxtProps = {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
  uppercase?: boolean;
  className?: string;
  /** Escape hatch for the per-screen tweaks className cannot express.
   *  Widened deliberately: gluestack's Text accepts the web TextStyle on the
   *  `.web` variant and React Native's on native, so neither type is assignable
   *  to the other and `StyleProp<any>` keeps both platforms compiling. */
  style?: StyleProp<any>;
  children?: ReactNode;
  numberOfLines?: number;
};

export function Txt({
  variant = "body",
  tone = "default",
  center,
  uppercase,
  className = "",
  style,
  children,
  ...rest
}: TxtProps) {
  const styles = [
    VARIANT_STYLE[variant],
    TONE_STYLE[tone],
    center && "text-center",
    uppercase && "uppercase",
    className,
  ].join(" ");

  if (HEADING_VARIANTS.has(variant)) {
    return (
      <Heading {...rest} style={style} className={styles}>
        {children}
      </Heading>
    );
  }
  return (
    <GSText {...rest} style={style} className={styles}>
      {children}
    </GSText>
  );
}

/* -------------------------------------------------------------------- card */

export function Card({
  padded = true,
  className = "",
  style,
  children,
}: {
  padded?: boolean;
  className?: string;
  style?: ComponentProps<typeof Box>["style"];
  children: ReactNode;
}) {
  return (
    <Box
      style={style}
      className={`rounded-xl border border-border bg-card ${padded ? "gap-3 p-4" : ""} ${className}`}
    >
      {children}
    </Box>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <GSDivider className={`bg-border ${className}`} />;
}

/* ------------------------------------------------------------------- badge */

const BADGE_TONE: Record<string, { bg: string; fg: string }> = {
  default: { bg: "bg-primary", fg: "text-primary-foreground" },
  primary: { bg: "bg-primary", fg: "text-primary-foreground" },
  info: { bg: "bg-info", fg: "text-white" },
  success: { bg: "bg-success", fg: "text-white dark:text-primary-foreground" },
  warning: { bg: "bg-warning", fg: "text-white dark:text-primary-foreground" },
  destructive: { bg: "bg-destructive", fg: "text-destructive-foreground" },
  muted: { bg: "bg-accent", fg: "text-muted-foreground" },
};

export function Badge({
  tone = "muted",
  icon,
  children,
  className = "",
}: {
  tone?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const palette = BADGE_TONE[tone] ?? BADGE_TONE.muted;
  return (
    <GSBadge
      className={`rounded-md px-2 py-[3px] self-start ${palette.bg} ${className}`}
    >
      {icon}
      <BadgeText
        className={`text-[11px] font-semibold tracking-wide ${palette.fg}`}
      >
        {children}
      </BadgeText>
    </GSBadge>
  );
}

/* ------------------------------------------------------------------ button */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT: Record<ButtonVariant, { root: string; text: string }> = {
  primary: { root: "bg-primary", text: "text-primary-foreground" },
  secondary: { root: "bg-accent", text: "text-accent-foreground" },
  outline: {
    root: "bg-transparent border border-border",
    text: "text-foreground",
  },
  ghost: { root: "bg-transparent", text: "text-primary" },
  danger: { root: "bg-destructive", text: "text-destructive-foreground" },
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-[34px] px-3 rounded-lg",
  md: "h-11 px-4 rounded-lg",
  lg: "h-13 px-5 rounded-xl",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  fullWidth,
  className = "",
  style,
}: {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: ComponentProps<typeof GSButton>["style"];
}) {
  const palette = BUTTON_VARIANT[variant];
  const isDisabled = disabled || loading;

  return (
    <GSButton
      onPress={isDisabled ? undefined : onPress}
      isDisabled={isDisabled}
      style={style}
      className={`gap-2 ${BUTTON_SIZE[size]} ${palette.root} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {loading ? <ButtonSpinner size="small" /> : null}
      {!loading && icon ? icon : null}
      {title ? (
        <ButtonText
          className={`text-[15px] font-semibold ${BUTTON_SIZE[size].includes("h-[34px]") ? "text-sm" : ""} ${palette.text}`}
        >
          {title}
        </ButtonText>
      ) : null}
    </GSButton>
  );
}

/** Square icon-only button used in headers and on cards. */
export function IconButton({
  onPress,
  children,
  label,
  tone = "surface",
  disabled,
  className = "",
}: {
  onPress?: () => void;
  children: ReactNode;
  label: string;
  tone?: "surface" | "primary" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const bg =
    tone === "primary"
      ? "bg-primary"
      : tone === "ghost"
        ? "bg-transparent"
        : "bg-card border border-border";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`h-9 w-9 items-center justify-center rounded-full ${bg} ${className}`}
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
  tone?: string;
}) {
  const accent = tone === "primary" ? "bg-primary" : "bg-foreground";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full border border-border px-3 py-[7px] ${
        selected ? accent : "bg-card"
      }`}
    >
      {icon}
      <GSText
        className={`text-[13px] font-semibold ${
          selected ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {label}
      </GSText>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove filter ${label}`}
      onPress={onClear}
      className="flex-row items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-[7px]"
    >
      <GSText className="text-[13px] font-semibold text-foreground">
        {label}
      </GSText>
      <Ionicons name="close" size={13} color="#647771" />
    </Pressable>
  );
}

/** Horizontally scrolling chip strip — the mobile stand-in for a filter panel. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 4,
      }}
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
  return (
    <Box className="flex-row gap-[2px] rounded-lg border border-border bg-accent p-[3px]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-2 ${
              active ? "bg-card" : ""
            }`}
          >
            {option.icon}
            <GSText
              className={`text-[13px] ${
                active
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground"
              }`}
            >
              {option.label}
            </GSText>
          </Pressable>
        );
      })}
    </Box>
  );
}

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
  const label = initials(name);

  return (
    <GSAvatar
      className="bg-primary/15"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {uri ? <AvatarImage source={{ uri }} /> : null}
      <AvatarFallback>
        <AvatarFallbackText className="text-primary font-bold">
          {label}
        </AvatarFallbackText>
      </AvatarFallback>
    </GSAvatar>
  );
}
