import * as React from "react";

import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import {
  registerToastController,
  type ToastOptions,
} from "@/store/toast-store";

const TONE: Record<
  NonNullable<ToastOptions["variant"]>,
  { border: string; accent: string }
> = {
  default: { border: "border-border", accent: "text-primary" },
  success: { border: "border-success/40", accent: "text-success" },
  warning: { border: "border-warning/40", accent: "text-warning" },
  destructive: { border: "border-destructive/40", accent: "text-destructive" },
};

/**
 * Toast host. Mounted once in the root layout: it registers a controller with
 * the imperative `toast` facade and lets gluestack's `ToastProvider` own the
 * portal, stacking and auto-dismiss timer.
 */
export function Toaster() {
  const gluestackToast = useToast();

  React.useEffect(() => {
    registerToastController({
      show: ({ title, description, variant = "default", duration }) => {
        const tone = TONE[variant];
        gluestackToast.show({
          duration: duration ?? 4500,
          avoidKeyboard: true,
          render: ({ id }) => (
            <Toast
              nativeID={id}
              className={`mx-4 w-auto max-w-[420px] flex-row items-start gap-2 rounded-xl border bg-card p-3 ${tone.border}`}
            >
              <ToastTitle className={`font-semibold ${tone.accent}`}>
                {title}
              </ToastTitle>
              {description ? (
                <ToastDescription className="text-muted-foreground text-xs">
                  {description}
                </ToastDescription>
              ) : null}
            </Toast>
          ),
        });
      },
    });

    return () => registerToastController(null);
  }, [gluestackToast]);

  return null;
}
