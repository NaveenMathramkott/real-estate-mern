import * as React from "react";
import { Link, useNavigate } from "react-router";
import { CornerDownLeftIcon, SearchIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import {
  buildSearchIndex,
  searchIndex,
  type SearchEntry,
} from "~/components/docs/search";
import type { Section } from "~/content/types";
import { cn } from "~/lib/utils";

/**
 * Documentation search.
 *
 * The trigger is icon-only on small viewports and a full field from `sm` up,
 * which keeps the header usable on a phone without a media-query hook. The
 * index is built from the same section data the pages render, so a heading can
 * never be searchable without also existing.
 */
export function DocSearch({
  sections,
  className,
}: {
  sections: Section[];
  className?: string;
}) {
  const index = React.useMemo(() => buildSearchIndex(sections), [sections]);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = React.useMemo(
    () => searchIndex(index, query),
    [index, query],
  );

  React.useEffect(() => setActive(0), [query]);

  // "/" and "⌘K" / "Ctrl+K" both open search, matching the convention set by
  // every major docs site.
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      const isSlash = event.key === "/" && !typing;
      const isCommandK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isSlash || isCommandK) {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(entry: SearchEntry) {
    setOpen(false);
    setQuery("");
    navigate(
      `/docs/${entry.sectionSlug}${entry.anchor ? `#${entry.anchor}` : ""}`,
    );
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Search the documentation"
          className={cn(
            "text-muted-foreground hover:text-foreground hover:border-primary/40 focus-visible:ring-ring flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border bg-card text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
            // Icon-only on mobile, full field from `sm` up.
            "size-8 justify-center px-0",
            "sm:h-9 sm:w-full sm:max-w-xs sm:justify-start sm:px-3",
            "md:max-w-sm",
            className,
          )}
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="hidden flex-1 truncate text-left sm:inline">
            Search the docs…
          </span>
          <kbd className="bg-muted hidden rounded border px-1.5 font-mono text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(34rem,calc(100vw-2rem))] p-0"
      >
        <div
          className="flex items-center gap-2 border-b px-3"
          onKeyDown={onKeyDown}
        >
          <SearchIcon className="text-muted-foreground size-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections, endpoints, screens…"
            aria-label="Search the documentation"
            className="placeholder:text-muted-foreground h-11 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="text-muted-foreground bg-muted rounded border px-1.5 font-mono text-[10px]">
            ESC
          </kbd>
        </div>

        <div className="scroll-slim max-h-80 overflow-y-auto p-1.5">
          {!query.trim() && <EmptyState onPick={setQuery} />}

          {query.trim() && results.length === 0 && (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              No results for “{query}”.
            </p>
          )}

          {results.map((entry, i) => (
            <Link
              key={`${entry.sectionSlug}-${entry.anchor}-${i}`}
              to={`/docs/${entry.sectionSlug}${entry.anchor ? `#${entry.anchor}` : ""}`}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors",
                i === active ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {entry.heading}
                </span>
                <Badge variant="muted" className="ml-auto shrink-0 text-[10px]">
                  {entry.sectionTitle}
                </Badge>
              </div>
              {entry.preview && (
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {entry.preview.slice(0, 110)}
                </p>
              )}
            </Link>
          ))}

          {results.length > 0 && (
            <p className="text-muted-foreground flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px]">
              <CornerDownLeftIcon className="size-3" />
              Enter to open · ↑↓ to navigate
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SUGGESTIONS = [
  "polygon",
  "socket.io",
  "gluestack",
  "refresh token",
  "reviews",
  "saved searches",
];

function EmptyState({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div className="px-3 py-8 text-center">
      <p className="text-muted-foreground text-sm">
        Search every documented section.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onPick(term)}
            className="hover:bg-accent cursor-pointer rounded-md border px-2 py-1 font-mono text-xs text-muted-foreground transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
