import {
  CarIcon,
  MapIcon,
  PlayIcon,
  RadarIcon,
  SearchIcon,
  ShapesIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { EmptyState, PageHeader, Panel, Tag } from "@/components/common";
import { StatusBadge } from "@/features/shared/status-badge";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { searchApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Property, Suggestion } from "@/lib/types";

const CONNAUGHT_RING: [number, number][] = [
  [77.19, 28.6],
  [77.23, 28.6],
  [77.23, 28.63],
  [77.19, 28.6],
];

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [autoSearch, setAutoSearch] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (autoSearch) setDebounced(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, autoSearch]);

  const suggestions = useQuery<{ suggestions: Suggestion[] }>(
    debounced.length >= 2 ? `get|/search/suggest|q=${debounced}` : null,
    () => searchApi.suggest(debounced),
    { enabled: debounced.length >= 2 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search lab"
        description="Exercise the geospatial endpoints directly — suggestions, draw-area and commute searches."
      />

      <Tabs defaultValue="suggest">
        <TabsList>
          <TabsTrigger value="suggest">
            <SearchIcon className="size-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="polygon">
            <ShapesIcon className="size-4" />
            Draw area
          </TabsTrigger>
          <TabsTrigger value="commute">
            <CarIcon className="size-4" />
            Commute
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggest">
          <Panel>
            <div className="space-y-4 p-5">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && query.trim()) {
                      setAutoSearch(false);
                      setDebounced(query.trim());
                    }
                  }}
                  placeholder="Type an area, city or listing title…"
                />
                <Button
                  onClick={() => {
                    setAutoSearch(false);
                    setDebounced(query.trim());
                  }}
                >
                  Search
                </Button>
              </div>

              {suggestions.isLoading ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Searching…
                </p>
              ) : (suggestions.data?.suggestions?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={RadarIcon}
                  title="No suggestions"
                  description={
                    debounced
                      ? `Nothing matched “${debounced}”.`
                      : "Autocomplete covers area names, cities, listing titles and addresses."
                  }
                />
              ) : (
                <ul className="divide-border divide-y">
                  {suggestions.data?.suggestions.map((item, index) => (
                    <li
                      key={`${item.type}-${index}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <Badge variant="secondary" className="capitalize">
                        {item.type}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.label}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.address ??
                            item.coordinates?.join(", ") ??
                            "No address"}
                        </p>
                      </div>
                      {item.price !== undefined && (
                        <span className="font-medium tabular-nums">
                          {formatCurrency(item.price, item.currency, true)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="polygon">
          <PolygonLab />
        </TabsContent>

        <TabsContent value="commute">
          <CommuteLab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PolygonLab() {
  const [raw, setRaw] = React.useState(JSON.stringify(CONNAUGHT_RING));
  const [error, setError] = React.useState<string>();
  const [result, setResult] = React.useState<{
    total: number;
    stats: { avgPrice: number; minPrice: number; maxPrice: number };
    properties: Property[];
  } | null>(null);

  const run = useMutation({
    mutationFn: (coordinates: [number, number][]) =>
      searchApi.polygon(coordinates),
    successMessage: "Polygon search complete",
    onSuccess: (data) => {
      setResult(data);
      setError(undefined);
    },
    onError: (err) => setError(err.message),
  });

  const submit = () => {
    try {
      const parsed = JSON.parse(raw) as [number, number][];
      if (!Array.isArray(parsed) || parsed.length < 4) {
        throw new Error("A ring needs at least 4 points when closed");
      }
      const first = parsed[0];
      const last = parsed[parsed.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        throw new Error(
          "Ring must be closed — repeat the first point as the last",
        );
      }
      void run.mutateAsync(parsed);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Invalid coordinates");
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <div className="space-y-4 p-5">
          <Alert variant="warning">
            GeoJSON coordinates are ordered{" "}
            <strong className="font-mono">[longitude, latitude]</strong> and the
            ring must be closed, otherwise MongoDB rejects the query with 400.
          </Alert>
          <div className="space-y-1.5">
            <Label>Polygon coordinates</Label>
            <textarea
              rows={5}
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Button onClick={submit} disabled={run.isPending}>
            {run.isPending ? (
              <RadarIcon className="size-4 animate-pulse" />
            ) : (
              <PlayIcon className="size-4" />
            )}
            Run draw-area search
          </Button>
        </div>
      </Panel>

      {result && <PolygonResult result={result} />}
    </div>
  );
}

function PolygonResult({
  result,
}: {
  result: {
    total: number;
    stats: { avgPrice: number; minPrice: number; maxPrice: number };
    properties: Property[];
  };
}) {
  return (
    <Panel
      title={`${formatNumber(result.total)} listing${result.total === 1 ? "" : "s"} inside the polygon`}
      description="Cached for 2 minutes server-side"
    >
      <div className="grid gap-3 border-b px-5 py-4 sm:grid-cols-3">
        {[
          {
            label: "Average price",
            value: formatCurrency(result.stats.avgPrice, "INR", true),
          },
          {
            label: "Minimum",
            value: formatCurrency(result.stats.minPrice, "INR", true),
          },
          {
            label: "Maximum",
            value: formatCurrency(result.stats.maxPrice, "INR", true),
          },
        ].map((item) => (
          <div key={item.label} className="bg-muted/50 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <ResultList properties={result.properties} />
    </Panel>
  );
}

function CommuteLab() {
  const [form, setForm] = React.useState({
    lat: "28.6139",
    lng: "77.209",
    minutes: "20",
    speedKph: "30",
  });
  const [error, setError] = React.useState<string>();
  const [result, setResult] = React.useState<{
    origin: { lat: number; lng: number };
    minutes: number;
    radiusMetres: number;
    total: number;
    properties: Property[];
  } | null>(null);

  const run = useMutation({
    mutationFn: () =>
      searchApi.commute({
        lat: Number(form.lat),
        lng: Number(form.lng),
        minutes: Number(form.minutes),
        speedKph: Number(form.speedKph) || undefined,
      }),
    successMessage: "Commute search complete",
    onSuccess: (data) => {
      setResult(data);
      setError(undefined);
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="space-y-4">
      <Panel>
        <div className="space-y-4 p-5">
          <Alert>
            Radius is derived as{" "}
            <strong className="font-mono">
              (minutes / 60) × speedKph × 1000
            </strong>
            . Results are cached for 5 minutes.
          </Alert>
          <div className="grid gap-4 sm:grid-cols-4">
            {(
              [
                { key: "lat", label: "Latitude" },
                { key: "lng", label: "Longitude" },
                { key: "minutes", label: "Minutes" },
                { key: "speedKph", label: "Speed (kph)" },
              ] as const
            ).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label>{field.label}</Label>
                <Input
                  inputMode="decimal"
                  value={form[field.key]}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Button
            onClick={() => void run.mutateAsync()}
            disabled={run.isPending}
          >
            <CarIcon className="size-4" />
            Find homes within reach
          </Button>
        </div>
      </Panel>

      {result && (
        <Panel
          title={`${formatNumber(result.total)} listing${result.total === 1 ? "" : "s"} within ${(result.radiusMetres / 1000).toFixed(1)} km`}
          description={`Derived radius for ${result.minutes} minutes from ${result.origin.lat}, ${result.origin.lng}`}
        >
          <ResultList properties={result.properties} />
        </Panel>
      )}
    </div>
  );
}

function ResultList({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="No listings in this area"
        description="Widen the polygon or relax the time budget."
      />
    );
  }
  return (
    <ul className="divide-border divide-y">
      {properties.map((property) => (
        <li key={property._id}>
          <Link
            to={`/properties/${property._id}`}
            className="hover:bg-accent/40 flex items-center gap-3 px-5 py-3 transition-colors"
          >
            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <MapIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{property.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {property.address ?? "No address"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag>{property.type}</Tag>
              <StatusBadge value={property.status} />
            </div>
            <span className="w-24 text-right font-medium tabular-nums">
              {formatCurrency(property.price, property.currency, true)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
