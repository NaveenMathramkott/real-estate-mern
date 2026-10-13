import { cn } from "@/lib/utils";
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";
import * as React from "react";

type AlertVariant = "default" | "success" | "warning" | "destructive";

const variantStyles: Record<AlertVariant, string> = {
  default: "border-border bg-card text-card-foreground",
  success: "border-success/30 bg-success/8 text-foreground",
  warning: "border-warning/40 bg-warning/10 text-foreground",
  destructive: "border-destructive/30 bg-destructive/8 text-foreground",
};

const variantIcons: Record<AlertVariant, React.ElementType> = {
  default: InfoIcon,
  success: CheckCircle2Icon,
  warning: AlertCircleIcon,
  destructive: AlertCircleIcon,
};

const iconStyles: Record<AlertVariant, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

function Alert({
  className,
  variant = "default",
  title,
  children,
  icon,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: AlertVariant;
  title?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const Icon = variantIcons[variant];
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        "flex w-full gap-3 rounded-lg border px-4 py-3 text-sm",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <span className={cn("mt-0.5 shrink-0", iconStyles[variant])}>
        {icon ?? <Icon className="size-4" />}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <div className="text-muted-foreground text-sm leading-relaxed">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export { Alert };
