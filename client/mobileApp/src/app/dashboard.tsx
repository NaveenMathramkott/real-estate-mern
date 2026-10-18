import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { dashboardApi, favoriteApi } from "@/lib/api";
import {
  formatCurrency,
  formatNumber,
  formatRelative,
  pluralise,
} from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type {
  AdminDashboard,
  AgentDashboard,
  BuyerDashboard,
} from "@/lib/types";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { PropertyRow } from "@/components/property/property-card";
import {
  Distribution,
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionCard,
  StatTile,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";

function BuyerPanel({ data }: { data: BuyerDashboard }) {
  const router = useRouter();
  const summary = data.summary;

  const favourites = useQuery("get|/favorites|dashboard", () =>
    favoriteApi.list(),
  );

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.tileRow}>
        <StatTile
          label="Shortlisted"
          value={formatNumber(summary.favorites)}
          hint="Listings you saved"
          icon="heart-outline"
          onPress={() => router.push("/saved")}
        />
        <StatTile
          label="Saved searches"
          value={formatNumber(summary.savedSearches)}
          hint="With alerts set"
          icon="bookmark-outline"
          onPress={() => router.push("/saved-searches")}
        />
      </View>
      <View style={styles.tileRow}>
        <StatTile
          label="Enquiries sent"
          value={formatNumber(summary.inquiriesSent)}
          icon="mail-outline"
        />
        <StatTile
          label="Messages"
          value={formatNumber(summary.conversations)}
          icon="chatbubbles-outline"
          onPress={() => router.push("/chats")}
        />
      </View>

      <SectionCard title="What you are watching is worth">
        {Object.keys(data.favoriteSummary ?? {}).length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title="Your shortlist is empty"
            description="Tap the heart on any listing and its value shows up here."
            action={
              <Button
                title="Start searching"
                size="sm"
                onPress={() => router.push("/")}
              />
            }
          />
        ) : (
          Object.entries(data.favoriteSummary ?? {}).map(([purpose, stats]) => (
            <View key={purpose} style={{ gap: 8, paddingVertical: 6 }}>
              <View style={styles.rowBetween}>
                <Txt variant="heading" style={{ textTransform: "capitalize" }}>
                  For {purpose}
                </Txt>
                <Badge tone="muted">{pluralise(stats.count, "home")}</Badge>
              </View>
              <Txt variant="title">
                {formatCurrency(stats.totalValue, undefined, true)}
              </Txt>
              <View style={styles.miniStats}>
                <MiniStat
                  label="Average"
                  value={formatCurrency(stats.avgPrice, undefined, true)}
                />
                <MiniStat
                  label="Lowest"
                  value={formatCurrency(stats.minPrice, undefined, true)}
                />
                <MiniStat
                  label="Highest"
                  value={formatCurrency(stats.maxPrice, undefined, true)}
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Recently shortlisted"
        action={
          <Button
            title="All"
            size="sm"
            variant="ghost"
            onPress={() => router.push("/saved")}
          />
        }
      >
        {favourites.isLoading ? (
          <LoadingBlock />
        ) : (favourites.data?.favorites ?? []).length === 0 ? (
          <Txt variant="small" tone="muted">
            Nothing saved yet.
          </Txt>
        ) : (
          (favourites.data?.favorites ?? [])
            .slice(0, 4)
            .map((favorite) =>
              typeof favorite.propertyId === "string" ? null : (
                <PropertyRow
                  key={favorite._id}
                  property={favorite.propertyId as never}
                />
              ),
            )
        )}
      </SectionCard>

      <SectionCard title="Recent enquiries">
        {(data.recentInquiries ?? []).length === 0 ? (
          <Txt variant="small" tone="muted">
            You have not sent any enquiries yet.
          </Txt>
        ) : (
          data.recentInquiries.map((inquiry) => (
            <View key={inquiry._id} style={styles.inquiryRow}>
              <View style={{ flex: 1 }}>
                <Txt variant="small" numberOfLines={1}>
                  {inquiry.message}
                </Txt>
                <Txt variant="tiny" tone="muted">
                  {formatRelative(inquiry.createdAt)}
                </Txt>
              </View>
              <Badge tone="muted">{inquiry.status}</Badge>
            </View>
          ))
        )}
      </SectionCard>
    </View>
  );
}

function ListerPanel({
  data,
  isLandlord,
}: {
  data: AgentDashboard;
  isLandlord: boolean;
}) {
  const router = useRouter();
  const summary = data.summary;

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.tileRow}>
        <StatTile
          label={isLandlord ? "Properties" : "Listings"}
          value={formatNumber(summary.totalListings)}
          hint={`${summary.activeListings} active`}
          icon="home-outline"
          onPress={() => router.push("/listings")}
        />
        <StatTile
          label="Portfolio value"
          value={formatCurrency(summary.portfolioValue, undefined, true)}
          hint={`${formatCurrency(summary.livePortfolioValue, undefined, true)} live`}
          icon="wallet-outline"
        />
      </View>
      <View style={styles.tileRow}>
        <StatTile
          label="Open enquiries"
          value={formatNumber(summary.newInquiries)}
          hint={`${summary.totalInquiries} total`}
          icon="mail-outline"
          onPress={() => router.push("/inquiries")}
        />
        <StatTile
          label="Media assets"
          value={formatNumber(summary.mediaAssets)}
          hint="Across all listings"
          icon="images-outline"
        />
      </View>

      <SectionCard title="Listings by status">
        <Distribution data={data.listingsByStatus ?? {}} />
      </SectionCard>
      <SectionCard title="Listings by purpose">
        <Distribution data={data.listingsByPurpose ?? {}} />
      </SectionCard>
      <SectionCard title="Lead pipeline">
        <Distribution data={data.inquiriesByStatus ?? {}} />
      </SectionCard>

      <SectionCard
        title="Recent listings"
        action={
          <Button
            title="Manage"
            size="sm"
            variant="ghost"
            onPress={() => router.push("/listings")}
          />
        }
      >
        {(data.recentListings ?? []).length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="No listings yet"
            description="Publish your first property and it will appear in your pipeline."
            action={
              <Button
                title="Create listing"
                size="sm"
                onPress={() => router.push("/listings/new")}
              />
            }
          />
        ) : (
          data.recentListings.map((property) => (
            <PropertyRow key={property._id} property={property} />
          ))
        )}
      </SectionCard>

      <SectionCard title="Recent price changes">
        {(data.recentPriceChanges ?? []).length === 0 ? (
          <Txt variant="small" tone="muted">
            No price changes recorded yet.
          </Txt>
        ) : (
          data.recentPriceChanges.map((change) => (
            <View key={change._id} style={styles.inquiryRow}>
              <View style={{ flex: 1 }}>
                <Txt variant="small">
                  {formatCurrency(change.oldPrice, undefined, true)} →{" "}
                  {formatCurrency(change.newPrice, undefined, true)}
                </Txt>
                <Txt variant="tiny" tone="muted">
                  {formatRelative(change.changedAt)}
                </Txt>
              </View>
              <Badge
                tone={change.newPrice < change.oldPrice ? "success" : "warning"}
              >
                {change.newPrice < change.oldPrice ? "Drop" : "Rise"}
              </Badge>
            </View>
          ))
        )}
      </SectionCard>
    </View>
  );
}

