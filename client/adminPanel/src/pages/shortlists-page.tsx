import {
  BellIcon,
  BookmarkIcon,
  HeartIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
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
import { favoriteApi, propertyApi, savedSearchApi } from "@/lib/api";
import { ALERT_FREQUENCIES, PROPERTY_TYPES, PURPOSES } from "@/lib/constants";
import { formatCurrency, formatRelative } from "@/lib/format";
import { pick, pickList } from "@/lib/safe";
import type {
  Favorite,
  Property,
  PropertySearchResponse,
  SavedSearch,
} from "@/lib/types";

type FavoriteProperty = Property & { favoriteId: string };

const propertyIdOf = (favorite: Favorite): string => {
  const value = favorite.propertyId;
  if (typeof value === "string") return value;
  return value?._id ?? "";
};

export default function ShortlistsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Shortlists"
        description="Your favourited listings and saved searches. Favourites are idempotent, so adding twice keeps one record."
      />
      <Panel>
        <Tabs defaultValue="favorites">
          <div className="border-b px-5 py-4">
            <TabsList>
              <TabsTrigger value="favorites">
                <HeartIcon className="size-3.5" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="searches">
                <BookmarkIcon className="size-3.5" />
                Saved searches
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="favorites" className="mt-0">
            <FavoritesTab />
          </TabsContent>
          <TabsContent value="searches" className="mt-0">
            <SavedSearchesTab />
          </TabsContent>
        </Tabs>
      </Panel>
    </div>
  );
}

