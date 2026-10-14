import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImagesIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ErrorState, LoadingBlock } from "@/components/common";
import { useResettableState } from "@/hooks/use-resettable-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { propertyApi } from "@/lib/api";
import { MEDIA_TYPES } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

/**
 * Media is attached by URL — the API does not accept multipart uploads yet, so
 * this manager handles ordering and removal and takes a hosted link for adds.
 */
export function MediaManager({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery(
    `get|/properties/${propertyId}/media`,
    () => propertyApi.detail(propertyId),
  );
  const media = React.useMemo(
    () => [...(data?.media ?? [])].sort((a, b) => a.order - b.order),
    [data],
  );

  // The working order mirrors the server order until the visitor reorders it.
  const [order, setOrder] = useResettableState<string[]>(
    () => media.map((item) => item._id),
    media.map((item) => item._id).join(","),
  );
  const [draft, setDraft] = React.useState({ url: "", type: "image" });

  const add = useMutation({
    mutationFn: () =>
      propertyApi.addMedia(propertyId, {
        url: draft.url,
        type: draft.type as (typeof MEDIA_TYPES)[number],
        order: media.length,
      }),
    successMessage: "Media added",
    onSuccess: () => {
      setDraft({ url: "", type: "image" });
      refetch();
    },
  });

  const remove = useMutation({
    mutationFn: (mediaId: string) =>
      propertyApi.removeMedia(propertyId, mediaId),
    onSuccess: () => refetch(),
  });

  const saveOrder = useMutation({
    mutationFn: () => propertyApi.reorderMedia(propertyId, order),
    successMessage: "Order saved",
  });

  const move = (index: number, delta: number) => {
    const next = [...order];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (error)
    return <ErrorState message={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/listings"
            className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-xs transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" />
            Back to listings
          </Link>
          <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
            Media
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The first image is used as the card and gallery cover. Drag order is
            set here and applied in one request.
          </p>
        </div>
        <Button
          disabled={!order.length || saveOrder.isPending}
          onClick={() => saveOrder.mutate()}
        >
          <SaveIcon />
          {saveOrder.isPending ? "Saving…" : "Save order"}
        </Button>
      </header>

      <Card className="gap-4 p-5">
        <h2 className="font-display text-lg font-medium">Add media</h2>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            add.mutate();
          }}
        >
          <div className="min-w-[16rem] flex-1 space-y-2">
            <Label htmlFor="media-url">Hosted URL</Label>
            <Input
              id="media-url"
              required
              type="url"
              value={draft.url}
              onChange={(event) =>
                setDraft((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="https://res.cloudinary.com/…"
            />
          </div>
          <div className="w-40 space-y-2">
            <Label>Type</Label>
            <Select
              value={draft.type}
              onValueChange={(value) =>
                setDraft((c) => ({ ...c, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={add.isPending}>
            <PlusIcon />
            {add.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
        <p className="text-muted-foreground text-xs">
          Uploads accept a hosted URL only — multipart support is not wired up
          server-side yet.
        </p>
      </Card>

      {media.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <ImagesIcon className="text-muted-foreground size-8" />
          <p className="font-medium">No media attached</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Add at least one image so the listing shows a cover.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {order.map((mediaId, index) => {
            const item = media.find((entry) => entry._id === mediaId);
            if (!item) return null;
            return (
              <li
                key={mediaId}
                className="bg-card flex items-center gap-4 rounded-xl border p-3"
              >
                <span className="text-muted-foreground w-6 shrink-0 text-center text-sm tabular">
                  {index + 1}
                </span>
                <img
                  src={item.url}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Badge variant="muted" className="capitalize">
                    {item.type}
                  </Badge>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {item.url}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowLeftIcon className="rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowRightIcon className="rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove"
                    className={cn("text-destructive hover:bg-destructive/10")}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(mediaId)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end gap-2 border-t pt-6">
        <Button variant="outline" onClick={() => navigate("/listings")}>
          Done
        </Button>
        <Button
          onClick={() => {
            toast.success("Ready to publish");
            navigate(`/listings/${propertyId}/edit`);
          }}
        >
          Edit listing details
        </Button>
      </div>
    </div>
  );
}

export default function ListingMediaPage() {
  const { id = "" } = useParams();
  return <MediaManager propertyId={id} />;
}
