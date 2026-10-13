import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * React key for a form dialog driven by a selected record.
 *
 * Returning a distinct value for "closed" forces a remount on both open and
 * close, so a form's `useState` initialiser re-runs and an edit dialog opens
 * pre-filled with the record being edited.
 */
export function formKey(
  target?: { _id?: string | null } | string | null,
): string {
  if (!target) return "closed";
  if (typeof target === "string") return target;
  return target._id ?? "new";
}
