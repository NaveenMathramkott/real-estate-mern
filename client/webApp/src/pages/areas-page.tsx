import { ArrowRightIcon, CompassIcon, MapIcon } from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionHeading,
} from "@/components/common";
import { PropertyMap } from "@/components/property/property-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/common";
import { useQuery } from "@/hooks/use-query";
import { areaApi } from "@/lib/api";
import { DEFAULT_CENTER } from "@/lib/constants";
import { formatCurrency, pluralise } from "@/lib/format";
import type { AreaInsights as Insights } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AreasPage() {
  const [term, setTerm] = React.useState("");
  const [city, setCity] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/areas|name=${term}|city=${city}|page=${page}`,
    () =>
      areaApi.list({
        name: term || undefined,
        city: city || undefined,
        page,
        limit: 12,
      }),
  );

  const areas = data?.areas ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Neighbourhoods"
        title="Know the area before the address"
        description="Each area carries live market insight built from every active listing that intersects its boundary."
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <Input
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name"
          className="max-w-xs"
        />
        <Input
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by city"
          className="max-w-xs"
        />
      </div>

      <div className="mt-8">
        {isLoading && <LoadingBlock />}
        {error && <ErrorState message={error} onRetry={() => void refetch()} />}

        {!isLoading && !error && areas.length === 0 && (
          <EmptyState
            icon={CompassIcon}
            title="No areas match"
            description="Try a different city or clear the name filter."
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <AreaTile key={area._id} area={area} />
          ))}
        </div>

        {(data?.pages ?? 1) > 1 && (
          <Pagination
            className="mt-8"
            page={page}
            pages={data!.pages}
            onPage={setPage}
          />
        )}
      </div>
    </div>
  );
}

function AreaTile({
  area,
}: {
  area: { _id: string; name: string; city: string };
}) {
  const navigate = useNavigate();
  const { data: insights, isLoading } = useQuery(
    `get|/areas/${area._id}/insights|page=tile`,
    () => areaApi.insights(area._id),
  );

  return (
    <button
      type="button"
      onClick={() => navigate(`/areas/${area._id}`)}
      className="group bg-card lift-hover cursor-pointer rounded-xl border p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display truncate text-lg font-medium">
            {area.name}
          </p>
          <p className="text-muted-foreground text-xs">{area.city}</p>
        </div>
        <ArrowRightIcon className="text-primary size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>

      {isLoading ? (
        <div className="mt-4 h-12 animate-pulse rounded-lg bg-muted" />
      ) : insights ? (
        <>
          <p className="font-display mt-4 text-2xl leading-none font-medium tabular">
            {formatCurrency(insights.priceStats.avgPrice, undefined, true)}
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
              avg
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="muted">
              {pluralise(insights.total, "listing")}
            </Badge>
            {insights.rating.count > 0 && (
              <Badge variant="gold">
                ★ {insights.rating.average.toFixed(1)}
              </Badge>
            )}
          </div>
        </>
      ) : null}
    </button>
  );
}

function InsightStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="gap-1 p-5">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
        {label}
      </p>
      <p className="font-display text-2xl leading-none font-medium tabular">
        {value}
      </p>
    </Card>
  );
}

function MixBar({
  data,
  formatValue,
}: {
  data: Record<string, number>;
  formatValue?: (key: string, count: number) => React.ReactNode;
}) {
  const entries = Object.entries(data).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return null;

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
        {entries.map(([key, count], index) => (
          <span
            key={key}
            className={cn(palette[index % palette.length])}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, count], index) => (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                palette[index % palette.length],
                "size-2.5 shrink-0 rounded-full",
              )}
            />
            <span className="flex-1 capitalize">{key}</span>
            <span className="text-muted-foreground tabular">
              {formatValue ? formatValue(key, count) : count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AreaDetailPage() {
  const { id = "" } = useParams();

  const { data, isLoading, error, refetch } = useQuery(
    id ? `get|/areas/${id}` : null,
    () => areaApi.detail(id),
    { enabled: Boolean(id) },
  );
  const { data: insights } = useQuery(
    id ? `get|/areas/${id}/insights` : null,
    () => areaApi.insights(id),
    { enabled: Boolean(id) },
  );

  const area = data?.area;
  const stats = (insights as Insights | undefined)?.priceStats;

  // Centroid of the boundary is a good enough centre for the overview map.
  const ring = area?.boundary?.coordinates?.[0];
  const centre: [number, number] = ring?.[0]
    ? [ring[0][1], ring[0][0]]
    : DEFAULT_CENTER;

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!area) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={CompassIcon}
          title="Area not found"
          action={
            <Button asChild>
              <Link to="/areas">All neighbourhoods</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Neighbourhoods", to: "/areas" },
          { label: area.name },
        ]}
      />

      <header className="mt-4 space-y-3">
        <h1 className="font-display text-4xl leading-none font-medium tracking-tight">
          {area.name}
        </h1>
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <MapIcon className="size-4" />
          {area.city}
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightStat
          label="Listings here"
          value={formatNumber(insights?.total ?? 0)}
        />
        <InsightStat
          label="Average price"
          value={formatCurrency(stats?.avgPrice, undefined, true)}
        />
        <InsightStat
          label="Median price"
          value={formatCurrency(stats?.medianPrice, undefined, true)}
        />
        <InsightStat
          label="Resident rating"
          value={
            insights?.rating.count
              ? `${insights.rating.average.toFixed(1)} / 5`
              : "—"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-4 p-6">
          <h2 className="font-display text-lg font-medium">Rent vs sale</h2>
          <MixBar
            data={Object.fromEntries(
              Object.entries(insights?.byPurpose ?? {}).map(([key, value]) => [
                key,
                value?.count ?? 0,
              ]),
            )}
            formatValue={(key, count) => {
              const avg = insights?.byPurpose[key]?.avgPrice;
              return (
                <span className="flex items-center gap-2">
                  <span>{count}</span>
                  {avg !== undefined && (
                    <span className="text-muted-foreground text-xs">
                      {formatCurrency(avg, undefined, true)}
                    </span>
                  )}
                </span>
              );
            }}
          />
        </Card>

        <Card className="gap-4 p-6">
          <h2 className="font-display text-lg font-medium">Property mix</h2>
          <MixBar data={insights?.byType ?? {}} />
        </Card>

        <Card className="gap-4 p-6">
          <h2 className="font-display text-lg font-medium">Bedrooms</h2>
          <MixBar data={insights?.byBeds ?? {}} />
        </Card>

        <Card className="gap-4 p-6">
          <h2 className="font-display text-lg font-medium">Price range</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground text-xs">Lowest</dt>
              <dd className="font-display text-xl font-medium tabular">
                {formatCurrency(stats?.minPrice, undefined, true)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Highest</dt>
              <dd className="font-display text-xl font-medium tabular">
                {formatCurrency(stats?.maxPrice, undefined, true)}
              </dd>
            </div>
          </dl>
          <Button asChild variant="outline" className="mt-2 w-fit">
            <Link to={`/search?q=${encodeURIComponent(area.name)}`}>
              Search this area
              <ArrowRightIcon />
            </Link>
          </Button>
        </Card>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-medium">Where it is</h2>
        <PropertyMap
          properties={[]}
          center={centre}
          className="h-96 overflow-hidden rounded-2xl border"
        />
      </section>

      <p className="text-muted-foreground mt-6 text-xs">
        Insights are cached for ten minutes and recomputed whenever the area
        boundary changes.
      </p>
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}
