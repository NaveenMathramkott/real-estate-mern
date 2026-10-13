import {
  toast,
  useToastStore,
  type Toast,
  type ToastVariant,
} from "@/store/toast-store";

export function useToast() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return { toasts, dismiss, toast };
}

export type { Toast, ToastVariant };
