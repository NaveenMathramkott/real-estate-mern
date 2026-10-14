import { create } from "zustand";

export type ToastVariant = "default" | "success" | "destructive" | "warning";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastState = {
  toasts: Toast[];
  push: (
    toast: Omit<Toast, "id" | "variant" | "duration"> &
      Partial<Pick<Toast, "variant" | "duration">>,
  ) => string;
  dismiss: (id: string) => void;
};

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${++counter}`;
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-3),
        {
          id,
          variant: "default",
          duration: 4500,
          ...toast,
        },
      ],
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  show: (
    t: Omit<Toast, "id" | "variant" | "duration"> &
      Partial<Pick<Toast, "variant" | "duration">>,
  ) => useToastStore.getState().push(t),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToastStore
      .getState()
      .push({ title, description, variant: "destructive", duration: 6000 }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description }),
};
