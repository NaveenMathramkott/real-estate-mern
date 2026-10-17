import {
  ArrowRightIcon,
  BedDoubleIcon,
  Building2Icon,
  HeartIcon,
  InboxIcon,
  ListChecksIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionHeading,
} from "@/components/common";
import { PropertyRow } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@/hooks/use-query";
import { dashboardApi, favoriteApi } from "@/lib/api";
import {
  formatCurrency,
  formatNumber,
  formatRelative,
  pluralise,
} from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import type { AgentDashboard, BuyerDashboard } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/roles";

function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  to,
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof HeartIcon;
  hint?: string;
  to?: string;
}) {
  const body = (
    <Card className="lift-hover h-full gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
          {label}
        </span>
        <span className="bg-accent text-primary flex size-8 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="font-display text-2xl leading-none font-medium tabular">
        {value}
      </p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </Card>
  );

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Distribution bar used for status and bedroom mixes. */
function Distribution({
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
    return <p className="text-muted-foreground text-sm">Nothing here yet.</p>;
  }

  const palette = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-2 overflow-hidden rounded-full">
        {entries.map(([key, value], index) => {
          const count = typeof value === "number" ? value : (value?.count ?? 0);
          return (
            <span
              key={key}
              className={cnBar(palette[index % palette.length])}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${key}: ${count}`}
            />
          );
        })}
      </div>
      <ul className="space-y-2">
        {entries.map(([key, value], index) => {
          const isCount = typeof value === "number";
          const count = isCount ? value : (value?.count ?? 0);
          const avg = isCount ? undefined : value?.avgPrice;
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              <span
                className={cnBar(
                  palette[index % palette.length],
                  "size-2.5 rounded-full",
                )}
              />
              <span className="flex-1 capitalize">{key}</span>
              <span className="text-muted-foreground tabular">{count}</span>
              {avg !== undefined && (
                <span className="text-muted-foreground w-20 text-right text-xs tabular">
                  {formatCurrency(avg, currency, true)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function cnBar(...classes: string[]) {
  return classes.join(" ");
}

function BuyerDashboard({ data }: { data: BuyerDashboard }) {
  const favorites = useQuery("get|/favorites|dashboard", () =>
    favoriteApi.list(),
  );

  const summary = data.summary;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Shortlisted"
          value={formatNumber(summary.favorites)}
          icon={HeartIcon}
          hint="Listings you saved"
          to="/saved"
        />
        <StatTile
          label="Saved searches"
          value={formatNumber(summary.savedSearches)}
          icon={ListChecksIcon}
          hint="With alert frequency set"
          to="/saved-searches"
        />
        <StatTile
          label="Enquiries sent"
          value={formatNumber(summary.inquiriesSent)}
          icon={InboxIcon}
        />
        <StatTile
          label="Messages"
          value={formatNumber(summary.conversations)}
          icon={MessageSquareIcon}
          to="/messages"
        />
      </div>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Shortlist value"
          title="What you are watching is worth"
          description="Grouped by purpose so rent and buy never get mixed up."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(data.favoriteSummary ?? {}).map(
            ([purpose, stats]) => (
              <Card key={purpose} className="gap-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-medium capitalize">
                    For {purpose}
                  </p>
                  <Badge variant="muted">
                    {pluralise(stats.count, "home")}
                  </Badge>
                </div>
                <p className="font-display text-3xl leading-none font-medium tabular">
                  {formatCurrency(stats.totalValue, undefined, true)}
                </p>
                <dl className="grid grid-cols-3 gap-3 border-t pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Average</dt>
                    <dd className="font-medium tabular">
                      {formatCurrency(stats.avgPrice, undefined, true)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Lowest</dt>
                    <dd className="font-medium tabular">
                      {formatCurrency(stats.minPrice, undefined, true)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Highest</dt>
                    <dd className="font-medium tabular">
                      {formatCurrency(stats.maxPrice, undefined, true)}
                    </dd>
                  </div>
                </dl>
              </Card>
            ),
          )}
        </div>
        {Object.keys(data.favoriteSummary ?? {}).length === 0 && (
          <EmptyState
            icon={HeartIcon}
            title="Your shortlist is empty"
            description="Tap the heart on any listing and it will show up here with its value."
            action={
              <Button asChild>
                <Link to="/search">Start searching</Link>
              </Button>
            }
          />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-medium">
              Recently shortlisted
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/saved">
                View all
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          {favorites.isLoading ? (
            <LoadingBlock />
          ) : (favorites.data?.favorites ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing saved yet.</p>
          ) : (
            <ul className="space-y-2">
              {(favorites.data?.favorites ?? []).slice(0, 4).map((favorite) => {
                const property =
                  typeof favorite.propertyId === "string"
                    ? undefined
                    : favorite.propertyId;
                if (!property) return null;
                return (
                  <li key={favorite._id}>
                    <PropertyRow
                      property={property}
                      onFavoriteClick={() => undefined}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-4 p-5">
          <h3 className="font-display text-lg font-medium">Recent enquiries</h3>
          {(data.recentInquiries ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You have not sent any enquiries yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.recentInquiries.map((inquiry) => (
                <li
                  key={inquiry._id}
                  className="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {inquiry.message}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelative(inquiry.createdAt)}
                    </p>
                  </div>
                  <Badge variant="muted" className="capitalize shrink-0">
                    {inquiry.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function ListerDashboard({
  data,
  isLandlord,
}: {
  data: AgentDashboard;
  isLandlord: boolean;
}) {
  const summary = data.summary;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={isLandlord ? "Properties" : "Listings"}
          value={formatNumber(summary.totalListings)}
          icon={Building2Icon}
          hint={`${summary.activeListings} active`}
          to="/listings"
        />
        <StatTile
          label="Portfolio value"
          value={formatCurrency(summary.portfolioValue, undefined, true)}
          icon={WalletIcon}
          hint={`${formatCurrency(summary.livePortfolioValue, undefined, true)} still live`}
        />
        <StatTile
          label="Open enquiries"
          value={formatNumber(summary.newInquiries)}
          icon={InboxIcon}
          hint={`${summary.totalInquiries} total`}
          to="/inquiries"
        />
        <StatTile
          label="Media assets"
          value={formatNumber(summary.mediaAssets)}
          icon={BedDoubleIcon}
          hint="Across all listings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="gap-4 p-5">
          <h3 className="font-display text-lg font-medium">By status</h3>
          <Distribution data={data.listingsByStatus ?? {}} />
        </Card>
        <Card className="gap-4 p-5">
          <h3 className="font-display text-lg font-medium">By purpose</h3>
          <Distribution data={data.listingsByPurpose ?? {}} />
        </Card>
        <Card className="gap-4 p-5">
          <h3 className="font-display text-lg font-medium">Lead pipeline</h3>
          <Distribution data={data.inquiriesByStatus ?? {}} />
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-medium">
              Recent listings
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/listings">
                Manage
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          {(data.recentListings ?? []).length === 0 ? (
            <EmptyState
              icon={Building2Icon}
              title="No listings yet"
              description="Publish your first property and it will appear in your pipeline."
              action={
                <Button size="sm" asChild>
                  <Link to="/listings/new">Create listing</Link>
                </Button>
              }
              className="border-0 py-8"
            />
          ) : (
            <ul className="space-y-2">
              {data.recentListings.map((property) => (
                <li key={property._id}>
                  <PropertyRow
                    property={property}
                    onFavoriteClick={() => undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg flex items-center gap-2 font-medium">
              <TrendingUpIcon className="text-primary size-4" />
              Recent price changes
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inquiries">Enquiries</Link>
            </Button>
          </div>
          {(data.recentPriceChanges ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No price changes recorded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentPriceChanges.map((change) => (
                <li
                  key={change._id}
                  className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium tabular">
                      {formatCurrency(change.oldPrice, undefined, true)} →{" "}
                      {formatCurrency(change.newPrice, undefined, true)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelative(change.changedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      change.newPrice < change.oldPrice ? "success" : "warning"
                    }
                  >
                    {change.newPrice < change.oldPrice ? "Drop" : "Rise"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isLister =
    user?.role === "agent" ||
    user?.role === "landlord" ||
    user?.role === "admin";

  const { data, isLoading, error, refetch } = useQuery(
    "get|/dashboard",
    () => dashboardApi.generic(),
    { enabled: Boolean(user) },
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-xs font-medium tracking-[0.16em] uppercase">
            {user ? ROLE_LABELS[user.role] : ""} dashboard
          </p>
          <h1 className="font-display mt-1.5 text-3xl leading-none font-medium tracking-tight">
            {isLister
              ? "Your portfolio at a glance"
              : "Pick up where you left off"}
          </h1>
        </div>
        <div className="flex gap-2">
          {isLister && (
            <Button asChild>
              <Link to="/listings/new">New listing</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/search">Browse listings</Link>
          </Button>
        </div>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {/* "portfolioValue" in data   && "favoriteSummary" in data*/}
      {!isLoading && !error && data && (
        <ListerDashboard
          data={data as AgentDashboard}
          isLandlord={user?.role === "landlord"}
        />
      )}
      {!isLoading && !error && data && (
        <BuyerDashboard data={data as BuyerDashboard} />
      )}
    </div>
  );
}
