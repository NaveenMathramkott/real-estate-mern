export type ToastVariant = "default" | "success" | "destructive" | "warning";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults to 4500. */
  duration?: number;
};

export type ToastController = {
  show: (options: ToastOptions) => void;
};

/**
 * Imperative toast facade. Screens and stores call `toast.success(...)` from
 * event handlers and mutation callbacks, which are not React render functions,
 * so the hook-based gluestack API is wrapped here. `<Toaster />` registers the
 * real controller on mount.
 */
let controller: ToastController | null = null;

export function registerToastController(next: ToastController | null) {
  controller = next;
}

function show(options: ToastOptions) {
  controller?.show(options);
}

export const toast = {
  show,
  success: (title: string, description?: string) =>
    show({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    show({ title, description, variant: "destructive", duration: 6000 }),
  warning: (title: string, description?: string) =>
    show({ title, description, variant: "warning" }),
  info: (title: string, description?: string) =>
    show({ title, description, variant: "default" }),
};
