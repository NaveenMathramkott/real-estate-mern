import {
  ChartNoAxesColumnIcon,
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
import { apiCache } from "@/lib/api-client";
import { areaApi } from "@/lib/api";
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
    apiCache.invalidate("get|/areas");
    void refetch();
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
        ) : isLoading ? (
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

      <AreaDialog
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={invalidate}
      />
      <InsightsDialog area={insightsFor} onClose={() => setInsightsFor(null)} />
    </div>
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
  const [raw, setRaw] = React.useState(() =>
    area?.boundary ? JSON.stringify(area.boundary, null, 2) : "",
  );
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

  const parseBoundary = (): Area["boundary"] | undefined => {
    if (!raw.trim()) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Boundary must be valid JSON");
    }
    const boundary = parsed as Area["boundary"];
    if (boundary?.type !== "Polygon" || !Array.isArray(boundary.coordinates)) {
      throw new Error("Boundary must be a GeoJSON Polygon");
    }
    const ring = boundary.coordinates[0] ?? [];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (
      ring.length < 4 ||
      first?.[0] !== last?.[0] ||
      first?.[1] !== last?.[1]
    ) {
      throw new Error(
        "Polygon ring must be closed (repeat the first point last)",
      );
    }
    return boundary;
  };

  const handleSubmit = async () => {
    try {
      const boundary = parseBoundary();
      await save.mutateAsync({ name, city, boundary });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the area");
    }
  };

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        key={area?._id ?? (isNew ? "new" : "none")}
        className="sm:max-w-xl"
      >
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
          <div className="space-y-1.5">
            <Label>Boundary polygon (GeoJSON)</Label>
            <textarea
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              rows={7}
              placeholder='{ "type": "Polygon", "coordinates": [[[77.19,28.60],[77.23,28.60],[77.23,28.63],[77.19,28.63],[77.19,28.60]]] }'
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </div>
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
