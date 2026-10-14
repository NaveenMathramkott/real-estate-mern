import {
  ArrowDownIcon,
  ArrowUpIcon,
  BathIcon,
  BedDoubleIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  HeartIcon,
  MapPinIcon,
  MaximizeIcon,
  MessageSquareIcon,
  Share2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingBlock,
  RatingStars,
  SectionHeading,
  StarPicker,
} from "@/components/common";
import {
  PropertyGallery,
  PropertySpecStrip,
} from "@/components/property/property-gallery";
import { PropertyMap } from "@/components/property/property-map";
import { PropertyResultsGrid } from "@/components/search/property-results";
import { PropertyTypeIcon } from "@/features/property-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { conversationApi, propertyApi, reviewApi } from "@/lib/api";
import { AMENITY_ICONS, propertyTypeLabel } from "@/lib/constants";
import {
  formatCurrency,
  formatDateTime,
  formatListingPrice,
  formatPriceDelta,
  formatRelative,
  formatShortDate,
  idOf,
  pricePerSqft,
} from "@/lib/format";
import { useFavoriteAction } from "@/hooks/use-favorite-action";
import { useIsFavorite } from "@/store/favorites-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

function InquiryCard({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const send = useMutation({
    mutationFn: () => propertyApi.inquire(propertyId, message),
    successMessage: "Enquiry sent",
    onSuccess: () => {
      setOpen(false);
      setMessage("");
    },
  });

  return (
    <>
      <Card className="gap-4 p-5">
        <div className="space-y-1">
          <p className="font-display text-lg font-medium">Interested?</p>
          <p className="text-muted-foreground text-sm">
            Send an enquiry and it goes straight to the assigned agent or owner.
          </p>
        </div>

        <Button
          className="w-full"
          disabled={!user}
          onClick={() =>
            user
              ? setOpen(true)
              : navigate("/login", {
                  state: { from: window.location.pathname },
                })
          }
        >
          <MessageSquareIcon />
          Send enquiry
        </Button>

        {!user && (
          <p className="text-muted-foreground text-center text-xs">
            Sign in to send enquiries and save this listing.
          </p>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Send an enquiry</DialogTitle>
            <DialogDescription>
              Mention when you want to move and your budget — agents reply
              faster with specifics.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              send.mutate();
            }}
          >
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="I'd like to know more about this property…"
              rows={5}
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={send.isPending || !message.trim()}
              >
                {send.isPending ? "Sending…" : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChatButton({
  propertyId,
  agentId,
}: {
  propertyId: string;
  agentId?: string;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const start = useMutation({
    mutationFn: () =>
      conversationApi.create({ participantId: agentId!, propertyId }),
    onSuccess: (data) => navigate(`/messages/${data.conversation._id}`),
  });

  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={!agentId}
      onClick={() => {
        if (!user) {
          navigate("/login", { state: { from: window.location.pathname } });
          return;
        }
        start.mutate();
      }}
    >
      <MessageSquareIcon />
      {start.isPending ? "Opening chat…" : "Chat with the agent"}
    </Button>
  );
}

function PriceHistoryPanel({
  propertyId,
  currency,
}: {
  propertyId: string;
  currency?: string;
}) {
  const { data, isLoading } = useQuery(
    `get|/properties/${propertyId}/price-history`,
    () => propertyApi.priceHistory(propertyId),
  );
  const history = data?.history ?? [];
  const latest = history[0];
  const delta = latest
    ? formatPriceDelta(latest.oldPrice, latest.newPrice)
    : null;

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-medium">Price history</h3>
          <p className="text-muted-foreground text-sm">
            Recorded automatically whenever the listing price changes.
          </p>
        </div>
        {delta && delta.direction !== "flat" && (
          <Badge
            variant={delta.direction === "down" ? "success" : "warning"}
            className="gap-1"
          >
            {delta.direction === "down" ? (
              <TrendingDownIcon />
            ) : (
              <TrendingUpIcon />
            )}
            {delta.percent}%
          </Badge>
        )}
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading price history…" />
      ) : history.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No price changes recorded — this is the listing's first price.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.slice(0, 6).map((entry) => {
            const change = formatPriceDelta(entry.oldPrice, entry.newPrice);
            return (
              <li
                key={entry._id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium tabular">
                    {formatCurrency(entry.newPrice, currency)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatShortDate(entry.changedAt)} · from{" "}
                    {formatCurrency(entry.oldPrice, currency)}
                  </p>
                </div>
                {change && change.direction !== "flat" && (
                  <span
                    className={`flex items-center gap-1 text-xs font-medium tabular ${
                      change.direction === "down"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {change.direction === "down" ? (
                      <ArrowDownIcon className="size-3" />
                    ) : (
                      <ArrowUpIcon className="size-3" />
                    )}
                    {Math.abs(change.delta).toLocaleString("en-IN")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ReviewsPanel({
  propertyId,
  buildingId,
}: {
  propertyId: string;
  buildingId?: string;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [rating, setRating] = React.useState(0);
  const [body, setBody] = React.useState("");

  const { data, isLoading } = useQuery(
    `get|/properties/${propertyId}/reviews`,
    () => propertyApi.reviews(propertyId),
  );

  const submit = useMutation({
    // Reviews attach to the building when the listing has one — the API upserts
    // on (targetType, targetId, userId), so re-rating edits instead of dupes.
    mutationFn: () =>
      reviewApi.create({
        targetType: buildingId ? "building" : "area",
        targetId: buildingId ?? propertyId,
        rating,
        body,
      }),
    onSuccess: () => {
      setRating(0);
      setBody("");
      toast.success("Review saved");
    },
  });

  const reviews = data?.reviews ?? [];
  const distribution = data?.distribution ?? {};

  return (
    <Card className="gap-5 p-5">
      <div>
        <h3 className="font-display text-lg font-medium">
          What people say about this building
        </h3>
        <p className="text-muted-foreground text-sm">
          Reviews are tied to the building, so they carry across listings.
        </p>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div className="space-y-2 text-center">
            <p className="font-display text-4xl leading-none font-medium tabular">
              {(data?.avgRating ?? 0).toFixed(1)}
            </p>
            <RatingStars value={data?.avgRating ?? 0} />
            <p className="text-muted-foreground text-xs">
              {data?.total ?? 0} reviews
            </p>
          </div>

          <ul className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] ?? 0;
              const percent =
                (data?.total ?? 0) > 0 ? (count / (data?.total ?? 1)) * 100 : 0;
              return (
                <li key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-6 shrink-0 tabular">
                    {star} ★
                  </span>
                  <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-gold block h-full rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-muted-foreground w-8 shrink-0 text-right tabular">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {user ? (
        <form
          className="space-y-3 border-t pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (rating > 0) submit.mutate();
          }}
        >
          <StarPicker value={rating} onChange={setRating} />
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share what it was like living here…"
            rows={3}
          />
          <Button
            type="submit"
            size="sm"
            disabled={rating === 0 || submit.isPending}
          >
            {submit.isPending ? "Saving…" : "Post review"}
          </Button>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => navigate("/login")}
        >
          Sign in to write a review
        </Button>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-3 border-t pt-4">
          {reviews.slice(0, 5).map((review) => (
            <li key={review._id} className="space-y-1">
              <RatingStars value={review.rating} />
              {review.body && (
                <p className="text-sm leading-relaxed">{review.body}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {formatRelative(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function PropertyDetailPage() {
  const { id = "" } = useParams();
  const onFavorite = useFavoriteAction();
  const user = useAuthStore((s) => s.user);
  const isShortlisted = useIsFavorite(id);

  const { data, isLoading, error, refetch } = useQuery(
    id ? `get|/properties/${id}` : null,
    () => propertyApi.detail(id),
    { enabled: Boolean(id) },
  );

  const { data: similarData } = useQuery(
    id ? `get|/properties/${id}/similar` : null,
    () => propertyApi.similar(id),
    { enabled: Boolean(id) },
  );

  const property = data?.property;
  const media = data?.media ?? [];

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: property?.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  if (isLoading) return <LoadingBlock className="min-h-[60vh]" />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!property) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={Building2Icon}
          title="Listing not found"
          description="This property may have been removed or the link is wrong."
          action={
            <Button asChild>
              <Link to="/search">Browse listings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const perSqft = pricePerSqft(property.price, property.size);
  const coordinates = property.location?.coordinates;
  // ownerId/agentId arrive populated on some routes and as bare ids on others.
  const canManage =
    user &&
    (user.role === "admin" ||
      idOf(property.ownerId) === user._id ||
      idOf(property.agentId) === user._id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            { label: "Search", to: "/search" },
            {
              label: property.purpose === "rent" ? "Rent" : "Buy",
              to: `/search?purpose=${property.purpose}`,
            },
            { label: property.title },
          ]}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void share()}>
            <Share2Icon />
            Share
          </Button>
          <Button
            variant={isShortlisted ? "soft" : "outline"}
            size="sm"
            aria-pressed={isShortlisted}
            aria-label={
              isShortlisted ? "Remove from shortlist" : "Add to shortlist"
            }
            onClick={() => void onFavorite(property._id)}
          >
            <HeartIcon
              className={cn(
                isShortlisted && "fill-destructive text-destructive",
              )}
            />
            {isShortlisted ? "Shortlisted" : "Shortlist"}
          </Button>
          {canManage && (
            <Button size="sm" asChild>
              <Link to={`/listings/${property._id}/edit`}>Edit listing</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <PropertyGallery
            media={media}
            title={property.title}
            propertyId={property._id}
            propertyType={property.type}
          />

          {/* ---------------------------------------------------- headline */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>
                    {property.purpose === "rent" ? "For rent" : "For sale"}
                  </Badge>
                  <Badge variant="muted">
                    <PropertyTypeIcon type={property.type} />
                    {propertyTypeLabel(property.type)}
                  </Badge>
                  {property.verifiedAt && (
                    <Badge variant="success">
                      <CheckCircle2Icon />
                      Verified
                    </Badge>
                  )}
                  {property.status !== "active" && (
                    <Badge variant="warning" className="capitalize">
                      {property.status}
                    </Badge>
                  )}
                </div>

                <h1 className="font-display text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
                  {property.title}
                </h1>

                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <MapPinIcon className="size-4" />
                  {property.address ?? "Address on request"}
                </p>
              </div>

              <div className="text-right">
                <p className="font-display text-3xl leading-none font-medium tabular">
                  {formatListingPrice(
                    property.price,
                    property.currency,
                    property.purpose,
                  )}
                </p>
                {perSqft && (
                  <p className="text-muted-foreground mt-1 text-xs tabular">
                    ₹{perSqft} per sq.ft
                  </p>
                )}
              </div>
            </div>

            <PropertySpecStrip
              beds={property.beds}
              baths={property.baths}
              size={property.size}
              floor={property.floor}
              type={property.furnished?.replace("-", " ")}
            />

            {property.reviews && property.reviews.count > 0 && (
              <RatingStars
                value={property.reviews.average}
                count={property.reviews.count}
                size="md"
              />
            )}
          </div>

          <Separator />

          {/* --------------------------------------------------- overview */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KeyValue label="Bedrooms" icon={BedDoubleIcon}>
              {property.beds ?? "—"}
            </KeyValue>
            <KeyValue label="Bathrooms" icon={BathIcon}>
              {property.baths ?? "—"}
            </KeyValue>
            <KeyValue label="Built-up area" icon={MaximizeIcon}>
              {property.size
                ? `${property.size.toLocaleString("en-IN")} sq.ft`
                : "—"}
            </KeyValue>
            <KeyValue label="Available from" icon={CalendarIcon}>
              {property.availableFrom
                ? formatShortDate(property.availableFrom)
                : "Immediately"}
            </KeyValue>
          </div>

          {property.description && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-medium">
                About this property
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          {(property.amenities?.length ?? 0) > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-medium">Amenities</h2>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {property.amenities!.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border p-2.5 text-sm capitalize"
                  >
                    <CheckCircle2Icon className="text-primary size-3.5 shrink-0" />
                    {AMENITY_ICONS[amenity] ?? amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {coordinates && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-medium">Location</h2>
              <PropertyMap
                properties={[property]}
                center={[coordinates[1], coordinates[0]]}
                className="h-80 overflow-hidden rounded-xl border"
              />
            </section>
          )}

          <PriceHistoryPanel
            propertyId={property._id}
            currency={property.currency}
          />

          <ReviewsPanel
            propertyId={property._id}
            buildingId={property.buildingId}
          />

          <p className="text-muted-foreground text-xs">
            Listed {formatDateTime(property.createdAt)} · Last updated{" "}
            {formatDateTime(property.updatedAt)}
          </p>
        </div>

        {/* ------------------------------------------------------- sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InquiryCard propertyId={property._id} />
          <ChatButton
            propertyId={property._id}
            agentId={property.agentId ?? property.ownerId}
          />

          <Card className="gap-4 p-5">
            <p className="font-display text-lg font-medium">Listing details</p>
            <dl className="space-y-3">
              <KeyValue label="Property ID">
                <span className="text-muted-foreground font-mono text-xs">
                  {property._id}
                </span>
              </KeyValue>
              <KeyValue label="Type">
                {propertyTypeLabel(property.type)}
              </KeyValue>
              <KeyValue label="Status" className="capitalize">
                {property.status}
              </KeyValue>
              {property.floor && (
                <KeyValue label="Floor">{property.floor}</KeyValue>
              )}
              <KeyValue label="Furnishing" className="capitalize">
                {property.furnished?.replace("-", " ")}
              </KeyValue>
              {property.verifiedAt && (
                <KeyValue label="Verified on">
                  {formatShortDate(property.verifiedAt)}
                </KeyValue>
              )}
            </dl>
          </Card>
        </aside>
      </div>

      {(similarData?.properties?.length ?? 0) > 0 && (
        <section className="mt-16 space-y-6 border-t pt-10">
          <SectionHeading
            eyebrow="You might also like"
            title="Similar homes nearby"
            description="Same purpose and type, within 20% of this price and 5 km away."
          />
          <PropertyResultsGrid
            properties={similarData!.properties}
            columns={4}
          />
        </section>
      )}
    </div>
  );
}
