import {
  ClockIcon,
  LocateFixedIcon,
  PencilIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Pagination,
} from "@/components/common";
import { FilterPanel } from "@/components/search/filter-panel";
import { PropertyMap } from "@/components/property/property-map";
import {
  ActiveFilterChips,
  PropertyResultsGrid,
  ResultCount,
  SortMenu,
  ViewToggle,
} from "@/components/search/property-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { propertyApi, savedSearchApi, searchApi } from "@/lib/api";
import { DEFAULT_CENTER } from "@/lib/constants";
import { pluralise } from "@/lib/format";
import type { PropertyMapBounds } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  filtersToParams,
  useSearchStore,
  type SearchFilters,
} from "@/store/search-store";
import { cn } from "@/lib/utils";

type SearchMode = "filters" | "commute";

/** Reads the URL on first render so shared links reproduce a search exactly. */
function useHydrateFiltersFromUrl() {
  const [params, setParams] = useSearchParams();
  const hydrated = React.useRef(false);
  const setFilters = useSearchStore((s) => s.setFilters);

  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const patch: Partial<SearchFilters> = {};
    const purpose = params.get("purpose");
    if (purpose === "rent" || purpose === "buy") patch.purpose = purpose;

    const q = params.get("q");
    if (q) patch.q = q;

    const city = params.get("city");
    if (city) patch.city = city;

    const type = params.get("type");
    if (type) patch.type = type.split(",").filter(Boolean);

    const furnished = params.get("furnished");
    if (furnished) patch.furnished = furnished.split(",").filter(Boolean);

    const beds = params.get("beds");
    if (beds && !Number.isNaN(Number(beds))) patch.beds = Number(beds);

    for (const key of ["priceMin", "priceMax"] as const) {
      const value = params.get(key);
      if (value && !Number.isNaN(Number(value))) patch[key] = Number(value);
    }

    if (Object.keys(patch).length > 0) setFilters(patch);
    // Hydration only runs once; later param changes flow store -> URL below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect the filter set back into the URL, replace-only so the back button
  // still leaves the page instead of stepping through every keystroke.
  React.useEffect(() => {
    return useSearchStore.subscribe((state) => {
      const next = new URLSearchParams();
      const { filters } = state;
      if (filters.q) next.set("q", filters.q);
      if (filters.purpose) next.set("purpose", filters.purpose);
      if (filters.city) next.set("city", filters.city);
      if (filters.type?.length) next.set("type", filters.type.join(","));
      if (filters.beds) next.set("beds", String(filters.beds));
      if (filters.priceMin) next.set("priceMin", String(filters.priceMin));
      if (filters.priceMax) next.set("priceMax", String(filters.priceMax));
      setParams(next, { replace: true });
    });
  }, [setParams]);
}

function SaveSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const filters = useSearchStore((s) => s.filters);
  const [frequency, setFrequency] = React.useState("daily");

  const create = useMutation({
    mutationFn: () =>
      savedSearchApi.create({
        filters: filters as unknown as Record<string, unknown>,
        alertFrequency: frequency,
      }),
    successMessage: "Search saved",
    onSuccess: () => onOpenChange(false),
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Save this search</DialogTitle>
          <DialogDescription>
            We will re-run these filters on your schedule and tell you what is
            new.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Saved searches need an account so they can be tied to you.
            </p>
            <DialogFooter>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/login", {
                    state: { from: window.location.pathname },
                  });
                }}
              >
                Sign in to save
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="bg-surface-soft max-h-40 space-y-1.5 overflow-y-auto rounded-lg border p-3 text-xs">
              {Object.entries(filters)
                .filter(([, value]) => value !== undefined && value !== "")
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground w-24 shrink-0 capitalize">
                      {key}
                    </span>
                    <span className="truncate">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <Label>Alert me</Label>
              <div className="grid grid-cols-2 gap-2">
                {["off", "daily", "weekly", "instant"].map((option) => (
                  <label
                    key={option}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm capitalize transition-colors",
                      frequency === option
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:border-primary/30",
                    )}
                  >
                    <Checkbox
                      checked={frequency === option}
                      onCheckedChange={() => setFrequency(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Save search"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CommuteSearch() {
  const filters = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const [origin, setOrigin] = React.useState<{
    lat: number;
    lng: number;
  } | null>(
    filters.lat && filters.lng ? { lat: filters.lat, lng: filters.lng } : null,
  );
  const [minutes, setMinutes] = React.useState(20);

  const run = useMutation({
    mutationFn: () =>
      searchApi.commute({
        lat: origin!.lat,
        lng: origin!.lng,
        minutes,
        speedKph: 30,
      }),
    onSuccess: (data) => {
      setFilters({
        lat: data.origin.lat,
        lng: data.origin.lng,
        radius: data.radiusMetres,
      });
    },
    successMessage: "Commute area ready",
  });

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setOrigin({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Where are you travelling from?</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 justify-start"
            onClick={locate}
          >
            <LocateFixedIcon />
            {origin
              ? `${origin.lat.toFixed(3)}, ${origin.lng.toFixed(3)}`
              : "Use my location"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          We derive a reachable radius from your travel budget at 30 km/h.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Travel budget: {minutes} minutes</Label>
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 45].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMinutes(option)}
              className={cn(
                "cursor-pointer rounded-lg border py-2 text-sm font-medium transition-all",
                minutes === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/30",
              )}
            >
              {option}m
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!origin || run.isPending}
        onClick={() => run.mutate()}
      >
        <ClockIcon />
        {run.isPending ? "Working out the area…" : "Search this commute area"}
      </Button>
    </div>
  );
}

export default function SearchPage() {
  useHydrateFiltersFromUrl();
  const [params] = useSearchParams();
  const filters = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const setView = useSearchStore((s) => s.setView);
  const storeView = useSearchStore((s) => s.view);

  const [mode, setMode] = React.useState<SearchMode>(
    params.get("mode") === "commute" ? "commute" : "filters",
  );
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [drawMode, setDrawMode] = React.useState(false);
  const [draftPolygon, setDraftPolygon] = React.useState<[number, number][]>(
    filters.polygon ?? [],
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeIdFromMap, setActiveIdFromMap] = React.useState<string | null>(
    null,
  );
  const [bounds, setBounds] = React.useState<PropertyMapBounds | null>(null);
  const [viewOverride, setViewOverride] = React.useState<ViewOverride>(null);

  const paramsForApi = filtersToParams(filters);
  const cacheKey = `get|/properties|${JSON.stringify(paramsForApi)}`;

  const { data, isLoading, isValidating, error, refetch } = useQuery(
    cacheKey,
    () => propertyApi.search(paramsForApi),
    { enabled: !filters.polygon?.length },
  );

  const properties = React.useMemo(() => {
    if (filters.polygon?.length) return [];
    return data?.properties ?? [];
  }, [data, filters.polygon]);

  const view: ViewOverride = viewOverride ?? storeView;

  const mapCenter: [number, number] =
    filters.lat && filters.lng ? [filters.lat, filters.lng] : DEFAULT_CENTER;

  const runPolygonSearch = () => {
    const ring = [...draftPolygon];
    // The API rejects unclosed rings — close it here rather than surfacing a 400.
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      ring.push(first);
    }
    setFilters({ polygon: ring });
    setDrawMode(false);
  };

  const searchThisArea = (next: PropertyMapBounds) => {
    const centreLat = (next.south + next.north) / 2;
    const centreLng = (next.west + next.east) / 2;
    // Diagonal of the viewport approximates the visible radius.
    const radius = Math.round(
      Math.hypot(
        (next.north - next.south) * 111_320,
        (next.east - next.west) *
          111_320 *
          Math.cos((centreLat * Math.PI) / 180),
      ) / 2,
    );
    setBounds(next);
    setFilters({
      lat: centreLat,
      lng: centreLng,
      radius: Math.min(radius, 50_000),
      polygon: undefined,
    });
  };

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const activePropertyId = activeId ?? activeIdFromMap;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="font-display text-2xl leading-none font-medium tracking-tight sm:text-3xl">
              {filters.purpose === "buy" ? "Homes for sale" : "Homes for rent"}
            </h1>
            <ResultCount
              total={total}
              isLoading={isLoading}
              isValidating={isValidating}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontalIcon />
              Filters
            </Button>
            <SortMenu />
            <ViewToggle />
            {filters.lat && filters.lng && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    lat: undefined,
                    lng: undefined,
                    radius: undefined,
                    polygon: undefined,
                  })
                }
              >
                <XIcon />
                Clear location
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ActiveFilterChips onSaveSearch={() => setSaveOpen(true)} />
          <Badge variant="muted" className="hidden gap-1.5 sm:inline-flex">
            <SearchIcon className="size-3" />
            {pluralise(total, "match", "matches")}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ------------------------------------------------ filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1 pb-8 scrollbar-thin">
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as SearchMode)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="filters" className="flex-1">
                  Filters
                </TabsTrigger>
                <TabsTrigger value="commute" className="flex-1">
                  Commute
                </TabsTrigger>
              </TabsList>
              <TabsContent value="filters" className="mt-5">
                <FilterPanel />
              </TabsContent>
              <TabsContent value="commute" className="mt-5">
                <CommuteSearch />
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        {/* ------------------------------------------------------ results */}
        <div className="min-w-0">
          <div
            className={cn(
              "grid gap-6",
              view === "map" && "xl:grid-cols-1",
              view === "split" && "xl:grid-cols-[1fr_1.05fr]",
            )}
          >
            <div className={cn("min-w-0 space-y-5")}>
              {error && (
                <ErrorState message={error} onRetry={() => void refetch()} />
              )}

              {!error && filters.polygon?.length ? (
                <PolygonResults />
              ) : !error && view === "map" ? (
                <div className="h-[70vh] overflow-hidden rounded-2xl border">
                  <PropertyMap
                    properties={properties}
                    center={mapCenter}
                    bounds={viewOverride ? bounds : null}
                    onSearchHere={searchThisArea}
                    drawMode={drawMode ? "draw" : "none"}
                    polygon={draftPolygon}
                    onPolygonChange={setDraftPolygon}
                    className="size-full"
                    showSearchHere
                  />
                </div>
              ) : (
                <PropertyResultsGrid
                  properties={properties}
                  isLoading={isLoading}
                  columns={view === "split" ? 2 : 3}
                  emptyState={
                    <EmptyState
                      icon={SearchIcon}
                      title="Nothing matches those filters"
                      description="Try widening the price range or clearing a filter or two."
                      action={
                        <Button
                          variant="outline"
                          onClick={() =>
                            setFilters({
                              priceMin: undefined,
                              priceMax: undefined,
                              beds: undefined,
                              type: undefined,
                              furnished: undefined,
                              amenities: undefined,
                            })
                          }
                        >
                          Reset filters
                        </Button>
                      }
                    />
                  }
                />
              )}

              {!error && !filters.polygon?.length && view !== "map" && (
                <Pagination
                  page={filters.page ?? 1}
                  pages={pages}
                  onPage={(page) => {
                    setFilters({ page });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}
            </div>

            {/* ------------------------------------------------ map panel */}
            {view !== "list" && !filters.polygon?.length && (
              <div
                className={cn(
                  "relative",
                  view === "map"
                    ? "hidden"
                    : "sticky top-24 hidden h-[calc(100dvh-8rem)] xl:block",
                )}
              >
                <PropertyMap
                  properties={properties}
                  center={mapCenter}
                  bounds={viewOverride ? bounds : null}
                  activeId={activePropertyId}
                  onMarkerClick={setActiveId}
                  onMarkerHover={setActiveIdFromMap}
                  onBoundsChange={setBounds}
                  drawMode={drawMode ? "draw" : "none"}
                  polygon={draftPolygon}
                  onPolygonChange={setDraftPolygon}
                  radius={
                    filters.lat && filters.lng && filters.radius
                      ? {
                          lat: filters.lat,
                          lng: filters.lng,
                          metres: filters.radius,
                        }
                      : null
                  }
                  onSearchHere={searchThisArea}
                  showSearchHere
                  className="size-full overflow-hidden rounded-2xl border"
                />

                <div className="absolute right-3 bottom-3 z-[500] flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={drawMode ? "default" : "outline"}
                    onClick={() => {
                      if (drawMode) {
                        setDrawMode(false);
                        setDraftPolygon([]);
                      } else {
                        setDrawMode(true);
                        setDraftPolygon([]);
                      }
                    }}
                  >
                    <PencilIcon />
                    {drawMode ? "Cancel" : "Draw area"}
                  </Button>

                  {drawMode && draftPolygon.length > 2 && (
                    <Button size="sm" onClick={runPolygonSearch}>
                      Search this area
                    </Button>
                  )}

                  {filters.polygon?.length ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFilters({ polygon: undefined })}
                    >
                      <Trash2Icon />
                      Clear area
                    </Button>
                  ) : null}
                </div>

                {drawMode && (
                  <div className="bg-card absolute top-3 left-3 z-[500] max-w-[16rem] rounded-lg border p-3 text-xs shadow-md">
                    <p className="font-medium">Drawing mode</p>
                    <p className="text-muted-foreground mt-1">
                      Click the map to add points. At least three are needed,
                      and the ring is closed automatically.
                    </p>
                    {draftPolygon.length > 0 && (
                      <Button
                        variant="ghost"
                        className="mt-2 h-6 px-2 text-xs"
                        onClick={() => setDraftPolygon([])}
                      >
                        Undo all
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile map toggle */}
          {view !== "list" && (
            <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center xl:hidden">
              <div className="bg-card flex items-center gap-1 rounded-full border p-1 shadow-lg">
                <Button
                  size="sm"
                  variant={view === "split" ? "default" : "ghost"}
                  onClick={() => {
                    setView("split");
                    setViewOverride(null);
                  }}
                >
                  List
                </Button>
                <Button
                  size="sm"
                  variant={view === "map" ? "default" : "ghost"}
                  onClick={() => {
                    setView("map");
                    setViewOverride("map");
                  }}
                >
                  Map
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <FilterPanel className="pt-2" />
        </SheetContent>
      </Sheet>

      <SaveSearchDialog open={saveOpen} onOpenChange={setSaveOpen} />
    </div>
  );
}

type ViewOverride = "list" | "map" | "split" | null;

/** Polygon results come from `POST /search/polygon`, not the list endpoint. */
function PolygonResults() {
  const filters = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const setView = useSearchStore((s) => s.setView);

  const { data, isLoading, error } = useQuery(
    filters.polygon
      ? `post|/search/polygon|${JSON.stringify(filters.polygon)}`
      : null,
    () => searchApi.polygon(filters.polygon!),
    { enabled: Boolean(filters.polygon) },
  );

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingBlock label="Searching inside your area…" />;

  return (
    <div className="space-y-5">
      {data?.stats && (
        <div className="bg-surface-soft grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
          <Stat label="Matches" value={String(data.total)} />
          <Stat label="Average" value={data.stats.avgPrice} currency />
          <Stat label="Lowest" value={data.stats.minPrice} currency />
          <Stat label="Highest" value={data.stats.maxPrice} currency />
        </div>
      )}
      <PropertyResultsGrid properties={data?.properties ?? []} />
      <Button
        variant="outline"
        onClick={() => {
          setFilters({ polygon: undefined });
          setView("list");
        }}
      >
        <Trash2Icon />
        Clear drawn area
      </Button>
    </div>
  );
}

function Stat({
  label,
  value,
  currency,
}: {
  label: string;
  value: string | number;
  currency?: boolean;
}) {
  const formatted =
    typeof value === "number"
      ? new Intl.NumberFormat("en-IN", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value)
      : value;
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-[11px] tracking-wider uppercase">
        {label}
      </p>
      <p className="font-display text-lg leading-none font-medium tabular">
        {currency ? `₹` : ""}
        {formatted}
      </p>
    </div>
  );
}
