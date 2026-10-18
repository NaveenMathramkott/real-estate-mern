/**
 * Content model for the Storybook.
 *
 * Every documentation page is a `Doc` — a list of typed `Block`s rendered by
 * `<BlockRenderer>`. Headings are pulled out of the block list to build the
 * right-hand "On this page" table of contents, so page structure and TOC can
 * never drift apart.
 */

import { slugify as slug } from "~/lib/utils";

export type Heading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type Block =
  | { t: "p"; text: string }
  | { t: "lead"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "code"; lang?: string; title?: string; code: string }
  | {
      t: "table";
      columns: string[];
      rows: string[][];
      caption?: string;
      /** Wrap the table in a horizontally scrollable region (default true). */
      scroll?: boolean;
    }
  | {
      t: "cards";
      items: Array<{
        title: string;
        text: string;
        href?: string;
        icon?: string;
        badge?: string;
      }>;
      cols?: 1 | 2 | 3;
    }
  | {
      t: "image";
      src: string;
      caption: string;
      alt?: string;
      /**
       * `wide` fills the content column and aligns with the body text.
       * `phone` uses the same frame and left edge, but a handset width, so a
       * portrait capture does not dominate the page.
       */
      size?: "wide" | "phone";
    }
  | {
      t: "callout";
      kind: "info" | "tip" | "warn" | "danger";
      title?: string;
      text: string;
    }
  | { t: "steps"; items: Array<{ title: string; text: string }> }
  | {
      t: "fields";
      items: Array<{
        name: string;
        type: string;
        required?: boolean;
        description: string;
        default?: string;
      }>;
    }
  | {
      t: "endpoints";
      items: Array<{
        method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
        path: string;
        description: string;
        auth?: string;
      }>;
    }
  | {
      t: "screenshotGrid";
      items: Array<{ src: string; caption: string; alt?: string }>;
    }
  | { t: "hr" }
  | { t: "spacer"; size?: "sm" | "md" | "lg" };

export type Section = {
  slug: string;
  title: string;
  /** Short label used in the left sidebar. */
  nav: string;
  /** One-line description shown in the sidebar and section index. */
  summary: string;
  /** Ordinal chip, e.g. "01". */
  step: string;
  icon: string;
  blocks: Block[];
};

export type Doc = Section;

export function isHeadingBlock(
  block: Block,
): block is Extract<Block, { t: "h2" | "h3" }> {
  return block.t === "h2" || block.t === "h3";
}

/** Extract the TOC for a document from its h2/h3 blocks. */
export function extractHeadings(blocks: Block[]): Heading[] {
  return blocks.filter(isHeadingBlock).map((block) => ({
    id: headingId(block.t, block.text),
    text: block.text,
    level: block.t === "h2" ? 2 : 3,
  }));
}

/** Stable heading anchor, prefixing with the level so h2/h3 never collide. */
export function headingId(level: "h2" | "h3", text: string) {
  return `${level}-${slug(text)}`;
}

/**
 * Collect every h2 of a document. Used to paginate long backend pages into
 * separately addressable routes so the sidebar stays scannable.
 */
export function splitByH2(blocks: Block[]) {
  const sections: Array<{ id: string; title: string; blocks: Block[] }> = [];
  let current: { id: string; title: string; blocks: Block[] } | null = null;

  for (const block of blocks) {
    if (block.t === "h2") {
      if (current) sections.push(current);
      current = {
        id: headingId("h2", block.text),
        title: block.text,
        blocks: [],
      };
      continue;
    }
    if (!current) {
      current = { id: "intro", title: "", blocks: [] };
    }
    current.blocks.push(block);
  }

  if (current) sections.push(current);
  return sections;
}
