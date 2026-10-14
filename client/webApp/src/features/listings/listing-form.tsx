import { LocateFixedIcon, SaveIcon } from "lucide-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState, LoadingBlock } from "@/components/common";
import { PropertyMap } from "@/components/property/property-map";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { useResettableState } from "@/hooks/use-resettable-state";
import { useQuery } from "@/hooks/use-query";
import { propertyApi } from "@/lib/api";
import {
  AMENITIES,
  FURNISHED,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PURPOSES,
} from "@/lib/constants";
import { formatPriceDelta } from "@/lib/format";
import type { Property } from "@/lib/types";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

type FormState = {
  title: string;
  description: string;
  type: string;
  purpose: string;
  price: string;
  size: string;
  beds: string;
  baths: string;
  floor: string;
  furnished: string;
  address: string;
  availableFrom: string;
  lat: string;
  lng: string;
  amenities: string[];
  status: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  type: "apartment",
  purpose: "rent",
  price: "",
  size: "",
  beds: "",
  baths: "",
  floor: "",
  furnished: "unfurnished",
  address: "",
  availableFrom: "",
  lat: "28.6139",
  lng: "77.209",
  amenities: [],
  status: "active",
};

function fromProperty(property: Property): FormState {
  const coordinates = property.location?.coordinates;
  return {
    title: property.title ?? "",
    description: property.description ?? "",
    type: property.type ?? "apartment",
    purpose: property.purpose ?? "rent",
    price: String(property.price ?? ""),
    size: property.size ? String(property.size) : "",
    beds: property.beds !== undefined ? String(property.beds) : "",
    baths: property.baths !== undefined ? String(property.baths) : "",
    floor: property.floor ?? "",
    furnished: property.furnished ?? "unfurnished",
    address: property.address ?? "",
    availableFrom: property.availableFrom?.slice(0, 10) ?? "",
    lat: coordinates ? String(coordinates[1]) : "28.6139",
    lng: coordinates ? String(coordinates[0]) : "77.209",
    amenities: property.amenities ?? [],
    status: property.status ?? "active",
  };
}

