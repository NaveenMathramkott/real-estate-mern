import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** React key for a form dialog bound to a record; a distinct value per selection forces the
 *  dialog to remount, so its state initialiser re-runs and the form opens pre-filled. */
export function formKey(
  target?: { _id?: string | null } | string | null,
): string {
  if (!target) return "closed";
  if (typeof target === "string") return target;
  return target._id ?? "new";
}
