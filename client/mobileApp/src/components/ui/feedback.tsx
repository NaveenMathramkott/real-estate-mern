import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

import { formatCurrency } from "@/lib/format";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { Button, Card, Txt } from "./primitives";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Full-screen busy state. */
export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <Center className="gap-2 px-6 py-10">
      <Spinner size="small" className="text-primary" />
      {label ? (
        <Txt variant="small" tone="muted">
          {label}
        </Txt>
      ) : null}
    </Center>
  );
}

/** Error state, built on gluestack's `Alert` so the role/status are announced. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Center className="gap-2 px-6 py-10">
      <Alert className="items-center border-destructive/40 bg-destructive/10">
        <AlertIcon className="text-destructive" />
        <AlertText className="flex-1">
          <Txt variant="subheading" center>
            Something went wrong
          </Txt>
          <Txt variant="small" tone="muted" center>
            {message}
          </Txt>
        </AlertText>
      </Alert>
      {onRetry ? (
        <Button
          title="Try again"
          variant="outline"
          size="sm"
          onPress={onRetry}
        />
      ) : null}
    </Center>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Center className="gap-2 px-6 py-10">
      <Center className="h-13 w-13 rounded-full bg-accent">
        <Ionicons name={icon} size={24} color="#647771" />
      </Center>
      <Txt variant="subheading" center className="mt-2">
        {title}
      </Txt>
      {description ? (
        <Txt variant="small" tone="muted" center>
          {description}
        </Txt>
      ) : null}
      {action ? <Box className="mt-3">{action}</Box> : null}
    </Center>
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
    <VStack space="sm">
      {eyebrow ? (
        <Txt variant="tiny" tone="primary" uppercase>
          {eyebrow}
        </Txt>
      ) : null}
      <HStack className="items-center gap-2">
        <Txt variant="title" className="flex-1">
          {title}
        </Txt>
        {action}
      </HStack>
      {description ? (
        <Txt variant="small" tone="muted">
          {description}
        </Txt>
      ) : null}
    </VStack>
  );
}

/** Key/value tile used across detail screens and dashboards. */
export function KeyValue({
  label,
  value,
  hint,
  icon,
  flex = true,
  style,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  /** Pass `false` inside a wrapping grid that sizes its own cells. */
  flex?: boolean;
  style?: object;
}) {
  return (
    <Box style={style} className={flex ? "flex-1" : undefined}>
      <HStack className="items-center gap-1">
        {icon ? <Ionicons name={icon} size={12} color="#647771" /> : null}
        {/* Labels never wrap: a two-line label breaks the row rhythm in every
            grid that uses KeyValue. */}
        <Txt
          variant="tiny"
          tone="muted"
          uppercase
          numberOfLines={1}
          className="flex-1"
        >
          {label}
        </Txt>
      </HStack>
      {typeof value === "string" || typeof value === "number" ? (
        <Txt variant="bodyStrong" className="mt-0.5">
          {value}
        </Txt>
      ) : (
        value
      )}
      {hint ? (
        <Txt variant="tiny" tone="muted" className="mt-0.5">
          {hint}
        </Txt>
      ) : null}
    </Box>
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
  icon?: IconName;
  onPress?: () => void;
}) {
  const body = (
    <Card className="min-h-[84px] flex-1 gap-1">
      <HStack className="items-center gap-1.5">
        <Txt
          variant="tiny"
          tone="muted"
          uppercase
          numberOfLines={1}
          className="flex-1"
        >
          {label}
        </Txt>
        {icon ? <Ionicons name={icon} size={15} color="#0E9F6E" /> : null}
      </HStack>
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
    <Pressable onPress={onPress} className="flex-1 flex-row">
      {body}
    </Pressable>
  );
}

const CHART = [
  "bg-primary",
  "bg-gold",
  "bg-info",
  "bg-destructive",
  "bg-warning",
];

/** Horizontal distribution bar + legend for status/bedroom mixes. */
export function Distribution({
  data,
  currency,
}: {
  data: Record<string, { count: number; avgPrice?: number } | number>;
  currency?: string;
}) {
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
    <VStack space="md">
      <HStack className="h-2 overflow-hidden rounded-full">
        {entries.map(([key, value], index) => {
          const count = typeof value === "number" ? value : (value?.count ?? 0);
          return (
            <Box
              key={key}
              className={CHART[index % CHART.length]}
              style={{ flexGrow: count }}
            />
          );
        })}
      </HStack>

      {entries.map(([key, value], index) => {
        const isCount = typeof value === "number";
        const count = isCount ? value : (value?.count ?? 0);
        const avg = isCount ? undefined : value?.avgPrice;
        return (
          <HStack key={key} className="items-center gap-2">
            <Box
              className={`h-2 w-2 rounded-full ${CHART[index % CHART.length]}`}
            />
            <Txt variant="small" numberOfLines={1} className="flex-1">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Txt>
            <Txt variant="small" tone="muted">
              {count}
            </Txt>
            {avg !== undefined ? (
              <Txt variant="tiny" tone="muted" className="w-16 text-right">
                {formatCurrency(avg, currency, true)}
              </Txt>
            ) : null}
          </HStack>
        );
      })}
    </VStack>
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
    <HStack className="items-center justify-between py-3">
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
    </HStack>
  );
}

/** Tappable settings-style row used by the profile hub. */
export function ListRow({
  icon,
  label,
  description,
  value,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
    >
      <Center
        className={`h-8 w-8 rounded-[10px] ${danger ? "bg-destructive/10" : "bg-primary/10"}`}
      >
        <Ionicons
          name={icon}
          size={16}
          color={danger ? "#D4483A" : "#0E9F6E"}
        />
      </Center>
      <Box className="flex-1">
        <Txt variant="bodyStrong" tone={danger ? "destructive" : "default"}>
          {label}
        </Txt>
        {description ? (
          <Txt variant="tiny" tone="muted" numberOfLines={2} className="mt-0.5">
            {description}
          </Txt>
        ) : null}
      </Box>
      {value ? (
        <Txt variant="small" tone="muted">
          {value}
        </Txt>
      ) : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color="#647771" />
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
      <HStack className="items-center gap-2">
        <Txt variant="heading" className="flex-1">
          {title}
        </Txt>
        {action}
      </HStack>
      <Divider />
      {children}
    </Card>
  );
}
