import { BellIcon, CheckIcon, MapIcon, Rows3Icon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyCardSkeleton, Spinner } from "@/components/common";
import { PropertyCard } from "@/components/property/property-card";
import { SORT_OPTIONS, type SortOption } from "@/lib/constants";
import { sortProperties } from "@/lib/sort-properties";
import { pluralise } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useFavoriteAction } from "@/hooks/use-favorite-action";
import {
  clearFilter,
  describeFilters,
  useSearchStore,
  type ViewMode,
} from "@/store/search-store";
import { cn } from "@/lib/utils";

export function ActiveFilterChips({
  onSaveSearch,
}: {
  onSaveSearch?: () => void;
}) {
  const filters = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const reset = useSearchStore((s) => s.reset);
  const chips = describeFilters(filters);

  if (chips.length === 0 && !onSaveSearch) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value ?? ""}`}
          type="button"
          onClick={() => setFilters(clearFilter(filters, chip.key, chip.value))}
          className="group bg-secondary text-secondary-foreground hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 pr-2 pl-3 text-xs font-medium transition-colors"
        >
          {chip.label}
          <XIcon className="text-muted-foreground group-hover:text-foreground size-3" />
        </button>
      ))}

      {chips.length > 0 && (
        // `setFilters` merges, so an empty patch would clear nothing — reset
        // the whole filter set instead.
        <button
          type="button"
          onClick={reset}
          className="text-muted-foreground hover:text-foreground cursor-pointer px-1 text-xs underline-offset-4 transition hover:underline"
        >
          Clear all
        </button>
      )}

      {onSaveSearch && chips.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveSearch}
          className="text-primary ml-auto"
        >
          <BellIcon />
          Save this search
        </Button>
      )}
    </div>
  );
}

export function SortMenu() {
  const sort = useSearchStore((s) => s.filters.sort) ?? "relevance";
  const setFilter = useSearchStore((s) => s.setFilter);
  const current = SORT_OPTIONS.find((option) => option.value === sort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {current?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => setFilter("sort", option.value as SortOption)}
          >
            {option.value === sort && <CheckIcon className="size-3.5" />}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ViewToggle({
  className,
  layout,
}: {
  className?: string;
  layout?: "responsive" | "compact";
}) {
  const view = useSearchStore((s) => s.view);
  const setView = useSearchStore((s) => s.setView);

  const options: { value: ViewMode; label: string; icon: typeof Rows3Icon }[] =
    [
      { value: "list", label: "List", icon: Rows3Icon },
      { value: "map", label: "Map", icon: MapIcon },
    ];

  return (
    <div
      className={cn(
        "bg-muted/70 hidden items-center gap-0.5 rounded-lg p-0.5 sm:flex",
        className,
        layout === "compact" && "flex",
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          onClick={() => setView(option.value)}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            view === option.value
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <option.icon className="size-3.5" />
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PropertyResultsGrid({
  properties,
  isLoading,
  emptyState,
  className,
  columns = 3,
  eager = false,
}: {
  properties: Property[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
  /** Resolve media immediately rather than on scroll; costly for a long result set. */
  eager?: boolean;
}) {
  const onFavorite = useFavoriteAction();
  const sort = useSearchStore((s) => s.filters.sort) ?? "relevance";
  const sorted = sortProperties(properties, sort);

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-5",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 xl:grid-cols-3",
          columns === 4 && "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
          className,
        )}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) return <>{emptyState}</>;

  return (
    <div
      className={cn(
        "grid gap-5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 xl:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className,
      )}
    >
      {sorted.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          onFavoriteClick={() => void onFavorite(property._id)}
          eager={eager}
        />
      ))}
    </div>
  );
}

export function ResultCount({
  total,
  isLoading,
  isValidating,
}: {
  total: number;
  isLoading?: boolean;
  isValidating?: boolean;
}) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm tabular">
      {isLoading ? "Searching…" : pluralise(total, "home")}
      {/*
        Results revalidate in the background on every visit, so the refresh is
        signalled rather than being silent — otherwise the count appears to sit
        still while new listings arrive.
      */}
      {isValidating && (
        <>
          <Spinner className="text-primary size-3" />
          <span className="text-xs">updating</span>
        </>
      )}
    </p>
  );
}
