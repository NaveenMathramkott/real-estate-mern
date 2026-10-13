import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2Icon className={cn("size-4 animate-spin", className)} />;
}

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return <Skeleton className="h-28 w-full rounded-xl" />;
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
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 8v5M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="font-medium">Something went wrong</p>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-primary text-sm font-medium hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-secondary text-secondary-foreground inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function KeyValue({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </span>
      <span className="text-sm font-medium break-words">{children}</span>
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="leading-none font-semibold tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(contentClassName)}>{children}</div>
    </Card>
  );
}
