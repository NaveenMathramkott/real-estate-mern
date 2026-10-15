import {
  Building2Icon,
  ClockIcon,
  Loader2Icon,
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { useDebouncedValue } from "@/hooks/use-resettable-state";
import { searchApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { Suggestion } from "@/lib/types";
import { useSearchStore } from "@/store/search-store";
import { cn } from "@/lib/utils";

const SUGGEST_DEBOUNCE = 220;

export type HeroSearchProps = {
  className?: string;
  /** Hero copy sits above the bar and needs the transparent treatment. */
  variant?: "hero" | "compact";
};

/** Autocomplete over GET /search/suggest, debounced and cached so typing stays cheap. */
function useSuggestions(term: string) {
  const trimmed = term.trim();
  const enabled = trimmed.length >= 2;

  return useQuery<Suggestion[]>(
    enabled ? `get|/search/suggest|q=${trimmed.toLowerCase()}` : null,
    () => searchApi.suggest(trimmed).then((data) => data.suggestions ?? []),
    { enabled },
  );
}

export function HeroSearch({ className, variant = "hero" }: HeroSearchProps) {
  const navigate = useNavigate();
  const filters = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);

  const [term, setTerm] = React.useState(filters.q ?? "");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(term, SUGGEST_DEBOUNCE);

  const { data: suggestions = [], isFetching } = useSuggestions(debounced);

  // Close on outside click — the popover must not trap the visitor.
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Keyboard highlight resets when a new suggestion set arrives, handled in
  // render so the popover never paints with a stale index.
  const [cursor, setCursor] = React.useState({ term: debounced, index: 0 });
  const highlighted = cursor.term === debounced ? cursor.index : 0;
  const setHighlighted = (next: React.SetStateAction<number>) =>
    setCursor((current) => ({
      term: debounced,
      index:
        typeof next === "function"
          ? next(current.term === debounced ? current.index : 0)
          : next,
    }));

  const applySuggestion = (suggestion: Suggestion) => {
    setOpen(false);
    if (suggestion.type === "area") {
      navigate(`/areas/${suggestion.areaId}`);
      return;
    }
    if (suggestion.propertyId) {
      navigate(`/properties/${suggestion.propertyId}`);
      return;
    }
    setTerm(suggestion.label);
    setFilters({ q: suggestion.label, city: suggestion.label });
    navigate(`/search?q=${encodeURIComponent(suggestion.label)}`);
  };

  const submit = () => {
    setOpen(false);
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (filters.purpose) params.set("purpose", filters.purpose);
    navigate(`/search?${params.toString()}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((index) => {
        const next = event.key === "ArrowDown" ? index + 1 : index - 1;
        const count = suggestions.length;
        if (count === 0) return 0;
        return (next + count) % count;
      });
      return;
    }
    if (event.key === "Enter") {
      if (open && suggestions[highlighted])
        applySuggestion(suggestions[highlighted]);
      else submit();
    }
  };

  const isHero = variant === "hero";

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {/* Purpose switch — the single most decisive choice on a property site. */}
      <div
        className={cn(
          "inline-flex rounded-full border p-1",
          isHero ? "bg-card" : "bg-muted/60",
        )}
        role="tablist"
        aria-label="Listing purpose"
      >
        {(["rent", "buy"] as const).map((purpose) => {
          const active = filters.purpose === purpose;
          return (
            <button
              key={purpose}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                setFilters({ purpose: active ? undefined : purpose })
              }
              className={cn(
                "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {purpose === "rent" ? "Rent" : "Buy"}
            </button>
          );
        })}
      </div>

      <div className="relative mt-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border p-2 transition-shadow",
            isHero
              ? "bg-card shadow-md focus-within:shadow-xl"
              : "bg-card focus-within:border-primary/40",
          )}
        >
          <SearchIcon className="text-muted-foreground ml-2 size-4 shrink-0" />
          <Input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="City, neighbourhood, building or listing"
            aria-label="Search listings"
            aria-expanded={open}
            aria-controls="search-suggestions"
            className="h-11 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          />
          {term && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear"
              onClick={() => {
                setTerm("");
                setFilters({ q: undefined });
              }}
            >
              <XIcon />
            </Button>
          )}
          <Button size="lg" onClick={submit} className="shrink-0">
            Search
          </Button>
        </div>

        {open && debounced.trim().length >= 2 && (
          <div
            id="search-suggestions"
            role="listbox"
            className="bg-popover animate-in-up absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border shadow-xl"
          >
            {isFetching && suggestions.length === 0 && (
              <div className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                Searching…
              </div>
            )}
            {!isFetching && suggestions.length === 0 && (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                No matches for “{debounced}”.
              </p>
            )}
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.label}-${index}`}
                type="button"
                role="option"
                aria-selected={index === highlighted}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => applySuggestion(suggestion)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors",
                  index === highlighted ? "bg-accent" : "hover:bg-muted/60",
                )}
              >
                <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                  {suggestion.type === "area" ? (
                    <MapPinIcon className="size-4" />
                  ) : (
                    <Building2Icon className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {suggestion.label}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {suggestion.type === "area"
                      ? "Neighbourhood"
                      : `${PROPERTY_TYPE_LABELS[suggestion.type ?? ""] ?? "Listing"}${suggestion.address ? ` · ${suggestion.address}` : ""}`}
                  </span>
                </span>
                {suggestion.price !== undefined && (
                  <span className="shrink-0 text-sm font-medium tabular">
                    {formatCurrency(suggestion.price, suggestion.currency)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-2 text-xs",
          isHero ? "text-muted-foreground" : "text-muted-foreground",
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <PencilIcon className="size-3" />
          Draw an area
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="size-3" />
          Search by commute time
        </span>
        <span aria-hidden>·</span>
        <button
          type="button"
          className="cursor-pointer underline-offset-4 transition hover:text-primary hover:underline"
          onClick={() => navigate("/search")}
        >
          Advanced filters
        </button>
      </div>
    </div>
  );
}