function FavoritesTab() {
  const [adding, setAdding] = React.useState(false);

  const { data, error, isLoading, refetch } = useQuery<{
    favorites: Favorite[];
  }>("get|/favorites|", favoriteApi.list);

  const invalidate = () => {
    queryStore.invalidate("get|/favorites", "get|/dashboard");
  };

  const add = useMutation({
    mutationFn: (propertyId: string) => favoriteApi.add(propertyId),
    successMessage: "Added to favorites",
    invalidate,
  });

  const remove = useMutation({
    mutationFn: (propertyId: string) => favoriteApi.removeByBody(propertyId),
    successMessage: "Removed from favorites",
    invalidate,
  });

  const favorites = React.useMemo(
    () => pickList<Favorite>(data, "favorites"),
    [data],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <p className="text-muted-foreground text-sm">
          {favorites.length} favorited propert
          {favorites.length === 1 ? "y" : "ies"}
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          <PlusIcon className="size-4" />
          Add favorite
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <LoadingBlock />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="No favorites yet"
          description="Favorite a listing to keep it here and track its value."
          action={
            <Button asChild>
              <Link to="/properties">Browse listings</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {favorites.map((favorite) => {
            const populated = favorite.propertyId as FavoriteProperty;
            const propertyId = propertyIdOf(favorite);
            const property =
              typeof favorite.propertyId === "string" ? null : populated;

            return (
              <li
                key={favorite._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/properties/${propertyId}`}
                    className="truncate font-medium hover:underline"
                  >
                    {property?.title ?? "Listing"}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    {property?.address ?? propertyId} · saved{" "}
                    {formatRelative(favorite.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {property?.purpose && (
                    <Badge variant="outline" className="capitalize">
                      {property.purpose}
                    </Badge>
                  )}
                  {property?.price !== undefined && (
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(property.price, property.currency, true)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={remove.isPending}
                    aria-label="Remove favorite"
                    onClick={() => remove.mutate(propertyId)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddFavoriteDialog
        key={adding ? "open" : "closed"}
        open={adding}
        onOpenChange={setAdding}
        onSubmit={(id) => add.mutateAsync(id)}
        pending={add.isPending}
      />
    </div>
  );
}

function AddFavoriteDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (propertyId: string) => Promise<unknown>;
  pending: boolean;
}) {
  const [term, setTerm] = React.useState("");
  const [error, setError] = React.useState<string>();

  const results = useQuery<PropertySearchResponse>(
    open && term.trim().length > 1
      ? `get|/properties|${JSON.stringify({ q: term, limit: 8 })}`
      : null,
    () => propertyApi.search({ q: term, limit: 8 }),
    { enabled: open && term.trim().length > 1 },
  );

  const candidates = pickList<Property>(results.data, "properties");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a favorite</DialogTitle>
          <DialogDescription>
            Search the marketplace, then pick a listing. A unique index on user
            and property keeps it to one record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setError(undefined);
            }}
            placeholder="Search title, description or address…"
          />

          {error && (
            <div className="border-destructive/40 bg-destructive/8 text-destructive rounded-lg border px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {term.trim().length > 1
                  ? "No listings match that search."
                  : "Type at least two characters to search."}
              </p>
            ) : (
              <ul className="divide-border divide-y rounded-lg border">
                {candidates.map((property) => (
                  <li key={property._id}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={async () => {
                        try {
                          await onSubmit(property._id);
                          onOpenChange(false);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Could not add favorite",
                          );
                        }
                      }}
                      className="hover:bg-accent/40 flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:opacity-60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {property.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {property.address ?? "No address"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {formatCurrency(
                          property.price,
                          property.currency,
                          true,
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SavedSearchesTab() {
  const [creating, setCreating] = React.useState(false);
  const [resultsFor, setResultsFor] = React.useState<SavedSearch | null>(null);

  const { data, error, isLoading, refetch } = useQuery<{
    savedSearches: SavedSearch[];
  }>("get|/saved-searches|", savedSearchApi.list);

  const invalidate = () => {
    queryStore.invalidate("get|/saved-searches", "get|/dashboard");
  };

  const create = useMutation({
    mutationFn: (payload: {
      filters: Record<string, unknown>;
      alertFrequency: string;
    }) => savedSearchApi.create(payload),
    successMessage: "Search saved",
    invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => savedSearchApi.remove(id),
    successMessage: "Saved search deleted",
    invalidate,
  });

  const savedSearches = React.useMemo(
    () => pickList<SavedSearch>(data, "savedSearches"),
    [data],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <p className="text-muted-foreground text-sm">
          {savedSearches.length} saved search
          {savedSearches.length === 1 ? "" : "es"}
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <PlusIcon className="size-4" />
          Save current filters
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <LoadingBlock />
      ) : savedSearches.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title="No saved searches"
          description="Filters are validated against the search layer before they are stored."
          action={
            <Button asChild>
              <Link to="/search">Build a search</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {savedSearches.map((search) => {
            const summary = Object.entries(search.filters ?? {})
              .filter(([, value]) => value !== undefined && value !== "")
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(" · ");

            return (
              <li
                key={search._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <BookmarkIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">
                    {summary || "All active listings"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Alerts {search.alertFrequency} · last run{" "}
                    {search.lastRunAt
                      ? formatRelative(search.lastRunAt)
                      : "never"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResultsFor(search)}
                  >
                    <PlayIcon className="size-4" />
                    Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={remove.isPending}
                    aria-label="Delete saved search"
                    onClick={() => remove.mutate(search._id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CreateSavedSearchDialog
        key={creating ? "open" : "closed"}
        open={creating}
        onOpenChange={setCreating}
        onSubmit={(payload) => create.mutateAsync(payload)}
        pending={create.isPending}
      />
      <SavedSearchResultsDialog
        savedSearch={resultsFor}
        onClose={() => setResultsFor(null)}
      />
    </div>
  );
}

function CreateSavedSearchDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    filters: Record<string, unknown>;
    alertFrequency: string;
  }) => Promise<unknown>;
  pending: boolean;
}) {
  const [draft, setDraft] = React.useState(() => ({
    purpose: "all",
    type: "",
    beds: "",
    priceMin: "",
    priceMax: "",
    furnished: "",
    city: "",
    q: "",
    alertFrequency: "daily",
  }));
  const [error, setError] = React.useState<string>();

  const set = (patch: Partial<typeof draft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const numeric = (value: string) =>
    value.trim() === "" ? undefined : Number(value);

  const submit = async () => {
    setError(undefined);
    const filters: Record<string, unknown> = {
      purpose: draft.purpose === "all" ? undefined : draft.purpose,
      type: draft.type || undefined,
      beds: numeric(draft.beds),
      priceMin: numeric(draft.priceMin),
      priceMax: numeric(draft.priceMax),
      furnished: draft.furnished || undefined,
      city: draft.city || undefined,
      q: draft.q || undefined,
    };

    try {
      await onSubmit({ filters, alertFrequency: draft.alertFrequency });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the search",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save a search</DialogTitle>
          <DialogDescription>
            Filters accept the same keys as{" "}
            <span className="font-mono">GET /properties</span> and are validated
            server-side before they are stored.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="border-destructive/40 bg-destructive/8 text-destructive rounded-lg border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Select
              value={draft.purpose}
              onValueChange={(value) => set({ purpose: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
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
            <Label>Type</Label>
            <Select
              value={draft.type || "any"}
              onValueChange={(value) =>
                set({ type: value === "any" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Minimum bedrooms</Label>
            <Input
              inputMode="numeric"
              value={draft.beds}
              onChange={(event) => set({ beds: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Furnishing</Label>
            <Select
              value={draft.furnished || "any"}
              onValueChange={(value) =>
                set({ furnished: value === "any" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {["unfurnished", "semi-furnished", "furnished"].map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Min price</Label>
            <Input
              inputMode="numeric"
              value={draft.priceMin}
              onChange={(event) => set({ priceMin: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Max price</Label>
            <Input
              inputMode="numeric"
              value={draft.priceMax}
              onChange={(event) => set({ priceMax: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>City</Label>
            <Input
              value={draft.city}
              onChange={(event) => set({ city: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Free text</Label>
            <Input
              value={draft.q}
              onChange={(event) => set({ q: event.target.value })}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Alert frequency</Label>
            <Select
              value={draft.alertFrequency}
              onValueChange={(value) => set({ alertFrequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_FREQUENCIES.map((frequency) => (
                  <SelectItem
                    key={frequency}
                    value={frequency}
                    className="capitalize"
                  >
                    {frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={() => void submit()}>
            <BellIcon className="size-4" />
            Save search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SavedSearchResultsDialog({
  savedSearch,
  onClose,
}: {
  savedSearch: SavedSearch | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<PropertySearchResponse>(
    savedSearch ? `get|/saved-searches/${savedSearch._id}/results|` : null,
    () => savedSearchApi.run(savedSearch?._id ?? ""),
    { enabled: Boolean(savedSearch) },
  );

  const properties = pickList<Property>(data, "properties");
  const total = pick<number>(data, "total") ?? properties.length;

  return (
    <Dialog
      open={Boolean(savedSearch)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved search results</DialogTitle>
          <DialogDescription>
            Re-running stamps <span className="font-mono">lastRunAt</span> on
            the stored search.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingBlock className="py-10" />
        ) : error ? (
          <ErrorState message={error} />
        ) : properties.length === 0 ? (
          <EmptyState
            icon={BookmarkIcon}
            title="No matches"
            description="No active listings satisfy these filters right now."
          />
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              {total} matching listing{total === 1 ? "" : "s"}
            </p>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border">
              {properties.map((property) => (
                <li key={property._id}>
                  <Link
                    to={`/properties/${property._id}`}
                    className="hover:bg-accent/40 flex items-center gap-3 px-3 py-2.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {property.title}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {property.address ?? "No address"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatCurrency(property.price, property.currency, true)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
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
