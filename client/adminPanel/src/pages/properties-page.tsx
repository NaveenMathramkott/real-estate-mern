import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  Building2Icon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
  Tag,
} from "@/components/common";
import { StatusBadge } from "@/features/shared/status-badge";
import { Pagination } from "@/features/shared/widgets";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { dashboardApi, propertyApi, type PropertyFilters } from "@/lib/api";
import {
  AMENITIES,
  CURRENCIES,
  FURNISHED,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PURPOSES,
} from "@/lib/constants";
import { formatArea, formatCurrency, formatRelative } from "@/lib/format";
import type { Property, PropertySearchResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pickList, pickPagination } from "@/lib/safe";

type Filters = PropertyFilters & { status?: string; verified?: string };

const EMPTY: Filters = { limit: 20 };

export default function PropertiesPage() {
  const [filters, setFilters] = React.useState<Filters>(EMPTY);
  const [page, setPage] = React.useState(1);
  const [view, setView] = React.useState<"table" | "grid">("table");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const query: PropertyFilters = {
    ...filters,
    page,
    limit: filters.limit ?? 20,
  };
  const key = `get|/properties|${JSON.stringify(query)}`;

  const { data, error, isLoading, refetch } = useQuery<PropertySearchResponse>(
    key,
    () => propertyApi.search(query),
  );

  const properties = React.useMemo(() => {
    const list = pickList<Property>(data, "properties");
    if (!filters.status) return list;
    return list.filter((p) => p.status === filters.status);
  }, [data, filters.status]);

  const verify = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      dashboardApi.verifyProperty(id, next),
    successMessage: "Listing verification updated",
    invalidate: () => {
      queryStore.invalidate("get|/properties", "get|/dashboard");
    },
  });

  const create = useMutation({
    mutationFn: (payload: Partial<Property>) => propertyApi.create(payload),
    successMessage: "Listing created",
    invalidate: () => {
      queryStore.invalidate("get|/properties", "get|/dashboard");
    },
  });

  const update = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "limit" && value !== undefined && value !== "",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Search, verify and moderate every listing in the marketplace."
        actions={
          <>
            <div className="bg-muted hidden rounded-lg p-0.5 md:flex">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setView("table")}
                aria-label="Table view"
              >
                <ListIcon className="size-4" />
              </Button>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <LayoutGridIcon className="size-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontalIcon className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="size-4" />
              New listing
            </Button>
          </>
        }
      />

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={filters.q ?? ""}
            onChange={(event) => update({ q: event.target.value || undefined })}
            placeholder="Search title, description or address…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.purpose ?? "all"}
            onValueChange={(value) =>
              update({ purpose: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All purposes</SelectItem>
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
          <Select
            value={filters.type ?? "all"}
            onValueChange={(value) =>
              update({ type: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              update({ status: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROPERTY_STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <LoadingBlock />
      ) : properties.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Building2Icon}
            title="No listings match these filters"
            description="Adjust the filters or clear them to see the full catalogue."
            action={
              <Button variant="outline" onClick={() => setFilters(EMPTY)}>
                <RotateCcwIcon className="size-4" />
                Reset filters
              </Button>
            }
          />
        </Panel>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              onVerify={(next) => verify.mutate({ id: property._id, next })}
            />
          ))}
        </div>
      ) : (
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell className="max-w-64">
                    <Link
                      to={`/properties/${property._id}`}
                      className="flex items-center gap-2.5"
                    >
                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                        <Building2Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {property.title}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {property.address ?? "No address"}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground capitalize">
                      {property.purpose}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatCurrency(property.price, property.currency, true)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {property.beds ?? 0} bd · {property.baths ?? 0} ba ·{" "}
                    {formatArea(property.size)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge value={property.status} />
                      {property.verifiedAt && (
                        <BadgeCheckIcon className="text-success size-3.5" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatRelative(property.updatedAt ?? property.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={property.verifiedAt ? "outline" : "secondary"}
                      disabled={verify.isPending}
                      onClick={() =>
                        verify.mutate({
                          id: property._id,
                          next: !property.verifiedAt,
                        })
                      }
                    >
                      {property.verifiedAt ? "Revoke" : "Verify"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination {...pickPagination(data)} onChange={setPage} />
        </Panel>
      )}

      {/* Remounts on open so the dialog starts from the filters in effect. */}
      <FiltersDialog
        key={filtersOpen ? "open" : "closed"}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApply={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {/* Remounts on open so the form starts from a blank listing. */}
      <CreatePropertyDialog
        key={creating ? "open" : "closed"}
        open={creating}
        onOpenChange={setCreating}
        onSubmit={(payload) => create.mutateAsync(payload)}
        pending={create.isPending}
      />
    </div>
  );
}

function CreatePropertyDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Partial<Property>) => Promise<unknown>;
  pending: boolean;
}) {
  const [draft, setDraft] = React.useState(() => ({
    title: "",
    description: "",
    type: "apartment" as Property["type"],
    purpose: "rent" as Property["purpose"],
    price: "",
    currency: "INR",
    size: "",
    beds: "",
    baths: "",
    furnished: "unfurnished" as NonNullable<Property["furnished"]>,
    address: "",
    lat: "",
    lng: "",
    amenities: [] as string[],
    status: "active" as Property["status"],
  }));
  const [error, setError] = React.useState<string>();

  const set = (patch: Partial<typeof draft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const number = (value: string) =>
    value.trim() === "" ? undefined : Number(value);

  const submit = async () => {
    setError(undefined);
    const lat = number(draft.lat);
    const lng = number(draft.lng);

    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    if (lat === undefined || lng === undefined) {
      setError(
        "Location is required — GeoJSON coordinates are [lng, lat] in that order.",
      );
      return;
    }

    try {
      await onSubmit({
        title: draft.title,
        description: draft.description || undefined,
        type: draft.type,
        purpose: draft.purpose,
        price: Number(draft.price),
        currency: draft.currency,
        size: number(draft.size),
        beds: number(draft.beds),
        baths: number(draft.baths),
        furnished: draft.furnished,
        address: draft.address || undefined,
        location: { type: "Point", coordinates: [lng, lat] },
        amenities: draft.amenities,
        status: draft.status,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    }
  };

  const toggleAmenity = (amenity: string) =>
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-6xl h-11/12 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create listing</DialogTitle>
          <DialogDescription>
            You are recorded as both owner and assigned agent. Location uses
            GeoJSON <span className="font-mono">[lng, lat]</span> order.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="border-destructive/40 bg-destructive/8 text-destructive rounded-lg border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={draft.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="2 BHK apartment in Connaught Place"
            />
          </div>

          <Field label="Type">
            <Select
              value={draft.type}
              onValueChange={(value) =>
                set({ type: value as typeof draft.type })
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
          </Field>

          <Field label="Purpose">
            <Select
              value={draft.purpose}
              onValueChange={(value) =>
                set({ purpose: value as typeof draft.purpose })
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
          </Field>

          <Field label="Price">
            <Input
              inputMode="numeric"
              value={draft.price}
              onChange={(event) => set({ price: event.target.value })}
              placeholder="42000"
            />
          </Field>

          <Field label="Currency">
            <Select
              value={draft.currency}
              onValueChange={(value) => set({ currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Bedrooms">
            <Input
              inputMode="numeric"
              value={draft.beds}
              onChange={(event) => set({ beds: event.target.value })}
            />
          </Field>

          <Field label="Bathrooms">
            <Input
              inputMode="numeric"
              value={draft.baths}
              onChange={(event) => set({ baths: event.target.value })}
            />
          </Field>

          <Field label="Carpet area (sq.ft)">
            <Input
              inputMode="numeric"
              value={draft.size}
              onChange={(event) => set({ size: event.target.value })}
            />
          </Field>

          <Field label="Furnishing">
            <Select
              value={draft.furnished}
              onValueChange={(value) =>
                set({ furnished: value as typeof draft.furnished })
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
          </Field>

          <Field label="Initial status">
            <Select
              value={draft.status}
              onValueChange={(value) =>
                set({ status: value as typeof draft.status })
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
          </Field>

          <Field label="Coordinates" className="sm:col-span-2">
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={draft.lat}
                onChange={(event) => set({ lat: event.target.value })}
                placeholder="lat 28.6139"
              />
              <Input
                inputMode="decimal"
                value={draft.lng}
                onChange={(event) => set({ lng: event.target.value })}
                placeholder="lng 77.2090"
              />
            </div>
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <Input
              value={draft.address}
              onChange={(event) => set({ address: event.target.value })}
              placeholder="Connaught Place, New Delhi"
            />
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={draft.description}
              onChange={(event) => set({ description: event.target.value })}
              rows={3}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </Field>

          <Field label="Amenities" className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {AMENITIES.map((amenity) => {
                const active = draft.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs capitalize transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={() => void submit()}>
            Create listing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({
  property,
  onVerify,
}: {
  property: Property;
  onVerify: (next: boolean) => void;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="bg-muted/60 relative flex h-32 items-center justify-center">
        <div className="grid-dots absolute inset-0 opacity-50" />
        <Building2Icon className="text-muted-foreground relative size-8" />
        {property.verifiedAt && (
          <Badge variant="success" className="absolute top-3 right-3">
            <BadgeCheckIcon className="size-3" />
            Verified
          </Badge>
        )}
        <StatusBadge
          value={property.status}
          className="absolute top-3 left-3"
        />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <Link
            to={`/properties/${property._id}`}
            className="line-clamp-1 font-medium hover:underline"
          >
            {property.title}
          </Link>
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {property.address ?? "No address"}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency(property.price, property.currency, true)}
          </span>
          <div className="flex gap-1">
            {property.type && <Tag>{property.type}</Tag>}
            <Tag>{property.purpose}</Tag>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span>{property.beds ?? 0} beds</span>
          <span>·</span>
          <span>{property.baths ?? 0} baths</span>
          <span>·</span>
          <span>{formatArea(property.size)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/properties/${property._id}`}>
              Open
              <ArrowUpRightIcon className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant={property.verifiedAt ? "ghost" : "secondary"}
            size="sm"
            onClick={() => onVerify(!property.verifiedAt)}
          >
            {property.verifiedAt ? "Revoke" : "Verify"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FiltersDialog({
  open,
  onOpenChange,
  filters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (next: Filters) => void;
}) {
  const [draft, setDraft] = React.useState<Filters>(filters);

  const set = (patch: Partial<Filters>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const numeric = (value: string) =>
    value === "" ? undefined : Number(value.replace(/\D/g, ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advanced filters</DialogTitle>
          <DialogDescription>
            All filters are combined by the API and sent as query parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <Input
              value={draft.city ?? ""}
              onChange={(event) => set({ city: event.target.value })}
              placeholder="New Delhi"
            />
          </Field>
          <Field label="Minimum bedrooms">
            <Input
              inputMode="numeric"
              value={draft.beds ?? ""}
              onChange={(event) => set({ beds: numeric(event.target.value) })}
              placeholder="2"
            />
          </Field>
          <Field label="Min price">
            <Input
              inputMode="numeric"
              value={draft.priceMin ?? ""}
              onChange={(event) =>
                set({ priceMin: numeric(event.target.value) })
              }
              placeholder="20000"
            />
          </Field>
          <Field label="Max price">
            <Input
              inputMode="numeric"
              value={draft.priceMax ?? ""}
              onChange={(event) =>
                set({ priceMax: numeric(event.target.value) })
              }
              placeholder="80000"
            />
          </Field>
          <Field label="Furnishing">
            <Select
              value={draft.furnished ?? "all"}
              onValueChange={(value) =>
                set({ furnished: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {FURNISHED.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Radius search (metres)">
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={draft.lat ?? ""}
                onChange={(event) => set({ lat: Number(event.target.value) })}
                placeholder="lat 28.61"
              />
              <Input
                inputMode="decimal"
                value={draft.lng ?? ""}
                onChange={(event) => set({ lng: Number(event.target.value) })}
                placeholder="lng 77.21"
              />
              <Input
                inputMode="numeric"
                value={draft.radius ?? ""}
                onChange={(event) =>
                  set({ radius: numeric(event.target.value) })
                }
                placeholder="m"
                className="max-w-20"
              />
            </div>
          </Field>
          <Field
            label="Draw-area polygon (JSON ring)"
            className="sm:col-span-2"
          >
            <Input
              value={draft.polygon ?? ""}
              onChange={(event) =>
                set({ polygon: event.target.value || undefined })
              }
              placeholder="[[77.19,28.60],[77.23,28.60],[77.23,28.63],[77.19,28.60]]"
            />
            <p className="text-muted-foreground text-xs">
              The ring must be closed — repeat the first point last.
            </p>
          </Field>
          <Field label="Per page" className="sm:col-span-2">
            <Select
              value={String(draft.limit ?? 20)}
              onValueChange={(value) => set({ limit: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} results
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDraft(EMPTY)}>
            <RotateCcwIcon className="size-4" />
            Clear
          </Button>
          <Button onClick={() => onApply(draft)}>Apply filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
