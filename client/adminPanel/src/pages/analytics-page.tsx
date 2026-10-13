import {
  BarChart3Icon,
  CircleDollarSignIcon,
  DatabaseIcon,
  LayoutGridIcon,
  StarIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { StatCard } from "@/features/shared/widgets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@/hooks/use-query";
import { dashboardApi, propertyApi } from "@/lib/api";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import type { AdminDashboard } from "@/lib/types";

const COLORS = [
  "oklch(0.52 0.19 268)",
  "oklch(0.6 0.13 155)",
  "oklch(0.75 0.15 75)",
  "oklch(0.58 0.21 27)",
  "oklch(0.65 0.15 300)",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.8rem",
};

export default function AnalyticsPage() {
  const { data, error, isLoading, refetch } = useQuery<AdminDashboard>(
    "get|/dashboard/admin|",
    dashboardApi.admin,
  );

  const recent = useQuery<{
    properties: {
      _id: string;
      price: number;
      currency?: string;
      purpose: string;
    }[];
  }>("get|/properties|", () =>
    propertyApi.search({ limit: 100, purpose: "rent" }),
  );

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { summary } = data;

  const comparison = [
    {
      name: "Users",
      verified: summary.verifiedUsers,
      unverified: summary.unverifiedUsers,
    },
    {
      name: "Properties",
      verified: summary.verifiedProperties,
      unverified: summary.unverifiedProperties,
    },
    {
      name: "Agencies",
      verified: summary.verifiedAgencies,
      unverified: summary.unverifiedAgencies,
    },
  ];

  const priceBuckets = bucketPrices(
    recent.data?.properties.map((p) => p.price ?? 0) ?? [],
  );

  const funnel = [
    { stage: "Listings", value: summary.totalProperties },
    { stage: "Verified", value: summary.verifiedProperties },
    { stage: "Inquiries", value: sum(summary.inquiriesByStatus) },
    { stage: "Closed deals", value: summary.closedDeals },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Cross-section of platform composition, verification coverage and deal value."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Composition index"
          value={formatCompact(summary.totalAreas + summary.totalBuildings)}
          hint="areas + buildings"
          icon={LayoutGridIcon}
        />
        <StatCard
          label="Deal value"
          value={formatCurrency(summary.closedDealValue, "INR", true)}
          hint={`${summary.closedDeals} closed`}
          icon={CircleDollarSignIcon}
          tone="success"
        />
        <StatCard
          label="Review corpus"
          value={formatNumber(summary.totalReviews)}
          hint={`${summary.reviewsByTarget.building ?? 0} building reviews`}
          icon={StarIcon}
          tone="warning"
        />
        <StatCard
          label="Records indexed"
          value={formatCompact(
            summary.totalUsers +
              summary.totalProperties +
              summary.totalAgencies +
              summary.totalMessages,
          )}
          hint="users + listings + agencies + messages"
          icon={DatabaseIcon}
          tone="muted"
        />
      </div>

      <Tabs defaultValue="composition">
        <TabsList>
          <TabsTrigger value="composition">Composition</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="composition" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Users by role">
              <div className="h-72 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(summary.usersByRole).map(
                      ([name, value]) => ({
                        name,
                        value,
                      }),
                    )}
                    margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground text-xs"
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "var(--muted)" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {Object.entries(summary.usersByRole).map(
                        ([name], index) => (
                          <Cell
                            key={name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Reviews by target">
              <div className="h-72 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(summary.reviewsByTarget).map(
                      ([name, value]) => ({
                        name,
                        value,
                      }),
                    )}
                    layout="vertical"
                    margin={{ top: 8, right: 24, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      className="stroke-border"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground text-xs"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      className="text-muted-foreground text-xs"
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "var(--muted)" }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={36}>
                      {Object.entries(summary.reviewsByTarget).map(
                        ([name], index) => (
                          <Cell
                            key={name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title="Listing funnel">
            <div className="h-72 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={funnel}
                  margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="stage"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground text-xs"
                  />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="oklch(0.52 0.19 268)"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Panel
            title="Verified vs unverified"
            description="Coverage across every entity that supports verification"
          >
            <div className="h-80 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparison}
                  margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground text-xs"
                  />
                  <RechartsTooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="verified"
                    fill="oklch(0.6 0.13 155)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="unverified"
                    fill="oklch(0.75 0.15 75)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="pricing">
          <Panel
            title="Rental price distribution"
            description="Sample of up to 100 rental listings from the search endpoint"
            action={<BarChart3Icon className="text-muted-foreground size-4" />}
          >
            <div className="h-80 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priceBuckets}
                  margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
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
                  />
                  <RechartsTooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="oklch(0.52 0.19 268)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function sum(record: Record<string, number>) {
  return Object.values(record).reduce((acc, value) => acc + value, 0);
}

function bucketPrices(prices: number[]) {
  const buckets = [
    { label: "<15k", max: 15000, count: 0 },
    { label: "15–30k", max: 30000, count: 0 },
    { label: "30–50k", max: 50000, count: 0 },
    { label: "50–75k", max: 75000, count: 0 },
    { label: "75–100k", max: 100000, count: 0 },
    { label: "100k+", max: Infinity, count: 0 },
  ];
  for (const price of prices) {
    const bucket = buckets.find((item) => price < item.max);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}
