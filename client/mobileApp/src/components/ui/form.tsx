import * as React from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useTheme } from "@/theme";
import { Txt } from "./primitives";

/* ------------------------------------------------------------------ inputs */

const inputProps = {
  sm: { height: 38, paddingVertical: 8, fontSize: 14 },
  md: { height: 46, paddingVertical: 12, fontSize: 15 },
} as const;

function fieldStyle(
  theme: ReturnType<typeof useTheme>,
  size: "sm" | "md",
  invalid?: boolean,
) {
  return {
    height: inputProps[size].height,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: invalid ? theme.destructive : theme.border,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    color: theme.foreground,
    fontSize: inputProps[size].fontSize,
  } as const;
}

export function Input({
  size = "md",
  invalid,
  style,
  ...rest
}: TextInputProps & { size?: "sm" | "md"; invalid?: boolean }) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.foregroundMuted}
      {...rest}
      style={[fieldStyle(theme, size, invalid), style]}
    />
  );
}

export function Textarea({
  style,
  ...rest
}: TextInputProps & { minHeight?: number }) {
  const theme = useTheme();
  return (
    <TextInput
      multiline
      placeholderTextColor={theme.foregroundMuted}
      textAlignVertical="top"
      {...rest}
      style={[
        {
          minHeight: 96,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          backgroundColor: theme.surface,
          padding: 12,
          color: theme.foreground,
          fontSize: 15,
        },
        style,
      ]}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="small" tone="muted">
        {label}
        {required ? " *" : ""}
      </Txt>
      {children}
      {error ? (
        <Txt variant="tiny" tone="destructive">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="tiny" tone="muted">
          {hint}
        </Txt>
      ) : null}
      {!error && !hint ? null : (
        <View style={{ height: 0, backgroundColor: theme.border }} />
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ select */

/** Bottom-sheet option list. A native picker cannot show the descriptions and
 *  two-line labels the reference-data pickers need. */
export function OptionSheet({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { value: string; label: string; description?: string }[];
  value?: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            paddingBottom: 32,
          },
        ]}
      >
        <Txt
          variant="heading"
          style={{ paddingHorizontal: 16, paddingTop: 16 }}
        >
          {title}
        </Txt>
        <View style={{ maxHeight: 380, marginTop: 8 }}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed ? theme.accent : "transparent",
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{option.label}</Txt>
                  {option.description ? (
                    <Txt variant="small" tone="muted" style={{ marginTop: 2 }}>
                      {option.description}
                    </Txt>
                  ) : null}
                </View>
                {active ? (
                  <Txt tone="primary" variant="bodyStrong">
                    ✓
                  </Txt>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Trigger that opens an `OptionSheet`. */
export function Select({
  label,
  value,
  placeholder = "Select…",
  options,
  onSelect,
  invalid,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  options: { value: string; label: string; description?: string }[];
  onSelect: (value: string) => void;
  invalid?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Txt variant="small" tone="muted">
          {label}
        </Txt>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={[
          styles.select,
          {
            backgroundColor: theme.surface,
            borderColor: invalid ? theme.destructive : theme.border,
          },
        ]}
      >
        <Txt
          variant="body"
          tone={selected ? "default" : "muted"}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {selected?.label ?? placeholder}
        </Txt>
        <Txt variant="small" tone="muted">
          ▾
        </Txt>
      </Pressable>
      <OptionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? placeholder}
        options={options}
        value={value}
        onSelect={onSelect}
      />
    </View>
  );
}

export function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{label}</Txt>
        {description ? (
          <Txt variant="small" tone="muted" style={{ marginTop: 2 }}>
            {description}
          </Txt>
        ) : null}
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? theme.primary : theme.borderStrong,
          },
        ]}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: theme.surface,
              alignSelf: value ? "flex-end" : "flex-start",
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ slider */

/**
 * Minimal dual-thumb price slider. React Native ships no slider primitive and
 * the community packages add a native dependency for one numeric input, so this
 * drives both thumbs off a single pan responder over a shared track.
 */
export function RangeSlider({
  min,
  max,
  step,
  lower,
  upper,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  lower: number;
  upper: number;
  onChange: (lower: number, upper: number) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);

  const clampToStep = (value: number) =>
    Math.min(max, Math.max(min, Math.round(value / step) * step));

  const valueFromX = (x: number) =>
    clampToStep(min + (x / Math.max(1, width)) * (max - min));

  const startAt = (x: number) => {
    const value = valueFromX(x);
    // Grab whichever thumb is closer so a tap always moves the intuitive one.
    const distanceToLower = Math.abs(value - lower);
    const distanceToUpper = Math.abs(value - upper);
    if (distanceToLower <= distanceToUpper)
      onChange(Math.min(value, upper), upper);
    else onChange(lower, Math.max(value, lower));
  };

  const pct = (value: number) => ((value - min) / (max - min)) * 100;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.sliderRoot}
    >
      <View style={[styles.sliderTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.sliderFill,
            {
              backgroundColor: theme.primary,
              left: `${pct(lower)}%`,
              width: `${Math.max(0, pct(upper) - pct(lower))}%`,
            },
          ]}
        />
      </View>

      {[
        { value: lower, key: "lower" },
        { value: upper, key: "upper" },
      ].map((thumb) => (
        <Thumb
          key={thumb.key}
          theme={theme}
          left={`${pct(thumb.value)}%`}
          onStart={(x) => {
            if (width === 0) return;
            const value = valueFromX(x);
            if (thumb.key === "lower") onChange(Math.min(value, upper), upper);
            else onChange(lower, Math.max(value, lower));
          }}
        />
      ))}
      {/* Invisible full-width responder: tapping the track moves the nearest thumb. */}
      <Pressable
        accessibilityRole="adjustable"
        style={StyleSheet.absoluteFill}
        onPress={(event) => startAt(event.nativeEvent.locationX)}
      />
    </View>
  );
}

function Thumb({
  left,
  onStart,
  theme,
}: {
  left: string;
  onStart: (x: number) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [startX, setStartX] = React.useState<number | null>(null);

  return (
    <View
      accessibilityRole="adjustable"
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => startX === null}
      onResponderGrant={(event) => setStartX(event.nativeEvent.locationX)}
      onResponderMove={(event) => {
        if (startX === null) {
          onStart(event.nativeEvent.locationX);
        } else {
          onStart(startX + (event.nativeEvent.locationX - startX));
        }
      }}
      onResponderRelease={() => setStartX(null)}
      onResponderTerminate={() => setStartX(null)}
      style={[styles.thumbHit, { left } as object]}
    >
      <View
        style={[
          styles.thumbVisual,
          { backgroundColor: theme.surface, borderColor: theme.primary },
        ]}
      />
    </View>
  );
}

export function Loader({ label }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={theme.primary} />
      {label ? (
        <Txt variant="small" tone="muted" style={{ marginTop: 8 }}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  select: {
    height: 46,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: "center",
  },
  thumb: { width: 22, height: 22, borderRadius: 11 },
  sliderRoot: { height: 40, justifyContent: "center" },
  sliderTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  sliderFill: { position: "absolute", top: 0, bottom: 0 },
  thumbHit: {
    position: "absolute",
    width: 32,
    height: 40,
    marginLeft: -16,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbVisual: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  loader: { paddingVertical: 32, alignItems: "center" },
});
