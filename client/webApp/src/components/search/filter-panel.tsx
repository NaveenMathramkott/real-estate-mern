import { CheckIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  AMENITIES,
  FURNISHED,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { useResettableState } from "@/hooks/use-resettable-state";
import { useSearchStore } from "@/store/search-store";
import { cn } from "@/lib/utils";

/** Bed presets double as a segmented control rather than a numeric input. */
const BED_OPTIONS = [
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
];

/** Widest price the slider offers, in rupees. */
const PRICE_CEILING = 25_000_000;

export function FilterPanel({ className }: { className?: string }) {
  const filters = useSearchStore((s) => s.filters);
  const setFilter = useSearchStore((s) => s.setFilter);
  const setFilters = useSearchStore((s) => s.setFilters);
  const toggleArrayFilter = useSearchStore((s) => s.toggleArrayFilter);
  const reset = useSearchStore((s) => s.reset);

  // Always two-thumb, re-keyed on the committed bounds so chips and presets set
  // elsewhere in the page drag the handles with them.
  const priceKey = `${filters.priceMin ?? 0}:${filters.priceMax ?? 0}`;
  const [sliderValue, setSliderValue] = useResettableState<[number, number]>(
    () => [filters.priceMin ?? 0, filters.priceMax ?? PRICE_CEILING],
    priceKey,
  );

  const commitPrice = (value: number[]) => {
    setSliderValue([value[0], value[1]]);
  };

  const applyPrice = () => {
    const [min, max] = sliderValue;
    setFilters({
      priceMin: min > 0 ? min : undefined,
      priceMax: max < PRICE_CEILING ? max : undefined,
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-display flex items-center gap-2 text-lg font-medium">
          <SlidersHorizontalIcon className="text-primary size-4" />
          Filters
        </h2>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcwIcon />
          Reset
        </Button>
      </div>

      {/* ---------------------------------------------------------- price */}
      <div className="space-y-3">
        <Label className="text-[11px] tracking-wider uppercase">Price</Label>
        <Slider
          min={0}
          max={PRICE_CEILING}
          step={50_000}
          value={sliderValue}
          onValueChange={commitPrice}
          onValueCommit={applyPrice}
          aria-label="Price range"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            aria-label="Minimum price"
            placeholder="Min"
            defaultValue={filters.priceMin ?? ""}
            onBlur={(event) =>
              setFilter(
                "priceMin",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className="h-9"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="number"
            inputMode="numeric"
            aria-label="Maximum price"
            placeholder="Max"
            defaultValue={filters.priceMax ?? ""}
            onBlur={(event) =>
              setFilter(
                "priceMax",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className="h-9"
          />
        </div>
      </div>

      {/* ---------------------------------------------------------- beds */}
      <div className="space-y-2.5">
        <Label className="text-[11px] tracking-wider uppercase">Bedrooms</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {BED_OPTIONS.map((option) => {
            const active = filters.beds === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFilter("beds", active ? undefined : option.value)
                }
                className={cn(
                  "cursor-pointer rounded-lg border py-2 text-sm font-medium transition-all",
                  active
                    ? "border-primary bg-primary/8 text-primary"
                    : "hover:border-primary/30 hover:bg-accent/50",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------- type */}
      <div className="space-y-2.5">
        <Label className="text-[11px] tracking-wider uppercase">
          Property type
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((type) => {
            const active = filters.type?.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => toggleArrayFilter("type", type)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-primary/30 hover:bg-accent/50",
                )}
              >
                {PROPERTY_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------ furnished */}
      <div className="space-y-2.5">
        <Label className="text-[11px] tracking-wider uppercase">
          Furnishing
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {FURNISHED.map((option) => {
            const active = filters.furnished?.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => toggleArrayFilter("furnished", option)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-primary/30 hover:bg-accent/50",
                )}
              >
                {option.replace("-", " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------ amenities */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] tracking-wider uppercase">
            Amenities
          </Label>
          <span className="text-muted-foreground text-[10px]">
            all must match
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {AMENITIES.slice(0, 8).map((amenity) => {
            const checked = filters.amenities?.includes(amenity) ?? false;
            return (
              <label
                key={amenity}
                className="hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm capitalize transition-colors"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() =>
                    toggleArrayFilter("amenities", amenity)
                  }
                />
                <span className="truncate">{amenity}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------- commute */}
      <div className="space-y-3 border-t pt-5">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[11px] tracking-wider uppercase">
              Radius search
            </Label>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {filters.lat && filters.lng
                ? `Within ${((filters.radius ?? 0) / 1000).toFixed(1)} km of your pin`
                : "Set a point on the map to search around it"}
            </p>
          </div>
          <Switch
            checked={Boolean(filters.lat && filters.lng)}
            onCheckedChange={(checked) =>
              setFilters(
                checked
                  ? {
                      lat: 28.6139,
                      lng: 77.209,
                      radius: filters.radius ?? 5000,
                    }
                  : { lat: undefined, lng: undefined, radius: undefined },
              )
            }
          />
        </div>
        {filters.lat && filters.lng && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs tabular">
              <span className="text-muted-foreground">Radius</span>
              <span className="font-medium">
                {((filters.radius ?? 5000) / 1000).toFixed(1)} km
              </span>
            </div>
            <Slider
              min={500}
              max={50_000}
              step={500}
              value={[filters.radius ?? 5000]}
              onValueChange={(value) => setFilter("radius", value[0])}
              aria-label="Search radius in metres"
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- polygon */}
      <div className="space-y-2 border-t pt-5">
        <Label className="text-[11px] tracking-wider uppercase">
          Drawn area
        </Label>
        {filters.polygon?.length ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <CheckIcon className="text-primary size-3.5" />
              {filters.polygon.length} point area active
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter("polygon", undefined)}
            >
              Clear
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Use the “Draw area” tool on the map to search inside a hand-drawn
            boundary.
          </p>
        )}
      </div>

      {filters.polygon?.length ? (
        <Badge variant="success" className="w-fit">
          Polygon search active
        </Badge>
      ) : null}
    </div>
  );
}

export { PRICE_CEILING };
