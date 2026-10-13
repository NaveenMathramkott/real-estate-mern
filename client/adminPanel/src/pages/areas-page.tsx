import {
  ChartNoAxesColumnIcon,
  InfoIcon,
  MapIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TrendingUpIcon,
} from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { ConfirmDialog, CountBar, Pagination } from "@/features/shared/widgets";
import { LocationField } from "@/features/shared/location-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { formKey } from "@/lib/utils";
import { areaApi } from "@/lib/api";
import { closeRing, isValidRing, pointToRing, type Ring } from "@/lib/geo";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Area, AreaInsights } from "@/lib/types";
import {
  countEntries,
  pick,
  pickList,
  pickNumber,
  pickPagination,
} from "@/lib/safe";

type ListResponse = {
  areas: Area[];
  page: number;
  pages: number;
  total: number;
};

const CLOSED_RING_HINT =
  "Boundary is a GeoJSON Polygon. The ring must be closed — first [lng, lat] repeated as the last point.";

export default function AreasPage() {
  const [page, setPage] = React.useState(1);
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [editing, setEditing] = React.useState<Area | "new" | null>(null);
  const [insightsFor, setInsightsFor] = React.useState<Area | null>(null);
  const [detailFor, setDetailFor] = React.useState<Area | null>(null);

  const params = {
    page,
    limit: 20,
    name: name || undefined,
    city: city || undefined,
  };
  const { data, error, isLoading, refetch } = useQuery<ListResponse>(
    `get|/areas|${JSON.stringify(params)}`,
    () => areaApi.list(params),
  );

  const invalidate = () => {
    queryStore.invalidate("get|/areas");
  };

  const remove = useMutation({
    mutationFn: (id: string) => areaApi.remove(id),
    successMessage: "Area deleted",
    invalidate,
  });

  const areas = pickList<Area>(data, "areas");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Areas"
        description="Neighbourhood reference data that powers suggestions, insights and draw-area search."
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon className="size-4" />
            New area
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center">
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by name"
            className="sm:w-64"
          />
          <Input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by city"
            className="sm:w-64"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading && !data ? (
          <LoadingBlock />
        ) : areas.length === 0 ? (
          <EmptyState
            icon={MapIcon}
            title="No areas defined"
            description="Areas carry a GeoJSON boundary polygon used for market insights and search."
            action={
              <Button onClick={() => setEditing("new")}>
                <PlusIcon className="size-4" />
                Create the first area
              </Button>
            }
          />
        ) : (
          <ul className="divide-border divide-y">
            {areas.map((area) => (
              <li
                key={area._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <MapIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{area.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {area.city} ·{" "}
                    {area.boundary ? "Boundary defined" : "No boundary"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailFor(area)}
                  >
                    <InfoIcon className="size-4" />
                    Boundary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInsightsFor(area)}
                  >
                    <TrendingUpIcon className="size-4" />
                    Insights
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(area)}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </Button>
                  <ConfirmDialog
                    title={`Delete ${area.name}?`}
                    description="Deletion is blocked with 409 while any review still references this area."
                    confirmLabel="Delete"
                    onConfirm={() => remove.mutate(area._id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={remove.isPending}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination {...pickPagination(data)} onChange={setPage} />
      </Panel>

      {/* Keyed on the selected record so the form remounts with its values. */}
      <AreaDialog
        key={formKey(editing)}
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={invalidate}
      />
      <InsightsDialog area={insightsFor} onClose={() => setInsightsFor(null)} />
      <AreaDetailDialog
        area={detailFor}
        onClose={() => setDetailFor(null)}
        onEdit={(area) => {
          setDetailFor(null);
          setEditing(area);
        }}
      />
    </div>
  );
}

function AreaDetailDialog({
  area,
  onClose,
  onEdit,
}: {
  area: Area | null;
  onClose: () => void;
  onEdit: (area: Area) => void;
}) {
  const { data, isLoading, error } = useQuery<{ area: Area }>(
    area ? `get|/areas/${area._id}|` : null,
    () => areaApi.detail(area?._id ?? ""),
    { enabled: Boolean(area) },
  );

  const detail = pick<Area>(data, "area") ?? area;
  const ring = detail?.boundary?.coordinates?.[0] ?? [];
  const points = ring.filter(
    (point) => Array.isArray(point) && point.length >= 2,
  );
  const bounds = points.length
    ? {
        minLng: Math.min(...points.map((p) => p[0])),
        maxLng: Math.max(...points.map((p) => p[0])),
        minLat: Math.min(...points.map((p) => p[1])),
        maxLat: Math.max(...points.map((p) => p[1])),
      }
    : null;
  const centroid = bounds
    ? {
        lng: ((bounds.minLng + bounds.maxLng) / 2).toFixed(4),
        lat: ((bounds.minLat + bounds.maxLat) / 2).toFixed(4),
      }
    : null;

  return (
    <Dialog open={Boolean(area)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? area?.name}</DialogTitle>
          <DialogDescription>
            Area detail including its boundary polygon, as stored on the server.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingBlock className="py-10" />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">City</p>
                <p className="text-sm font-medium">{detail?.city ?? "—"}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Area id
                </p>
                <p className="font-mono text-xs">{detail?._id}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Ring points
                </p>
                <p className="text-sm font-medium">{points.length}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Centroid (lng, lat)
                </p>
                <p className="text-sm font-medium tabular-nums">
                  {centroid ? `${centroid.lng}, ${centroid.lat}` : "—"}
                </p>
              </div>
            </div>

            {bounds && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Bounding box
                </p>
                <p className="font-mono text-xs">
                  lng {bounds.minLng.toFixed(4)} → {bounds.maxLng.toFixed(4)} ·
                  lat {bounds.minLat.toFixed(4)} → {bounds.maxLat.toFixed(4)}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase">
                Boundary (GeoJSON)
              </p>
              {detail?.boundary ? (
                <pre className="bg-muted/50 max-h-56 overflow-auto rounded-lg border p-3 font-mono text-xs">
                  {JSON.stringify(detail.boundary, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No boundary stored — insights and draw-area search need one.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {area && (
            <Button onClick={() => onEdit(area)}>
              <PencilIcon className="size-4" />
              Edit area
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AreaDialog({
  state,
  onClose,
  onSaved,
}: {
  state: Area | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = state === "new";
  const area = state && state !== "new" ? state : null;

  const [name, setName] = React.useState(() => area?.name ?? "");
  const [city, setCity] = React.useState(() => area?.city ?? "");
  const [ring, setRing] = React.useState<Ring>(() => {
    const points = area?.boundary?.coordinates?.[0];
    if (!Array.isArray(points)) return [];
    return points.filter(
      (point): point is [number, number] =>
        Array.isArray(point) && point.length >= 2,
    );
  });
  const [error, setError] = React.useState<string>();

  const save = useMutation({
    mutationFn: (payload: Partial<Area>) =>
      area ? areaApi.update(area._id, payload) : areaApi.create(payload),
    successMessage: area ? "Area updated" : "Area created",
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (ring.length === 0) {
      setError(
        "Boundary is required — click the map to trace it, or paste a Google Maps link to seed the first point.",
      );
      return;
    }
    if (!isValidRing(ring)) {
      setError("A boundary ring needs at least four points");
      return;
    }

    // GeoJSON rings must be closed or MongoDB rejects the document with 400.
    const boundary: Area["boundary"] = {
      type: "Polygon",
      coordinates: [closeRing(ring)],
    };

    try {
      await save.mutateAsync({ name, city, boundary });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the area");
    }
  };

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl h-11/12 overflow-y-scroll scrollbar-track-transparent">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create area" : `Edit ${area?.name}`}
          </DialogTitle>
          <DialogDescription>{CLOSED_RING_HINT}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="border-destructive/40 bg-destructive/8 text-destructive rounded-lg border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
          </div>

          <LocationField
            mode="polygon"
            label="Boundary"
            hint="Click the map to add each vertex, or paste a Google Maps link to seed the first point."
            ring={ring}
            onPointChange={(point) => setRing([pointToRing(point)])}
            onRingChange={setRing}
          />

          {ring.length > 0 && (
            <div className="space-y-1.5">
              <Label>Boundary polygon (GeoJSON)</Label>
              <textarea
                readOnly
                rows={5}
                value={JSON.stringify(
                  { type: "Polygon", coordinates: [closeRing(ring)] },
                  null,
                  2,
                )}
                className="border-input bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 font-mono text-xs shadow-xs outline-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={() => void handleSubmit()}>
            {isNew ? "Create area" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function byPurposeCount(value: unknown) {
  if (typeof value === "number") return value;
  const count = pick<number>(value, "count");
  return typeof count === "number" ? count : 0;
}

function InsightsDialog({
  area,
  onClose,
}: {
  area: Area | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<AreaInsights>(
    area ? `get|/areas/${area?._id}/insights|` : null,
    () => areaApi.insights(area?._id ?? ""),
    { enabled: Boolean(area) },
  );

  return (
    <Dialog open={Boolean(area)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{area?.name} insights</DialogTitle>
          <DialogDescription>
            Aggregated from every active listing intersecting the boundary.
            Cached for 10 minutes.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingBlock className="py-10" />
        ) : error ? (
          <ErrorState message={error} />
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Listings",
                  value: formatNumber(pickNumber(data, "total")),
                },
                {
                  label: "Avg price",
                  value: formatCurrency(
                    pickNumber(data, "priceStats", "avgPrice"),
                    "INR",
                    true,
                  ),
                },
                {
                  label: "Median",
                  value: formatCurrency(
                    pickNumber(data, "priceStats", "medianPrice"),
                    "INR",
                    true,
                  ),
                },
                {
                  label: "Rating",
                  value: `${(pickNumber(data, "rating", "average") ?? 0).toFixed(1)} ★`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-muted/50 rounded-lg border p-3"
                >
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <ChartNoAxesColumnIcon className="size-3.5" />
                  By purpose
                </p>
                <CountBar
                  items={countEntries(pick(data, "byPurpose")).map(
                    ({ label, value }) => ({
                      label,
                      value: byPurposeCount(value),
                    }),
                  )}
                />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  By type
                </p>
                <CountBar items={countEntries(pick(data, "byType"))} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                By bedrooms
              </p>
              <div className="flex flex-wrap gap-2">
                {countEntries(pick(data, "byBeds")).map(
                  ({ label: beds, value: count }) => (
                    <Badge key={beds} variant="secondary">
                      {beds} bed · {count}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
