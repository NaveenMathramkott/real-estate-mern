type Bag = Record<string, unknown> | null | undefined;

function asBag(value: unknown): Bag {
  return value && typeof value === "object" ? (value as Bag) : null;
}

/** Read a nested path, returning `undefined` instead of throwing. */
export function pick<T = unknown>(
  source: unknown,
  ...path: string[]
): T | undefined {
  let current: unknown = source;
  for (const key of path) {
    const bag = asBag(current);
    if (!bag) return undefined;
    current = bag[key];
  }
  return current as T | undefined;
}

/** Read a path that must contain an array; always returns a usable array. */
export function pickList<T = unknown>(source: unknown, ...path: string[]): T[] {
  const value = pick(source, ...path);
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

/** Read a path that must contain a record; always returns record or null. */
export function pickRecord<T = unknown>(
  source: unknown,
  ...path: string[]
): T | null {
  const value = pick(source, ...path);
  return value && typeof value === "object" ? (value as T) : null;
}

/** Normalise anything list-shaped (array, `null`, `undefined`) into an array. */
export function toArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

/** Pagination fields are optional in practice — fill sensible defaults. */
export function pickPagination(source: unknown) {
  const page = pick<number>(source, "page") ?? 1;
  const pages = pick<number>(source, "pages") ?? 1;
  const total = pick<number>(source, "total") ?? 0;
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pages: Number.isFinite(pages) && pages > 0 ? pages : 1,
    total: Number.isFinite(total) ? total : 0,
  };
}
/** Read a path that must contain a finite number. */
export function pickNumber(
  source: unknown,
  ...path: string[]
): number | undefined {
  const value = pick(source, ...path);
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** Turn a `{ key: count }` record into chart-ready `{ label, value }` rows. */
export function countEntries(
  record: unknown,
): { label: string; value: number }[] {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record as Record<string, unknown>)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([label, value]) => ({ label, value: value as number }));
}
