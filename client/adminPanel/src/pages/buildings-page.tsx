import {
  BuildingIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { ConfirmDialog, Pagination } from "@/features/shared/widgets";
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
import { buildingApi } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { pickList, pickPagination } from "@/lib/safe";
import type { Building, Review } from "@/lib/types";

type ListResponse = {
  buildings: Building[];
  page: number;
  pages: number;
  total: number;
};

export default function BuildingsPage() {
  const [page, setPage] = React.useState(1);
  const [name, setName] = React.useState("");
  const [developer, setDeveloper] = React.useState("");
  const [editing, setEditing] = React.useState<Building | "new" | null>(null);
  const [reviewsFor, setReviewsFor] = React.useState<Building | null>(null);

  const params = {
    page,
    limit: 20,
    name: name || undefined,
    developer: developer || undefined,
  };
  const { data, error, isLoading, refetch } = useQuery<ListResponse>(
    `get|/buildings|${JSON.stringify(params)}`,
    () => buildingApi.list(params),
  );

  const invalidate = () => {
    apiCache.invalidate("get|/buildings");
    void refetch();
  };

  const remove = useMutation({
    mutationFn: (id: string) => buildingApi.remove(id),
    successMessage: "Building deleted",
    invalidate,
  });

  const buildings = pickList<Building>(data, "buildings");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildings"
        description="Residential and commercial projects that carry the review corpus."
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon className="size-4" />
            New building
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
            value={developer}
            onChange={(event) => {
              setDeveloper(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by developer"
            className="sm:w-64"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <LoadingBlock />
        ) : buildings.length === 0 ? (
          <EmptyState
            icon={BuildingIcon}
            title="No buildings on record"
            description="Add projects so listings can be attached and reviewed."
            action={
              <Button onClick={() => setEditing("new")}>
                <PlusIcon className="size-4" />
                Create a building
              </Button>
            }
          />
        ) : (
          <ul className="divide-border divide-y">
            {buildings.map((building) => (
              <li
                key={building._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <BuildingIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{building.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {building.developer ?? "Unknown developer"}
                    {building.yearBuilt ? ` · ${building.yearBuilt}` : ""}
                    {building.amenities?.length
                      ? ` · ${building.amenities.length} amenities`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewsFor(building)}
                  >
                    <StarIcon className="size-4" />
                    Reviews
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(building)}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </Button>
                  <ConfirmDialog
                    title={`Delete ${building.name}?`}
                    description="Deletion is blocked with 409 while any property still references this building."
                    confirmLabel="Delete"
                    onConfirm={() => remove.mutate(building._id)}
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

      <BuildingDialog
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={invalidate}
      />
      <ReviewsDialog
        building={reviewsFor}
        onClose={() => setReviewsFor(null)}
      />
    </div>
  );
}

function BuildingDialog({
  state,
  onClose,
  onSaved,
}: {
  state: Building | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = state === "new";
  const building = state && state !== "new" ? state : null;

  const [draft, setDraft] = React.useState(() => ({
    name: building?.name ?? "",
    developer: building?.developer ?? "",
    yearBuilt: building?.yearBuilt ? String(building.yearBuilt) : "",
    amenities: (building?.amenities ?? []).join(", "),
  }));

  const save = useMutation({
    mutationFn: (payload: Partial<Building>) =>
      building
        ? buildingApi.update(building._id, payload)
        : buildingApi.create(payload),
    successMessage: building ? "Building updated" : "Building created",
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        key={building?._id ?? (isNew ? "new" : "none")}
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create building" : `Edit ${building?.name}`}
          </DialogTitle>
          <DialogDescription>
            Amenities are stored as a comma-separated list.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((p) => ({ ...p, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Developer</Label>
            <Input
              value={draft.developer}
              onChange={(event) =>
                setDraft((p) => ({ ...p, developer: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Year built</Label>
            <Input
              inputMode="numeric"
              value={draft.yearBuilt}
              onChange={(event) =>
                setDraft((p) => ({ ...p, yearBuilt: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Amenities</Label>
            <Input
              value={draft.amenities}
              onChange={(event) =>
                setDraft((p) => ({ ...p, amenities: event.target.value }))
              }
              placeholder="gym, pool, parking"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() =>
              void save.mutateAsync({
                name: draft.name,
                developer: draft.developer || undefined,
                yearBuilt: draft.yearBuilt
                  ? Number(draft.yearBuilt)
                  : undefined,
                amenities: draft.amenities
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          >
            {isNew ? "Create building" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewsDialog({
  building,
  onClose,
}: {
  building: Building | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<{
    reviews: Review[];
    avgRating: number;
    distribution: Record<string, number>;
    total: number;
  }>(
    building ? `get|/buildings/${building._id}/reviews|` : null,
    () => buildingApi.reviews(building?._id ?? ""),
    { enabled: Boolean(building) },
  );

  return (
    <Dialog
      open={Boolean(building)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{building?.name} reviews</DialogTitle>
          <DialogDescription>
            Ratings from 1 to 5, unique per user and building.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingBlock className="py-10" />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-semibold tabular-nums">
                  {(data?.avgRating ?? 0).toFixed(1)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {data?.total ?? 0} reviews
                </p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-8">{star}★</span>
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-warning h-full rounded-full"
                        style={{
                          width: `${
                            ((data?.distribution?.[String(star)] ?? 0) /
                              Math.max(data?.total ?? 1, 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right tabular-nums">
                      {data?.distribution?.[String(star)] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {(data?.reviews ?? []).map((review) => (
                <li key={review._id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-warning">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <StarIcon key={index} className="size-3 fill-current" />
                      ))}
                    </div>
                    <Badge variant="secondary">{review.targetType}</Badge>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {formatShortDate(review.createdAt)}
                    </span>
                  </div>
                  {review.body && (
                    <p className="mt-1.5 text-sm">{review.body}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
