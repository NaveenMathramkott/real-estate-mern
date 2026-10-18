import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { formatCurrency } from "@/lib/format";
import { useTheme } from "@/theme";
import { Button, Card, Divider, Txt } from "./primitives";

/** Full-screen busy state. */
export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Txt variant="title" tone="muted">
        …
      </Txt>
      <Txt variant="small" tone="muted" style={{ marginTop: 8 }}>
        {label}
      </Txt>
      <View
        style={{
          height: 4,
          width: 120,
          marginTop: 12,
          backgroundColor: theme.border,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={34} color="#D4483A" />
      <Txt variant="subheading" center style={{ marginTop: 12 }}>
        Something went wrong
      </Txt>
      <Txt variant="small" tone="muted" center style={{ marginTop: 6 }}>
        {message}
      </Txt>
      {onRetry ? (
        <Button
          title="Try again"
          variant="outline"
          size="sm"
          onPress={onRetry}
          style={{ marginTop: 16 }}
        />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  description,
  action,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accent }]}>
        <Ionicons name={icon} size={24} color={theme.foregroundMuted} />
      </View>
      <Txt variant="subheading" center style={{ marginTop: 14 }}>
        {title}
      </Txt>
      {description ? (
        <Txt variant="small" tone="muted" center style={{ marginTop: 6 }}>
          {description}
        </Txt>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

/** Small-screen replacement for the web app's `SectionHeading`. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      {eyebrow ? (
        <Txt variant="tiny" tone="primary" uppercase>
          {eyebrow}
        </Txt>
      ) : null}
      <View style={styles.headingRow}>
        <Txt variant="title" style={{ flex: 1 }}>
          {title}
        </Txt>
        {action}
      </View>
      {description ? (
        <Txt variant="small" tone="muted">
          {description}
        </Txt>
      ) : null}
    </View>
  );
}

/** Key/value tile used across detail screens and dashboards. */
export function KeyValue({
  label,
  value,
  hint,
  icon,
  flex = true,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  flex?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.keyValue, flex && { flex: 1 }]}>
      <View style={styles.keyValueLabel}>
        {icon ? (
          <Ionicons name={icon} size={12} color={theme.foregroundMuted} />
        ) : null}
        <Txt variant="tiny" tone="muted" uppercase>
          {label}
        </Txt>
      </View>
      {typeof value === "string" || typeof value === "number" ? (
        <Txt variant="bodyStrong" style={{ marginTop: 3 }}>
          {value}
        </Txt>
      ) : (
        value
      )}
      {hint ? (
        <Txt variant="tiny" tone="muted" style={{ marginTop: 2 }}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/** Compact metric tile — the mobile stand-in for the dashboard `StatTile`. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  onPress,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
}) {
  const theme = useTheme();
  const body = (
    <Card style={styles.statTile}>
      <View style={styles.statHeader}>
        <Txt
          variant="tiny"
          tone="muted"
          uppercase
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {label}
        </Txt>
        {icon ? <Ionicons name={icon} size={15} color={theme.primary} /> : null}
      </View>
      {typeof value === "string" ? <Txt variant="title">{value}</Txt> : value}
      {hint ? (
        <Txt variant="tiny" tone="muted" numberOfLines={1}>
          {hint}
        </Txt>
      ) : null}
    </Card>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={styles.statPress}>
      {body}
    </Pressable>
  );
}

/** Horizontal distribution bar + legend for status/bedroom mixes. */
export function Distribution({
  data,
  currency,
}: {
  data: Record<string, { count: number; avgPrice?: number } | number>;
  currency?: string;
}) {
  const theme = useTheme();
  const entries = Object.entries(data).filter(
    ([, value]) =>
      (typeof value === "number" ? value : (value?.count ?? 0)) > 0,
  );
  const total = entries.reduce(
    (sum, [, value]) =>
      sum + (typeof value === "number" ? value : (value?.count ?? 0)),
    0,
  );

  if (total === 0) {
    return (
      <Txt variant="small" tone="muted">
        Nothing here yet.
      </Txt>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.distBar}>
        {entries.map(([key, value], index) => {
          const count = typeof value === "number" ? value : (value?.count ?? 0);
          return (
            <View
              key={key}
              style={{
                flex: count,
                backgroundColor: theme.chart[index % theme.chart.length],
              }}
            />
          );
        })}
      </View>
      {entries.map(([key, value], index) => {
        const isCount = typeof value === "number";
        const count = isCount ? value : (value?.count ?? 0);
        const avg = isCount ? undefined : value?.avgPrice;
        return (
          <View key={key} style={styles.distRow}>
            <View
              style={[
                styles.distDot,
                { backgroundColor: theme.chart[index % theme.chart.length] },
              ]}
            />
            <Txt variant="small" style={{ flex: 1 }} numberOfLines={1}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Txt>
            <Txt variant="small" tone="muted">
              {count}
            </Txt>
            {avg !== undefined ? (
              <Txt
                variant="tiny"
                tone="muted"
                style={{ width: 64, textAlign: "right" }}
              >
                {formatCurrency(avg, currency, true)}
              </Txt>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** Prev/next pager mirroring the web results pagination. */
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <Button
        title="Previous"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
      />
      <Txt variant="small" tone="muted">
        Page {page} of {pages}
      </Txt>
      <Button
        title="Next"
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}

/** Tappable settings-style row used by the account hub. */
export function ListRow({
  icon,
  label,
  description,
  value,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const tint = danger ? theme.destructive : theme.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        {
          backgroundColor: pressed ? theme.accent : "transparent",
          borderColor: theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.listIcon,
          {
            backgroundColor: danger ? theme.destructiveSoft : theme.primarySoft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={danger ? theme.destructive : theme.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" style={{ color: tint }}>
          {label}
        </Txt>
        {description ? (
          <Txt
            variant="tiny"
            tone="muted"
            numberOfLines={2}
            style={{ marginTop: 2 }}
          >
            {description}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt variant="small" tone="muted">
          {value}
        </Txt>
      ) : null}
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.foregroundMuted}
        />
      ) : null}
    </Pressable>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <View style={styles.headingRow}>
        <Txt variant="heading" style={{ flex: 1 }}>
          {title}
        </Txt>
        {action}
      </View>
      <Divider />
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 2,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  keyValue: { minWidth: 100 },
  keyValueLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  statTile: { flex: 1, gap: 4, minHeight: 84 },
  statPress: { flex: 1, flexDirection: "row" },
  statHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  distBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    gap: 2,
  },
  distRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  distDot: { width: 8, height: 8, borderRadius: 4 },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
