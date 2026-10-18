/**
 * Repository statistics shape and formatting.
 *
 * Kept separate from `github.server.ts` because the UI components need the
 * type and the number formatter, and React Router forbids importing
 * server-only modules into client code.
 */

export type RepoStats = {
  stars: number;
  forks: number;
};

/** Compact number formatting for the header pill: 1234 -> "1.2k". */
export function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands < 10 ? thousands.toFixed(1) : Math.round(thousands)}k`;
  }
  const millions = value / 1_000_000;
  return `${millions < 10 ? millions.toFixed(1) : Math.round(millions)}m`;
}