function AdminPanel({ data }: { data: AdminDashboard }) {
  const summary = data.summary;
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.tileRow}>
        <StatTile
          label="Users"
          value={formatNumber(summary.totalUsers)}
          hint={`${summary.verifiedUsers} verified`}
          icon="people-outline"
        />
        <StatTile
          label="Listings"
          value={formatNumber(summary.totalProperties)}
          hint={`${summary.verifiedProperties} verified`}
          icon="home-outline"
        />
      </View>
      <View style={styles.tileRow}>
        <StatTile
          label="Agencies"
          value={formatNumber(summary.totalAgencies)}
          hint={`${summary.verifiedAgencies} verified`}
          icon="briefcase-outline"
        />
        <StatTile
          label="Messages"
          value={formatNumber(summary.totalMessages)}
          icon="chatbubbles-outline"
        />
      </View>
      <View style={styles.tileRow}>
        <StatTile
          label="Closed deals"
          value={formatNumber(summary.closedDeals)}
          icon="checkmark-done-outline"
        />
        <StatTile
          label="Deal value"
          value={formatCurrency(summary.closedDealValue, undefined, true)}
          icon="wallet-outline"
        />
      </View>

      <SectionCard title="Verification queues">
        <View style={styles.queueRow}>
          <View style={{ flex: 1 }}>
            <Txt variant="small" tone="muted">
              Unverified users
            </Txt>
            <Txt variant="heading">
              {formatNumber(data.unverified.users.count)}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="small" tone="muted">
              Unverified listings
            </Txt>
            <Txt variant="heading">
              {formatNumber(data.unverified.properties.count)}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="small" tone="muted">
              Unverified agencies
            </Txt>
            <Txt variant="heading">
              {formatNumber(data.unverified.agencies.count)}
            </Txt>
          </View>
        </View>
        <Txt variant="tiny" tone="muted">
          Verification actions live in the admin panel web client; this app is
          read-only for admins.
        </Txt>
      </SectionCard>

      <SectionCard title="Reviews by target">
        <Distribution data={summary.reviewsByTarget ?? {}} />
      </SectionCard>

      <SectionCard title="Recent listings">
        {(data.recentProperties ?? []).map((property) => (
          <PropertyRow key={property._id} property={property} />
        ))}
      </SectionCard>
    </View>
  );
}

