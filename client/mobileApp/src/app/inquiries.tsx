import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { inquiryApi } from "@/lib/api";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { formatRelative, idOf } from "@/lib/format";
import { LISTER_ROLES } from "@/lib/roles";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useTheme } from "@/theme";
import { Badge, Chip, Txt } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";

/** Leads addressed to the signed-in agent or landlord. */
export default function InquiriesScreen() {
  const router = useRouter();
  const [status, setStatus] = React.useState<InquiryStatus | undefined>();

  const { data, isLoading, error, refetch } = useQuery(
    "get|/inquiries",
    () => inquiryApi.list(),
    { staleTime: 15_000 },
  );

  const update = useMutation({
    mutationFn: ({ id, next }: { id: string; next: InquiryStatus }) =>
      inquiryApi.setStatus(id, next),
  });

  const inquiries = (data?.inquiries ?? []).filter(
    (inquiry) => !status || inquiry.status === status,
  );

  return (
    <RequireAuth roles={LISTER_ROLES}>
      <Screen>
        <ScreenHeader
          title="Enquiries"
          subtitle={`${inquiries.length} shown`}
          onBack={() => router.back()}
        />

        <View style={styles.statusRow}>
          <Chip
            label="All"
            selected={!status}
            onPress={() => setStatus(undefined)}
          />
          {INQUIRY_STATUSES.map((value) => (
            <Chip
              key={value}
              label={value}
              selected={status === value}
              onPress={() => setStatus(value)}
            />
          ))}
        </View>

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : inquiries.length === 0 ? (
          <EmptyState
            icon="mail-outline"
            title="No enquiries here"
            description="When someone asks about one of your listings it lands here."
          />
        ) : (
          <View style={styles.list}>
            {inquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry._id}
                inquiry={inquiry}
                busy={update.isPending}
                onStatus={(next) => {
                  void update
                    .mutateAsync({ id: inquiry._id, next })
                    .catch(() => undefined);
                }}
              />
            ))}
          </View>
        )}
      </Screen>
    </RequireAuth>
  );
}

function InquiryCard({
  inquiry,
  busy,
  onStatus,
}: {
  inquiry: Inquiry;
  busy: boolean;
  onStatus: (status: InquiryStatus) => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const propertyId = idOf(inquiry.propertyId);
  const inquirer = idOf(inquiry.userId);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: busy ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Badge
          tone={
            inquiry.status === "new"
              ? "info"
              : inquiry.status === "contacted"
                ? "warning"
                : "muted"
          }
        >
          {inquiry.status ?? "unknown"}
        </Badge>
        <Txt variant="tiny" tone="muted">
          {formatRelative(inquiry.createdAt)}
        </Txt>
      </View>

      <Txt variant="body">{inquiry.message}</Txt>

      {propertyId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/property/${propertyId}`)}
          style={styles.link}
        >
          <Ionicons name="home-outline" size={13} color={theme.primary} />
          <Txt
            variant="small"
            style={{ color: theme.primary, flex: 1 }}
            numberOfLines={1}
          >
            View the listing this is about
          </Txt>
          <Ionicons name="chevron-forward" size={13} color={theme.primary} />
        </Pressable>
      ) : null}

      <Select
        label="Update status"
        value={inquiry.status}
        onSelect={(value) => onStatus(value as InquiryStatus)}
        options={INQUIRY_STATUSES.map((value) => ({
          value,
          label:
            value === "new"
              ? "New — not yet answered"
              : value === "contacted"
                ? "Contacted — replied"
                : "Closed — dealt or dropped",
        }))}
      />

      {inquirer ? (
        <Txt variant="tiny" tone="muted">
          From user {inquirer.slice(-8)}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  list: { flex: 1, gap: 12 },
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  link: { flexDirection: "row", alignItems: "center", gap: 6 },
});
