import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2Icon className={cn("size-4 animate-spin", className)} />;
}

export function LoadingBlock({
  className,
  label = "Loading…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-20",
        className,
      )}
    >
      <Spinner className="text-primary size-5" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
        <AlertCircleIcon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Could not load this</p>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="bg-accent text-primary flex size-12 items-center justify-center rounded-full">
          <Icon className="size-5" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-lg font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm text-balance">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Editorial section header — an eyebrow, a serif title and optional lede. Used
 * down the whole marketing side so the vertical rhythm stays consistent.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-2")}>
        {eyebrow && (
          <p className="text-primary flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
            <span className="bg-primary/60 h-px w-6" />
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground text-[0.98rem] leading-relaxed text-pretty">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function KeyValue({
  label,
  children,
  className,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase">
        {Icon && <Icon className="size-3" />}
        {label}
      </span>
      <span className="text-sm font-medium break-words">{children}</span>
    </div>
  );
}

export function RatingStars({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star;
          const half = !filled && rounded >= star - 0.5;
          return (
            <span
              key={star}
              className={cn(
                "relative inline-block leading-none",
                size === "sm" ? "text-xs" : "text-sm",
              )}
            >
              <span className="text-border">★</span>
              {(filled || half) && (
                <span
                  className="text-gold absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span
        className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}
      >
        {value > 0 ? value.toFixed(1) : "New"}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-muted-foreground text-xs">({count})</span>
      )}
      <span className="sr-only">
        {value} out of 5 from {count ?? 0} reviews
      </span>
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onChange(star)}
          className="cursor-pointer p-0.5 transition-transform hover:scale-115"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <span
            className={cn(
              "text-xl leading-none transition-colors",
              star <= value ? "text-gold" : "text-border",
            )}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
  className,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (pages <= 1) return null;

  // Window the page list around the current page so long result sets stay usable.
  const windowed: (number | "gap")[] = [];
  const push = (value: number | "gap") => windowed.push(value);
  const start = Math.max(1, Math.min(page - 1, pages - 2));
  const end = Math.min(pages, start + 2);
  for (let i = start; i <= end; i += 1) {
    if (i > start && i - start > 1) push("gap");
    push(i);
  }
  if (start > 1) windowed.unshift("gap");
  if (end < pages) windowed.push("gap");

  return (
    <nav className={cn("flex items-center justify-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      {windowed.map((entry, index) =>
        entry === "gap" ? (
          <span
            key={`gap-${index}`}
            className="text-muted-foreground px-1.5 text-sm"
          >
            …
          </span>
        ) : (
          <Button
            key={entry}
            variant={entry === page ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => onPage(entry)}
            className="tabular"
          >
            {entry}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return <Skeleton className="h-28 w-full rounded-xl" />;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; to?: string }[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs",
        className,
      )}
    >
      {items.map((item, index) => (
        <span
          key={`${item.label}-${index}`}
          className="flex items-center gap-1.5"
        >
          {item.to ? (
            <Link
              to={item.to}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {index < items.length - 1 && <span aria-hidden>/</span>}
        </span>
      ))}
    </nav>
  );
}
