import * as React from "react";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

/**
 * Minimal inline markup for documentation prose. Supports:
 *   `code`      -> inline code
 *   **bold**    -> strong
 *   *italic*    -> emphasis
 *   [text](url) -> internal Link when the url is a path, <a> otherwise
 *
 * Deliberately tiny — it avoids pulling a full Markdown parser into the bundle
 * while covering every construct the content files actually use.
 */
const PATTERN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }) {
  const nodes = React.useMemo(() => renderParts(text), [text]);
  return <>{nodes}</>;
}

function renderParts(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      out.push(
        <code
          key={key++}
          className="bg-muted text-foreground relative rounded border px-[0.32rem] py-[0.12rem] font-mono text-[0.82em] [overflow-wrap:anywhere]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      out.push(
        <strong key={key++} className="text-foreground font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const href = token.slice(split + 2, -1);
      out.push(
        href.startsWith("/") ? (
          <Link
            key={key++}
            to={href}
            className="text-primary font-medium underline decoration-primary/35 underline-offset-[3px] transition-colors hover:decoration-primary"
          >
            {label}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary font-medium underline decoration-primary/35 underline-offset-[3px] transition-colors hover:decoration-primary"
          >
            {label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ),
      );
    } else {
      out.push(
        <em key={key++} className="text-foreground/90 italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

/** Inline renderer with a wrapper element, used inside tables and list items. */
export function InlineText({
  text,
  as: Tag = "span",
  className,
}: {
  text: string;
  as?: React.ElementType;
  className?: string;
}) {
  return <Tag className={cn(className)}>{renderParts(text)}</Tag>;
}
