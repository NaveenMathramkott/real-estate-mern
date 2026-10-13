import {
  ActivityIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  Building2Icon,
  LandmarkIcon,
  MapIcon,
  MessageSquareIcon,
  ShieldAlertIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
  Tag,
} from "@/components/common";
import { StatusBadge } from "@/features/shared/status-badge";
import { CountBar, StatCard } from "@/features/shared/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@/hooks/use-query";
import { dashboardApi } from "@/lib/api";
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatRelative,
  formatShortDate,
  initials,
} from "@/lib/format";
import { pick, pickList } from "@/lib/safe";
import type { AdminDashboard, Agency, Property, User } from "@/lib/types";

/** Dashboard `summary` is a wide object — fill any missing counter with 0. */
function safeSummary(data: unknown): Record<string, number> {
  const raw = pick<Record<string, unknown>>(data, "summary");
  if (!raw) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      typeof value === "number" && Number.isFinite(value) ? value : 0,
    ]),
  ) as Record<string, number>;
}

function countEntries(record?: Record<string, number>) {
  return Object.entries(record ?? {}).map(([label, value]) => ({
    label,
    value,
  }));
}

function ratio(part: unknown, whole: unknown) {
  const numerator = typeof part === "number" ? part : 0;
  const denominator = typeof whole === "number" ? whole : 0;
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function queue<T>(data: unknown, state: string, kind: string): T[] {
  return pickList<T>(data, state, kind, "sample");
}

function countOf(data: unknown, state: string, kind: string) {
  return pick<number>(data, state, kind, "count") ?? 0;
}

const CHART_COLORS = [
  "oklch(0.52 0.19 268)",
  "oklch(0.6 0.13 155)",
  "oklch(0.75 0.15 75)",
  "oklch(0.58 0.21 27)",
  "oklch(0.65 0.15 300)",
  "oklch(0.6 0.12 200)",
];

export default function DashboardPage() {
  const { data, error, isLoading, refetch, invalidate } =
    useQuery<AdminDashboard>("get|/dashboard/admin|", dashboardApi.admin);

  if (isLoading && !data) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const summary = safeSummary(data);
  const recentUsers = pickList<User>(data, "recentUsers");
  const recentProperties = pickList<Property>(data, "recentProperties");

  const userRoleData = countEntries(
    pick<Record<string, number>>(summary, "usersByRole"),
  );
  const propertyStatusData = countEntries(
    pick<Record<string, number>>(summary, "propertiesByStatus"),
  );
  const inquiryStatusData = countEntries(
    pick<Record<string, number>>(summary, "inquiriesByStatus"),
  );

  const verificationRate = ratio(summary.verifiedUsers, summary.totalUsers);
  const propertyVerificationRate = ratio(
    summary.verifiedProperties,
    summary.totalProperties,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Live totals, verification queues and market activity across Tenementary."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => invalidate()}
              disabled={isLoading}
            >
              <ActivityIcon className="size-4" />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/users">
                <ShieldAlertIcon className="size-4" />
                Review queue
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={formatNumber(summary.totalUsers)}
          icon={UsersIcon}
          hint={`${pick<number>(summary, "usersByRole", "admin") ?? 0} admins`}
        />
        <StatCard
          label="Listings"
          value={formatNumber(summary.totalProperties)}
          icon={Building2Icon}
          tone="success"
          hint={`${pick<number>(summary, "propertiesByStatus", "active") ?? 0} active`}
        />
        <StatCard
          label="Closed deal value"
          value={formatCurrency(summary.closedDealValue, "INR", true)}
          icon={TrendingUpIcon}
          tone="warning"
          hint={`${summary.closedDeals} deals closed`}
        />
        <StatCard
          label="Messages"
          value={formatCompact(summary.totalMessages)}
          icon={MessageSquareIcon}
          tone="muted"
          hint={`${formatNumber(summary.totalReviews)} reviews`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="User verification"
          description={`${verificationRate}% of accounts are verified`}
          className="lg:col-span-2"
        >
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <BadgeCheckIcon className="text-success size-4" />
                  Verified
                </span>
                <span className="font-medium tabular-nums">
                  {formatNumber(summary.verifiedUsers)}
                </span>
              </div>
              <Progress
                value={verificationRate}
                indicatorClassName="bg-success"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlertIcon className="text-warning size-4" />
                  Unverified
                </span>
                <span className="font-medium tabular-nums">
                  {formatNumber(summary.unverifiedUsers)}
                </span>
              </div>
              <Progress
                value={100 - verificationRate}
                indicatorClassName="bg-warning"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userRoleData}
                    margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground text-xs"
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {userRoleData.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyStatusData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="52%"
                      outerRadius="80%"
                      paddingAngle={3}
                    >
                      {propertyStatusData.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <CountBar items={propertyStatusData} />
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel title="Reference data">
            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                {
                  label: "Areas",
                  value: summary.totalAreas ?? 0,
                  icon: MapIcon,
                  to: "/areas",
                },
                {
                  label: "Buildings",
                  value: summary.totalBuildings ?? 0,
                  icon: Building2Icon,
                  to: "/buildings",
                },
                {
                  label: "Agencies",
                  value: summary.totalAgencies ?? 0,
                  icon: LandmarkIcon,
                  to: "/agencies",
                },
                {
                  label: "Reviews",
                  value: summary.totalReviews ?? 0,
                  icon: StarIcon,
                  to: "/reviews",
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="bg-card hover:bg-accent/50 flex flex-col gap-1 p-4 transition-colors"
                >
                  <item.icon className="text-muted-foreground size-4" />
                  <span className="mt-1 text-xl font-semibold tabular-nums">
                    {formatNumber(item.value)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Inquiry pipeline">
            <div className="p-5">
              <CountBar items={inquiryStatusData} />
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to="/inquiries">
                  Open inbox
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <Tabs defaultValue="unverified">
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="leading-none font-semibold tracking-tight">
                Verification queues
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Approve accounts and listings before they surface to buyers.
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unverified" className="mt-0">
            <div className="grid divide-y lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
              <QueueColumn
                title="Users"
                count={countOf(data, "unverified", "users")}
                empty="No users awaiting review"
                items={queue<User>(data, "unverified", "users").map((user) => ({
                  id: user._id,
                  primary: user.email,
                  secondary: `${user.role} · ${formatRelative(user.createdAt)}`,
                  verified: user.verified,
                }))}
              />
              <QueueColumn
                title="Properties"
                count={countOf(data, "unverified", "properties")}
                empty="No listings awaiting review"
                items={queue<Property>(data, "unverified", "properties").map(
                  (property) => ({
                    id: property._id,
                    primary: property.title,
                    secondary: `${property.purpose} · ${formatCurrency(property.price, property.currency, true)}`,
                    to: `/properties/${property._id}`,
                    verified: Boolean(property.verifiedAt),
                  }),
                )}
              />
              <QueueColumn
                title="Agencies"
                count={countOf(data, "unverified", "agencies")}
                empty="No agencies awaiting review"
                items={queue<Agency>(data, "unverified", "agencies").map(
                  (agency) => ({
                    id: agency._id,
                    primary: agency.name,
                    secondary: agency.licenseNo ?? "No licence number",
                    verified: agency.verified,
                  }),
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="verified" className="mt-0">
            <div className="grid divide-y lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
              <QueueColumn
                title="Users"
                count={countOf(data, "verified", "users")}
                empty="No verified users yet"
                items={queue<User>(data, "verified", "users").map((user) => ({
                  id: user._id,
                  primary: user.email,
                  secondary: `${user.role} · joined ${formatShortDate(user.createdAt)}`,
                  verified: user.verified,
                }))}
              />
              <QueueColumn
                title="Properties"
                count={countOf(data, "verified", "properties")}
                empty="No verified listings yet"
                items={queue<Property>(data, "verified", "properties").map(
                  (property) => ({
                    id: property._id,
                    primary: property.title,
                    secondary: `${property.status} · ${propertyVerificationRate}% of stock`,
                    to: `/properties/${property._id}`,
                    verified: Boolean(property.verifiedAt),
                  }),
                )}
              />
              <QueueColumn
                title="Agencies"
                count={countOf(data, "verified", "agencies")}
                empty="No verified agencies yet"
                items={queue<Agency>(data, "verified", "agencies").map(
                  (agency) => ({
                    id: agency._id,
                    primary: agency.name,
                    secondary: agency.licenseNo ?? "Licence on file",
                    verified: agency.verified,
                  }),
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Recent users"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/users">View all</Link>
            </Button>
          }
        >
          {recentUsers.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No users yet" />
          ) : (
            <ul className="divide-border divide-y">
              {recentUsers.slice(0, 6).map((user) => (
                <li
                  key={user._id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full text-xs font-semibold">
                    {initials(user.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user.email}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.role} · {formatRelative(user.createdAt)}
                    </p>
                  </div>
                  {user.verified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent listings"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/properties">View all</Link>
            </Button>
          }
        >
          {recentProperties.length === 0 ? (
            <EmptyState icon={Building2Icon} title="No listings yet" />
          ) : (
            <ul className="divide-border divide-y">
              {recentProperties.slice(0, 6).map((property) => (
                <li key={property._id}>
                  <Link
                    to={`/properties/${property._id}`}
                    className="hover:bg-accent/40 flex items-center gap-3 px-5 py-3 transition-colors"
                  >
                    <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                      <Building2Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {property.title}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {property.address ?? "No address"} ·{" "}
                        {formatCurrency(
                          property.price,
                          property.currency,
                          true,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {property.type && <Tag>{property.type}</Tag>}
                      <StatusBadge value={property.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function QueueColumn({
  title,
  count,
  empty,
  items,
}: {
  title: string;
  count: number;
  empty: string;
  items: {
    id: string;
    primary: string;
    secondary: string;
    to?: string;
    verified: boolean;
  }[];
}) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Badge variant={count > 0 ? "warning" : "muted"}>{count}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.primary}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {item.secondary}
                  </p>
                </div>
                {item.to ? (
                  <ArrowUpRightIcon className="text-muted-foreground size-3.5 shrink-0" />
                ) : (
                  <Badge variant={item.verified ? "success" : "warning"}>
                    {item.verified ? "Verified" : "Pending"}
                  </Badge>
                )}
              </>
            );
            return (
              <li key={item.id}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="hover:bg-accent/50 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