/** Role-aware dashboard, matching the web client's `/dashboard` page. */
export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role as never) ?? user?.role;
  const isLister = role === "agent" || role === "landlord" || role === "admin";

  // The API returns one of three shapes depending on the caller's role, so the
  // query is typed as the union and narrowed at the render site.
  const { data, isLoading, error, refetch } = useQuery<
    AdminDashboard | AgentDashboard | BuyerDashboard
  >(user ? `get|/dashboard|${role ?? "generic"}` : null, async () => {
    if (role === "admin") return dashboardApi.admin();
    if (role === "agent" || role === "landlord") return dashboardApi.agent();
    return dashboardApi.buyer();
  });

  return (
    <RequireAuth>
      <Screen scroll>
        <ScreenHeader
          title={isLister ? "Your portfolio" : "Pick up where you left off"}
          subtitle={`${ROLE_LABELS[role ?? "buyer"]} dashboard`}
          onBack={() => router.back()}
          right={
            <Pressable
              accessibilityRole="button"
              onPress={() => void refetch()}
            >
              <Txt variant="small" style={{ color: theme.primary }}>
                Refresh
              </Txt>
            </Pressable>
          }
        />

        {isLister ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/listings/new")}
            style={[styles.primaryCta, { backgroundColor: theme.primary }]}
          >
            <Txt variant="bodyStrong" style={{ color: "#FFFFFF" }}>
              + New listing
            </Txt>
          </Pressable>
        ) : null}

        {isLoading ? <LoadingBlock /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : null}

        {!isLoading && !error && user?.role === "admin" ? (
          <AdminPanel data={data as AdminDashboard} />
        ) : null}
        {!isLoading && !error && data && isLister && user?.role !== "admin" ? (
          <ListerPanel
            data={data as unknown as AgentDashboard}
            isLandlord={role === "landlord"}
          />
        ) : null}
        {!isLoading && !error && data && !isLister ? (
          <BuyerPanel data={data as unknown as BuyerDashboard} />
        ) : null}
      </Screen>
    </RequireAuth>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Txt variant="tiny" tone="muted">
        {label}
      </Txt>
      <Txt variant="small">{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: "row", gap: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniStats: { flexDirection: "row", gap: 10 },
  inquiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  primaryCta: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  queueRow: { flexDirection: "row", gap: 10 },
});
