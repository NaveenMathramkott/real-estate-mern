import type { Block } from "~/content/types";
import { headingId } from "~/content/types";

export type SearchEntry = {
  sectionSlug: string;
  sectionTitle: string;
  heading: string;
  anchor: string;
  /** Short plain-text description shown under the result. */
  preview: string;
  kind: "section" | "heading";
};

function firstMeaningfulText(blocks: Block[], startIndex: number): string {
  for (let i = startIndex; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.t === "p" || block.t === "lead") {
      return block.text.replace(/[`*]/g, "");
    }
  }
  return "";
}

/**
 * Build a flat, client-side search index from the section documents. Small
 * enough (a few hundred entries) to ship inline rather than run a search
 * service, and it keeps the documentation fully static.
 */
export function buildSearchIndex(
  sections: Array<{
    slug: string;
    title: string;
    blocks: Block[];
  }>,
): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const section of sections) {
    entries.push({
      sectionSlug: section.slug,
      sectionTitle: section.title,
      heading: section.title,
      anchor: "",
      preview: firstMeaningfulText(section.blocks, 0),
      kind: "section",
    });

    section.blocks.forEach((block, index) => {
      if (block.t !== "h2" && block.t !== "h3") return;
      entries.push({
        sectionSlug: section.slug,
        sectionTitle: section.title,
        heading: block.text,
        anchor: headingId(block.t, block.text),
        preview: firstMeaningfulText(section.blocks, index + 1),
        kind: "heading",
      });
    });
  }

  return entries;
}

/** Cheap subsequence scoring: matches on word starts rank above mid-word hits. */
export function scoreEntry(entry: SearchEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const heading = entry.heading.toLowerCase();
  const section = entry.sectionTitle.toLowerCase();
  const preview = entry.preview.toLowerCase();

  let score = 0;

  if (heading === q) score += 200;
  else if (heading.startsWith(q)) score += 120;
  else if (heading.includes(q)) score += 70;

  if (section.includes(q)) score += 12;
  if (preview.includes(q)) score += 20;

  const words = heading.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) score += 30;
  }

  // Prefer section roots over headings on ties.
  if (entry.kind === "section") score += 5;

  return score;
}

export function searchIndex(
  entries: SearchEntry[],
  query: string,
  limit = 12,
): SearchEntry[] {
  if (!query.trim()) return [];
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.entry);
}
