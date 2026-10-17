import {
  CheckIcon,
  ChevronsUpDownIcon,
  LoaderIcon,
  SearchIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  /** Extra text matched by the filter but not shown as the description. */
  keywords?: string;
  icon?: React.ReactNode;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  /** How many rows to show before the list scrolls. */
  maxVisible?: number;
  id?: string;
};

/** Searchable Popover dropdown, filtered client-side so callers own fetching. Only the
 *  highlighted row is reachable, which keeps the list usable without a mouse. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
  loading = false,
  disabled = false,
  className,
  maxVisible = 8,
  id,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [rawIndex, setRawIndex] = React.useState(0);

  const selected = options.find((option) => option.value === value);

  const filtered = React.useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      [option.label, option.description, option.keywords]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query)),
    );
  }, [options, term]);

  // Clamped during render rather than in an effect: typing narrows the list
  // under the highlight, and deriving the bound keeps that in one pass.
  const activeIndex = Math.min(rawIndex, Math.max(filtered.length - 1, 0));

  // A fresh search per opening, so a leftover term never hides the list.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setTerm("");
      setRawIndex(0);
    }
  };

  const commit = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setRawIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setRawIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      const option = filtered[activeIndex];
      if (option) {
        event.preventDefault();
        commit(option);
      }
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
          onKeyDown={handleKeyDown}
        >
          <span className="truncate">
            {selected?.label ?? (loading ? "Loading…" : placeholder)}
          </span>
          {loading ? (
            <LoaderIcon className="size-4 shrink-0 opacity-50" />
          ) : (
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <div className="border-b p-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <ul
          role="listbox"
          className="max-h-60 overflow-y-auto p-1"
          style={{ maxHeight: `${maxVisible * 2.5}rem` }}
        >
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">
              {loading ? "Loading…" : emptyLabel}
            </li>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setRawIndex(index)}
                    onClick={() => commit(option)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-left transition-colors",
                      index === activeIndex ? "bg-accent" : "bg-transparent",
                    )}
                  >
                    {option.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {isSelected && <CheckIcon className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