function toPayload(form: FormState) {
  return {
    title: form.title,
    description: form.description || undefined,
    type: form.type,
    purpose: form.purpose,
    price: Number(form.price),
    size: form.size ? Number(form.size) : undefined,
    beds: form.beds ? Number(form.beds) : undefined,
    baths: form.baths ? Number(form.baths) : undefined,
    floor: form.floor || undefined,
    furnished: form.furnished,
    amenities: form.amenities,
    address: form.address,
    availableFrom: form.availableFrom || undefined,
    status: form.status,
    // GeoJSON is [lng, lat] — swapping these silently breaks every spatial query.
    location: {
      type: "Point" as const,
      coordinates: [Number(form.lng), Number(form.lat)] as [number, number],
    },
  };
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

export function ListingForm({
  propertyId,
}: {
  /** Absent for a new listing. */
  propertyId?: string;
}) {
  const navigate = useNavigate();
  const isEdit = Boolean(propertyId);

  const { data, isLoading, error } = useQuery(
    propertyId ? `get|/properties/${propertyId}` : null,
    () => propertyApi.detail(propertyId!),
    { enabled: isEdit },
  );

  // Re-keyed on the fetched record, so an edit loads its values without an
  // effect writing them back over what the visitor has typed.
  const [form, setForm] = useResettableState<FormState>(
    () => (data?.property ? fromProperty(data.property) : EMPTY),
    data?.property?._id ?? "new",
  );
  const [priceChanged, setPriceChanged] = React.useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const originalPrice = data?.property?.price;
  const pendingDelta =
    isEdit && originalPrice && Number(form.price) !== originalPrice
      ? formatPriceDelta(originalPrice, Number(form.price))
      : null;

  const save = useMutation({
    mutationFn: () => {
      const payload = toPayload(form);
      return isEdit
        ? propertyApi.update(propertyId!, payload as Partial<Property>)
        : propertyApi.create(payload as Partial<Property>);
    },
    successMessage: isEdit ? "Listing updated" : "Listing published",
    onSuccess: (data) => {
      const created = (data as { property: Property }).property;
      toast.success(
        isEdit ? "Listing updated" : "Listing published",
        isEdit && priceChanged
          ? "The price change was added to the price history."
          : undefined,
      );
      navigate(`/listings/${created._id}/media`, { replace: true });
    },
  });

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      set("lat", position.coords.latitude.toFixed(6));
      set("lng", position.coords.longitude.toFixed(6));
    });
  };

  if (isEdit && isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (error) return <ErrorState message={error} />;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        setPriceChanged(
          originalPrice !== undefined && Number(form.price) !== originalPrice,
        );
        save.mutate();
      }}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
            {isEdit ? "Edit listing" : "Create a listing"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Everything here is searchable — the more precise the address and
            coordinates, the better the map placement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            <SaveIcon />
            {save.isPending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Publish listing"}
          </Button>
        </div>
      </header>

      {pendingDelta && pendingDelta.direction !== "flat" && (
        <div className="bg-accent text-accent-foreground rounded-xl border px-4 py-3 text-sm">
          Changing the price from{" "}
          <strong className="tabular">
            {originalPrice?.toLocaleString("en-IN")}
          </strong>{" "}
          to{" "}
          <strong className="tabular">
            {Number(form.price).toLocaleString("en-IN")}
          </strong>{" "}
          will be written to the listing's price history.
        </div>
      )}

      <Card className="gap-5 p-6">
        <h2 className="font-display text-lg font-medium">The basics</h2>

        <Field label="Listing title">
          <Input
            required
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Sunlit 2BHK with a wrap-around balcony"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Purpose">
            <Select
              value={form.purpose}
              onValueChange={(value) => set("purpose", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose === "rent" ? "For rent" : "For sale"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Property type">
            <Select
              value={form.type}
              onValueChange={(value) => set("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PROPERTY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(value) => set("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span className="capitalize">{status}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            rows={6}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="What makes this home worth a visit? Light, parking, the neighbour, the commute…"
          />
        </Field>
      </Card>

      <Card className="gap-5 p-6">
        <h2 className="font-display text-lg font-medium">Numbers</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price">
            <Input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
              placeholder="42000"
            />
          </Field>
          <Field label="Built-up area (sq.ft)">
            <Input
              type="number"
              min={0}
              value={form.size}
              onChange={(event) => set("size", event.target.value)}
              placeholder="1100"
            />
          </Field>
          <Field label="Bedrooms">
            <Input
              type="number"
              min={0}
              value={form.beds}
              onChange={(event) => set("beds", event.target.value)}
              placeholder="2"
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              type="number"
              min={0}
              value={form.baths}
              onChange={(event) => set("baths", event.target.value)}
              placeholder="2"
            />
          </Field>
          <Field label="Floor">
            <Input
              value={form.floor}
              onChange={(event) => set("floor", event.target.value)}
              placeholder="4th"
            />
          </Field>
          <Field label="Furnishing">
            <Select
              value={form.furnished}
              onValueChange={(value) => set("furnished", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FURNISHED.map((option) => (
                  <SelectItem key={option} value={option}>
                    <span className="capitalize">
                      {option.replace("-", " ")}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Available from">
            <Input
              type="date"
              value={form.availableFrom}
              onChange={(event) => set("availableFrom", event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Amenities"
          hint="Visitors can filter on all of these, so only tick what is genuinely offered."
        >
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => {
              const active = form.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    set(
                      "amenities",
                      active
                        ? form.amenities.filter((item) => item !== amenity)
                        : [...form.amenities, amenity],
                    )
                  }
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/30 hover:bg-accent/50",
                  )}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </Field>
      </Card>

      <Card className="gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Location</h2>
          <Button type="button" variant="outline" size="sm" onClick={locate}>
            <LocateFixedIcon />
            Use my location
          </Button>
        </div>

        <Field label="Address">
          <Input
            required
            value={form.address}
            onChange={(event) => set("address", event.target.value)}
            placeholder="Connaught Place, New Delhi"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Latitude">
            <Input
              required
              type="number"
              step="0.000001"
              value={form.lat}
              onChange={(event) => set("lat", event.target.value)}
            />
          </Field>
          <Field label="Longitude">
            <Input
              required
              type="number"
              step="0.000001"
              value={form.lng}
              onChange={(event) => set("lng", event.target.value)}
            />
          </Field>
        </div>

        <div className="h-72 overflow-hidden rounded-xl border">
          <PropertyMap
            properties={[]}
            center={[Number(form.lat) || 28.6139, Number(form.lng) || 77.209]}
            className="size-full"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          The pin is placed from the coordinates above. GeoJSON order is
          longitude first — the form takes latitude and longitude separately so
          you cannot transpose them.
        </p>
      </Card>

      <div className="flex justify-end gap-2 border-t pt-6">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          <SaveIcon />
          {save.isPending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}

export default function ListingEditorPage() {
  const { id } = useParams();
  return <ListingForm propertyId={id} />;
}
