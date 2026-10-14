import {
  HeartIcon,
  ListChecksIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PropertyCardSkeleton,
} from "@/components/common";
import { PropertyCard } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { favoriteApi, savedSearchApi } from "@/lib/api";
import { formatRelative, pluralise } from "@/lib/format";
import { useFavoriteAction } from "@/hooks/use-favorite-action";
import { useFavoritesStore } from "@/store/favorites-store";
import type { Favorite, Property, SavedSearch } from "@/lib/types";
import { cn } from "@/lib/utils";

function asProperty(value: Favorite["propertyId"]): Property | null {
  return typeof value === "string" ? null : value;
}

export function SavedPage() {
  const onFavorite = useFavoriteAction();
  const load = useFavoritesStore((s) => s.load);

  const { data, isLoading, error, refetch } = useQuery(
    "get|/favorites|page=saved",
    () => favoriteApi.list(),
  );

  // Refresh the shared shortlist ids whenever the page is opened.
  React.useEffect(() => {
    void load();
  }, [load]);

  const favorites = data?.favorites ?? [];
  const properties = favorites
    .map((favorite) => asProperty(favorite.propertyId))
    .filter((property): property is Property => Boolean(property));

  const totalValue = properties.reduce(
    (sum, property) => sum + (property.price ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
          Saved
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isLoading
            ? "Loading your shortlist…"
            : `${pluralise(properties.length, "listing")} · worth ₹${Math.round(
                totalValue,
              ).toLocaleString("en-IN")}`}
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!isLoading && !error && properties.length === 0 && (
        <EmptyState
          icon={HeartIcon}
          title="Nothing saved yet"
          description="Tap the heart on any listing to keep it here."
          action={
            <Button asChild>
              <Link to="/search">Browse listings</Link>
            </Button>
          }
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard
            key={property._id}
            property={property}
            onFavoriteClick={() => void onFavorite(property._id)}
          />
        ))}
      </div>
    </div>
  );
}

export function SavedSearchesPage() {
  const navigate = useNavigate();
  const remove = useMutation({
    mutationFn: (search: SavedSearch) => savedSearchApi.remove(search._id),
  });

  const run = useMutation({
    mutationFn: (search: SavedSearch) => savedSearchApi.run(search._id),
  });

  const goToResults = (search: SavedSearch) => {
    const params = new URLSearchParams();
    const filters = search.filters as Record<string, unknown>;
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    navigate(`/search?${params.toString()}`);
  };

  const { data, isLoading, error, refetch } = useQuery(
    "get|/saved-searches",
    () => savedSearchApi.list(),
  );
  const searches = data?.savedSearches ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
          Saved searches
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Stored filters with an alert frequency. Run one to see what matches
          right now.
        </p>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!isLoading && !error && searches.length === 0 && (
        <EmptyState
          icon={ListChecksIcon}
          title="No saved searches"
          description="Narrow a search and use “Save this search” to keep it here."
          action={
            <Button asChild>
              <Link to="/search">Start a search</Link>
            </Button>
          }
        />
      )}

      <ul className="space-y-3">
        {searches.map((search) => {
          const filters = Object.entries(search.filters).filter(
            ([, value]) =>
              value !== undefined && value !== null && value !== "",
          );
          return (
            <Card key={search._id} className="gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {filters.slice(0, 4).map(([key, value]) => (
                    <Badge key={key} variant="muted" className="capitalize">
                      {key}:{" "}
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </Badge>
                  ))}
                  {filters.length === 0 && (
                    <span className="text-muted-foreground text-sm">
                      No filters set
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    search.alertFrequency === "off" ? "muted" : "success"
                  }
                >
                  {search.alertFrequency}
                </Badge>
              </div>

              <p className="text-muted-foreground text-xs">
                Last run{" "}
                {search.lastRunAt ? formatRelative(search.lastRunAt) : "never"}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goToResults(search)}
                >
                  <SearchIcon />
                  Open in search
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={run.isPending}
                  onClick={() => run.mutate(search)}
                >
                  {run.isPending ? "Running…" : "Run now"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("text-destructive hover:bg-destructive/10")}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(search)}
                >
                  <Trash2Icon />
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </ul>
    </div>
  );
}
