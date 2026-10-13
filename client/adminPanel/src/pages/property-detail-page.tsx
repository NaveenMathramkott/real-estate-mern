import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  Building2Icon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilmIcon,
  ImageIcon,
  MapPinIcon,
  MessageSquarePlusIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingBlock,
  PageHeader,
  Panel,
  Tag,
} from "@/components/common";
import { StatusBadge } from "@/features/shared/status-badge";
import { ConfirmDialog } from "@/features/shared/widgets";
import { Alert } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { dashboardApi, propertyApi } from "@/lib/api";
import {
  FURNISHED,
  MEDIA_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PURPOSES,
} from "@/lib/constants";
import {
  coordinatesToLatLng,
  formatArea,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatShortDate,
} from "@/lib/format";
import { countEntries, pick, pickList } from "@/lib/safe";
import type {
  PriceHistoryEntry,
  Property,
  PropertyMedia,
  Review,
} from "@/lib/types";

type Detail = { property?: Property; media?: PropertyMedia[] };

export default function PropertyDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = React.useState(false);
  const [addingMedia, setAddingMedia] = React.useState(false);
  const [inquiring, setInquiring] = React.useState(false);

  const detail = useQuery<Detail>(`get|/properties/${id}|`, () =>
    propertyApi.detail(id),
  );
  const history = useQuery<{ history: PriceHistoryEntry[] }>(
    `get|/properties/${id}/price-history|`,
    () => propertyApi.priceHistory(id),
  );
  const similar = useQuery<{ properties: Property[] }>(
    `get|/properties/${id}/similar|`,
    () => propertyApi.similar(id),
  );
  const reviews = useQuery<{
    reviews: Review[];
    avgRating: number;
    distribution: Record<string, number>;
  }>(`get|/properties/${id}/reviews|`, () => propertyApi.reviews(id));

  const verify = useMutation({
    mutationFn: (next: boolean) => dashboardApi.verifyProperty(id, next),
    successMessage: "Verification updated",
    invalidate: () =>
      queryStore.invalidate("get|/properties", "get|/dashboard"),
  });

  const update = useMutation({
    mutationFn: (payload: Partial<Property>) => propertyApi.update(id, payload),
    successMessage: "Listing updated",
    invalidate: () => {
      queryStore.invalidate("get|/properties", "get|/dashboard");
    },
  });

  const remove = useMutation({
    mutationFn: () => propertyApi.remove(id),
    successMessage: "Listing expired",
    onSuccess: () => {
      queryStore.invalidate("get|/properties", "get|/dashboard");
      navigate("/properties");
    },
  });

  const addMedia = useMutation({
    mutationFn: (payload: Omit<PropertyMedia, "_id" | "propertyId">) =>
      propertyApi.addMedia(id, payload),
    successMessage: "Media attached",
    invalidate: () => queryStore.invalidate(`get|/properties/${id}`),
  });

  const reorderMedia = useMutation({
    mutationFn: (mediaIds: string[]) => propertyApi.reorderMedia(id, mediaIds),
    invalidate: () => queryStore.invalidate(`get|/properties/${id}`),
  });

  const removeMedia = useMutation({
    mutationFn: (mediaId: string) => propertyApi.removeMedia(id, mediaId),
    successMessage: "Media removed",
    invalidate: () => queryStore.invalidate(`get|/properties/${id}`),
  });

  const inquire = useMutation({
    mutationFn: (message: string) => propertyApi.inquire(id, message),
    successMessage: "Inquiry sent",
    invalidate: () => queryStore.invalidate("get|/inquiries"),
  });

  if (detail.isLoading && !detail.data) return <LoadingBlock />;
  if (detail.error)
    return <ErrorState message={detail.error} onRetry={detail.refetch} />;

  const property = pick<Property>(detail.data, "property");
  if (!property) return null;

  const media = pickList<PropertyMedia>(detail.data, "media");
  const images = media.filter((m) => m.type === "image");
  const others = media.filter((m) => m.type !== "image");
  const priceHistory = pickList<PriceHistoryEntry>(history.data, "history");
  const priceEntries = [...priceHistory].reverse();
  const point = coordinatesToLatLng(property.location?.coordinates);
  const distribution =
    pick<Record<string, number>>(reviews.data, "distribution") ?? {};
  const distributionTotal = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to="/properties">
          <ArrowLeftIcon className="size-4" />
          Back to listings
        </Link>
      </Button>

      <PageHeader
        title={property.title}
        description={property.address ?? "No address on record"}
        actions={
          <>
            <Button variant="outline" onClick={() => setInquiring(true)}>
              <MessageSquarePlusIcon className="size-4" />
              Send inquiry
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <ConfirmDialog
              title="Expire this listing?"
              description="This soft-deletes the listing by setting its status to expired. The record is preserved."
              confirmLabel="Expire listing"
              onConfirm={() => remove.mutate()}
              trigger={
                <Button variant="destructive" disabled={remove.isPending}>
                  <Trash2Icon className="size-4" />
                  Expire
                </Button>
              }
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={property.status} />
        <Badge variant="outline" className="capitalize">
          {property.purpose}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {property.type}
        </Badge>
        {property.verifiedAt ? (
          <Badge variant="success">
            <BadgeCheckIcon className="size-3" />
            Verified {formatShortDate(property.verifiedAt)}
          </Badge>
        ) : (
          <Badge variant="warning">Awaiting verification</Badge>
        )}
        <Button
          size="sm"
          variant={property.verifiedAt ? "outline" : "default"}
          className="ml-auto"
          disabled={verify.isPending}
          onClick={() => verify.mutate(!property.verifiedAt)}
        >
          {property.verifiedAt ? "Revoke verification" : "Verify listing"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Pricing" className="lg:col-span-1">
          <div className="space-y-4 p-5">
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                Asking price
              </p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(property.price, property.currency)}
              </p>
            </div>
            {priceEntries.length > 0 && <PriceDelta history={priceHistory} />}
            <div className="grid grid-cols-2 gap-3">
              <KeyValue label="Per sq.ft">
                {property.size
                  ? formatCurrency(
                      Math.round(property.price / property.size),
                      property.currency,
                    )
                  : "—"}
              </KeyValue>
              <KeyValue label="Furnishing">
                <span className="capitalize">{property.furnished ?? "—"}</span>
              </KeyValue>
            </div>
          </div>
        </Panel>

        <Panel title="Specification" className="lg:col-span-2">
          <div className="grid gap-5 p-5 sm:grid-cols-3">
            <KeyValue label="Bedrooms">
              {formatNumber(property.beds ?? 0)}
            </KeyValue>
            <KeyValue label="Bathrooms">
              {formatNumber(property.baths ?? 0)}
            </KeyValue>
            <KeyValue label="Carpet area">{formatArea(property.size)}</KeyValue>
            <KeyValue label="Floor">{property.floor ?? "—"}</KeyValue>
            <KeyValue label="Available from">
              {property.availableFrom
                ? formatShortDate(property.availableFrom)
                : "—"}
            </KeyValue>
            <KeyValue label="Currency">{property.currency ?? "INR"}</KeyValue>
            <KeyValue label="Created">
              {formatShortDate(property.createdAt)}
            </KeyValue>
            <KeyValue label="Last updated">
              {formatShortDate(property.updatedAt)}
            </KeyValue>
            <KeyValue label="Coordinates">
              {point ? (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="text-muted-foreground size-3.5" />
                  {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                </span>
              ) : (
                "—"
              )}
            </KeyValue>
          </div>
          {property.amenities && property.amenities.length > 0 && (
            <div className="border-t p-5">
              <p className="text-muted-foreground mb-3 text-xs tracking-wide uppercase">
                Amenities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((amenity) => (
                  <Tag key={amenity}>{amenity}</Tag>
                ))}
              </div>
            </div>
          )}
          {property.description && (
            <div className="border-t p-5">
              <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                Description
              </p>
              <p className="text-sm leading-relaxed">{property.description}</p>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Media"
        description={`${media.length} asset${media.length === 1 ? "" : "s"} attached`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingMedia(true)}
          >
            <PlusIcon className="size-4" />
            Attach media
          </Button>
        }
      >
        {media.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No media attached"
            description="Attach images, video, floorplans or virtual tours from the listing API."
            action={
              <Button onClick={() => setAddingMedia(true)}>
                <PlusIcon className="size-4" />
                Attach the first asset
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...images, ...others].map((item, index) => (
                <MediaTile
                  key={item._id}
                  item={item}
                  busy={reorderMedia.isPending || removeMedia.isPending}
                  onMove={(direction) => {
                    const order = [...images, ...others].map((m) => m._id);
                    const target = index + direction;
                    if (target < 0 || target >= order.length) return;
                    [order[index], order[target]] = [
                      order[target],
                      order[index],
                    ];
                    reorderMedia.mutate(order);
                  }}
                  onRemove={() => removeMedia.mutate(item._id)}
                />
              ))}
            </div>
            <p className="text-muted-foreground border-t px-5 py-3 text-xs">
              Reordering writes the full order array in one call, so every
              position lands in a single round trip.
            </p>
          </>
        )}
      </Panel>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Price history</TabsTrigger>
          <TabsTrigger value="similar">Similar listings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Panel>
            {priceEntries.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="No price changes recorded"
                description="Price history is written automatically whenever the price changes."
              />
            ) : (
              <>
                <div className="h-64 p-5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={priceEntries}
                      margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="changedAt"
                        tickFormatter={(value: string) =>
                          formatShortDate(value)
                        }
                        tickLine={false}
                        axisLine={false}
                        className="text-muted-foreground text-xs"
                      />
                      <YAxis
                        tickFormatter={(value: number) =>
                          formatCurrency(value, property.currency, true)
                        }
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        className="text-muted-foreground text-xs"
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                        }}
                        formatter={
                          ((value: number) => [
                            formatCurrency(value, property.currency),
                            "Price",
                          ]) as never
                        }
                        labelFormatter={
                          ((value: string) => formatShortDate(value)) as never
                        }
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <ul className="divide-border divide-y border-t">
                  {priceEntries.map((entry) => {
                    const delta = entry.newPrice - entry.oldPrice;
                    const up = delta >= 0;
                    return (
                      <li
                        key={entry._id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <span
                          className={`flex size-8 items-center justify-center rounded-lg ${
                            up
                              ? "bg-success/12 text-success"
                              : "bg-destructive/12 text-destructive"
                          }`}
                        >
                          {up ? (
                            <TrendingUpIcon className="size-4" />
                          ) : (
                            <TrendingDownIcon className="size-4" />
                          )}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="text-muted-foreground line-through">
                              {formatCurrency(
                                entry.oldPrice,
                                property.currency,
                              )}
                            </span>{" "}
                            →{" "}
                            <span className="font-medium">
                              {formatCurrency(
                                entry.newPrice,
                                property.currency,
                              )}
                            </span>
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatDateTime(entry.changedAt)}
                          </p>
                        </div>
                        <Badge variant={up ? "success" : "destructive"}>
                          {up ? "+" : ""}
                          {formatCurrency(delta, property.currency, true)}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="similar">
          <Panel>
            {similar.isLoading ? (
              <LoadingBlock />
            ) : pickList<Property>(similar.data, "properties").length === 0 ? (
              <EmptyState
                icon={Building2Icon}
                title="No comparable listings"
                description="Similarity requires matching purpose and type within 20% price and 5 km."
              />
            ) : (
              <ul className="divide-border divide-y">
                {pickList<Property>(similar.data, "properties").map((item) => (
                  <li key={item._id}>
                    <Link
                      to={`/properties/${item._id}`}
                      className="hover:bg-accent/40 flex items-center gap-3 px-5 py-3 transition-colors"
                    >
                      <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                        <Building2Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.address ?? "No address"}
                        </p>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(item.price, item.currency, true)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="reviews">
          <Panel>
            {reviews.isLoading ? (
              <LoadingBlock />
            ) : pickList<Review>(reviews.data, "reviews").length === 0 ? (
              <EmptyState
                icon={StarIcon}
                title="No reviews for this building"
                description="Reviews attach to the building, not the individual listing."
              />
            ) : (
              <div className="grid gap-6 p-5 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tabular-nums">
                      {(reviews.data?.avgRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      / 5 average
                    </span>
                  </div>
                  {countEntries(pick(reviews.data, "distribution")).map(
                    ({ label: star, value: count }) => (
                      <div
                        key={star}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground w-8">
                          {star}★
                        </span>
                        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                          <div
                            className="bg-warning h-full rounded-full"
                            style={{
                              width: `${
                                (count / Math.max(distributionTotal)) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground w-6 text-right tabular-nums">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
                <ul className="space-y-4 md:col-span-2">
                  {pickList<Review>(reviews.data, "reviews").map((review) => (
                    <li
                      key={review._id}
                      className="border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-1 text-warning">
                        {Array.from({ length: review.rating }).map(
                          (_, index) => (
                            <StarIcon
                              key={index}
                              className="size-3.5 fill-current"
                            />
                          ),
                        )}
                      </div>
                      {review.body && (
                        <p className="mt-2 text-sm leading-relaxed">
                          {review.body}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-2 text-xs">
                        {formatShortDate(review.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      {/* Remounts on open so the form starts from the listing's current values. */}
      <EditPropertyDialog
        key={editing ? property._id : "closed"}
        open={editing}
        onOpenChange={setEditing}
        property={property}
        onSubmit={(payload) => update.mutateAsync(payload)}
        pending={update.isPending}
      />
      <AddMediaDialog
        key={addingMedia ? "open" : "closed"}
        open={addingMedia}
        onOpenChange={setAddingMedia}
        nextOrder={media.length}
        onSubmit={(payload) => addMedia.mutateAsync(payload)}
        pending={addMedia.isPending}
      />
      <InquireDialog
        key={inquiring ? property._id : "closed"}
        open={inquiring}
        onOpenChange={setInquiring}
        title={property.title}
        onSubmit={(message) => inquire.mutateAsync(message)}
        pending={inquire.isPending}
      />
    </div>
  );
}

function AddMediaDialog({
  open,
  onOpenChange,
  nextOrder,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextOrder: number;
  onSubmit: (
    payload: Omit<PropertyMedia, "_id" | "propertyId">,
  ) => Promise<unknown>;
  pending: boolean;
}) {
  const [draft, setDraft] = React.useState(() => ({
    type: "image" as PropertyMedia["type"],
    url: "",
    publicId: "",
    blurhash: "",
    order: String(nextOrder),
  }));

  const submit = async () => {
    await onSubmit({
      type: draft.type,
      url: draft.url,
      publicId: draft.publicId || undefined,
      blurhash: draft.blurhash || undefined,
      order: Number(draft.order) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach media</DialogTitle>
          <DialogDescription>
            Uploads take a hosted URL — multipart uploads need a multipart
            middleware on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={draft.type}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  type: value as PropertyMedia["type"],
                }))
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

          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input
              value={draft.url}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, url: event.target.value }))
              }
              placeholder="https://res.cloudinary.com/…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Public ID</Label>
              <Input
                value={draft.publicId}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    publicId: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Blurhash</Label>
              <Input
                value={draft.blurhash}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    blurhash: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Display order</Label>
            <Input
              inputMode="numeric"
              value={draft.order}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, order: event.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || !draft.url.trim()}
            onClick={() => void submit()}
          >
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InquireDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: (message: string) => Promise<unknown>;
  pending: boolean;
}) {
  const [message, setMessage] = React.useState("");

  const submit = async () => {
    await onSubmit(message.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send inquiry</DialogTitle>
          <DialogDescription>
            Routed to the assigned agent, or the owner when none is set.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Message about {title}</Label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Is this still available? Can I schedule a viewing?"
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || !message.trim()}
            onClick={() => void submit()}
          >
            Send inquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaTile({
  item,
  busy,
  onMove,
  onRemove,
}: {
  item: PropertyMedia;
  busy?: boolean;
  onMove?: (direction: -1 | 1) => void;
  onRemove?: () => void;
}) {
  const Icon =
    item.type === "image"
      ? ImageIcon
      : item.type === "video"
        ? FilmIcon
        : Building2Icon;

  return (
    <div className="group bg-muted/50 relative overflow-hidden rounded-lg border">
      {item.type === "image" ? (
        <img
          src={item.url}
          alt={`${item.type} asset`}
          loading="lazy"
          className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-32 w-full items-center justify-center"
        >
          <Icon className="text-muted-foreground size-6" />
        </a>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-6 pb-1.5 text-white">
        <span className="text-[11px] font-medium capitalize">{item.type}</span>
        <span className="text-[11px] opacity-80">#{item.order}</span>
      </div>
      {onMove && onRemove && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon-sm"
            className="size-7"
            disabled={busy}
            aria-label="Move earlier"
            onClick={() => onMove(-1)}
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            className="size-7"
            disabled={busy}
            aria-label="Move later"
            onClick={() => onMove(1)}
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            className="size-7"
            disabled={busy}
            aria-label="Remove media"
            onClick={onRemove}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function PriceDelta({ history }: { history: PriceHistoryEntry[] }) {
  const latest = history[0];
  const delta = latest.newPrice - latest.oldPrice;
  const pct = latest.oldPrice ? Math.round((delta / latest.oldPrice) * 100) : 0;
  const up = delta >= 0;

  return (
    <Alert variant={up ? "default" : "success"}>
      <div className="flex items-center gap-2">
        {up ? (
          <TrendingUpIcon className="text-destructive size-4" />
        ) : (
          <TrendingDownIcon className="text-success size-4" />
        )}
        <span className="text-sm font-medium">
          {up ? "Increased" : "Reduced"} {Math.abs(pct)}%
        </span>
      </div>
      <p className="mt-1 text-xs">
        {formatCurrency(latest.oldPrice, "INR")} →{" "}
        {formatCurrency(latest.newPrice, "INR")} on{" "}
        {formatShortDate(latest.changedAt)}
      </p>
    </Alert>
  );
}

function EditPropertyDialog({
  open,
  onOpenChange,
  property,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onSubmit: (payload: Partial<Property>) => Promise<unknown>;
  pending: boolean;
}) {
  const [draft, setDraft] = React.useState(() => ({
    title: property.title,
    price: String(property.price ?? ""),
    beds: String(property.beds ?? ""),
    baths: String(property.baths ?? ""),
    size: String(property.size ?? ""),
    address: property.address ?? "",
    description: property.description ?? "",
    type: property.type,
    purpose: property.purpose,
    status: property.status,
    furnished: property.furnished ?? "unfurnished",
  }));

  const number = (value: string) => (value === "" ? undefined : Number(value));

  const submit = () => {
    const payload: Partial<Property> = {
      title: draft.title,
      price: number(draft.price),
      beds: number(draft.beds),
      baths: number(draft.baths),
      size: number(draft.size),
      address: draft.address,
      description: draft.description,
      type: draft.type,
      purpose: draft.purpose,
      status: draft.status,
      furnished: draft.furnished,
    };
    void onSubmit(payload).then(() => onOpenChange(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>
            Changing the price automatically writes a price-history entry.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Price</Label>
            <Input
              inputMode="numeric"
              value={draft.price}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, price: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  status: value as typeof draft.status,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_STATUSES.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={draft.type}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  type: value as typeof draft.type,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Select
              value={draft.purpose}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  purpose: value as typeof draft.purpose,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((purpose) => (
                  <SelectItem
                    key={purpose}
                    value={purpose}
                    className="capitalize"
                  >
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Bedrooms</Label>
            <Input
              inputMode="numeric"
              value={draft.beds}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, beds: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bathrooms</Label>
            <Input
              inputMode="numeric"
              value={draft.baths}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, baths: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Carpet area (sq.ft)</Label>
            <Input
              inputMode="numeric"
              value={draft.size}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, size: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Furnishing</Label>
            <Select
              value={draft.furnished}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  furnished: value as typeof draft.furnished,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FURNISHED.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={draft.address}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, address: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={submit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
