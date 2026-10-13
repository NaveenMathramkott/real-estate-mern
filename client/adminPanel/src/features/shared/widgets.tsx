import {
  TrendingDownIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  tone = "primary",
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  tone?: "primary" | "success" | "warning" | "muted";
  loading?: boolean;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
              tones[tone],
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {trend.value >= 0 ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
          {hint && (
            <span className="text-muted-foreground truncate text-xs">
              {hint}
            </span>
          )}
        </div>
      )}
      <div className="from-primary/0 via-primary/5 to-primary/0 pointer-events-none absolute inset-x-0 -bottom-12 h-24 bg-gradient-to-t opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total?: number;
  onChange: (page: number) => void;
}) {
  if (!pages || pages < 1) return null;
  const window = 2;
  const start = Math.max(1, page - window);
  const end = Math.min(pages, page + window);
  const numbers: number[] = [];
  for (let i = start; i <= end; i += 1) numbers.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-5 py-3 sm:flex-row">
      <p className="text-muted-foreground text-xs">
        Page <span className="font-medium">{page}</span> of{" "}
        <span className="font-medium">{pages}</span>
        {total !== undefined && (
          <>
            {" "}
            · {total.toLocaleString("en-IN")} record
            {total === 1 ? "" : "s"}
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {start > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(1)}
              >
                1
              </Button>
              {start > 2 && (
                <span className="text-muted-foreground px-1">…</span>
              )}
            </>
          )}
          {numbers.map((n) => (
            <Button
              key={n}
              variant={n === page ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => onChange(n)}
            >
              {n}
            </Button>
          ))}
          {end < pages && (
            <>
              {end < pages - 1 && (
                <span className="text-muted-foreground px-1">…</span>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(pages)}
              >
                {pages}
              </Button>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  variant = "destructive",
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "destructive" | "default";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            className={cn(
              variant === "destructive" && "bg-destructive text-white",
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function VerifyToggle({
  verified,
  onChange,
  disabled,
  label = "Verified",
}: {
  verified: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Switch
        checked={verified}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
      <span
        className={cn(
          "text-xs font-medium",
          verified ? "text-success" : "text-muted-foreground",
        )}
      >
        {verified ? "Verified" : "Unverified"}
      </span>
    </label>
  );
}

export function CountBar({
  items,
  total,
  emptyLabel = "No data yet",
}: {
  items: { label: string; value: number; color?: string }[];
  total?: number;
  emptyLabel?: string;
}) {
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0);
  const palette = [
    "bg-primary",
    "bg-primary/70",
    "bg-success",
    "bg-warning",
    "bg-destructive",
    "bg-muted-foreground/50",
  ];

  if (sum === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {items
          .filter((item) => item.value > 0)
          .map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "h-full rounded-full transition-all",
                item.color ?? palette[index % palette.length],
              )}
              style={{ width: `${(item.value / sum) * 100}%` }}
              title={`${item.label}: ${item.value}`}
            />
          ))}
      </div>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                item.color ?? palette[index % palette.length],
              )}
            />
            <span className="text-muted-foreground capitalize">
              {item.label}
            </span>
            <span className="ml-auto font-medium tabular-nums">
              {item.value}
            </span>
            <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
              {Math.round((item.value / sum) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MeterRow({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className="font-medium tabular-nums">{display ?? value}</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
