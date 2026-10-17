import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

const icons = {
  default: InfoIcon,
  success: CheckCircle2Icon,
  warning: AlertCircleIcon,
  destructive: AlertCircleIcon,
};

const iconTone = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function Toaster() {
  // Reads the shared zustand store so anything can raise a toast without a hook.
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((item) => (
        <Toast key={item.id} {...item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}

function Toast({
  title,
  description,
  variant,
  duration,
  onDismiss,
}: {
  title: string;
  description?: string;
  variant: keyof typeof icons;
  duration: number;
  onDismiss: () => void;
}) {
  const Icon = icons[variant];

  React.useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "bg-popover animate-in-up pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg",
        "slide-in-from-right-4",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconTone[variant])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground cursor-pointer rounded-sm p-0.5 transition-colors"
        aria-label="Dismiss notification"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
