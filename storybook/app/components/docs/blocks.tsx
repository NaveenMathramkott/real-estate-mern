import * as React from "react";
import { Link } from "react-router";
import {
  AlertTriangleIcon,
  InfoIcon,
  LightbulbIcon,
  OctagonAlertIcon,
} from "lucide-react";

import { Inline } from "~/components/docs/inline";
import { Badge } from "~/components/ui/badge";
import { headingId, type Block } from "~/content/types";
import { cn } from "~/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Headings                                                                  */
/* -------------------------------------------------------------------------- */

export function Heading({
  block,
}: {
  block: Extract<Block, { t: "h2" | "h3" }>;
}) {
  const id = headingId(block.t, block.text);
  const classes =
    block.t === "h2"
      ? "heading-anchor group mt-14 mb-4 scroll-m-24 border-t pt-8 text-[1.6rem] leading-tight font-semibold tracking-tight text-balance first:mt-0"
      : "heading-anchor group mt-9 mb-3 scroll-m-24 text-[1.15rem] leading-snug font-semibold tracking-tight";

  // The heading text is itself the link, so the "#" affordance must be a span.
  // Nesting an <a> inside an <a> is invalid HTML and breaks hydration.
  const Tag = block.t;

  return (
    <Tag id={id} className={classes}>
      <a href={`#${id}`} className="no-underline">
        {block.text}
        <span
          aria-hidden
          className="text-primary ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-70"
        >
          #
        </span>
      </a>
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Code                                                                      */
/* -------------------------------------------------------------------------- */

const KEYWORDS =
  /\b(import|from|export|const|let|var|function|return|await|async|class|new|if|else|for|of|in|try|catch|throw|default|type|interface|extends|true|false|null|undefined)\b/g;

function highlight(code: string, lang?: string) {
  if (lang === "bash" || lang === "sh" || lang === "env") {
    return code
      .split("\n")
      .map((line, i) => (
        <div key={i}>
          {line.startsWith("#") ? (
            <span className="tok-comment">{line}</span>
          ) : (
            shellLine(line)
          )}
        </div>
      ));
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(KEYWORDS.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(code)) !== null) {
    if (match.index > lastIndex) parts.push(code.slice(lastIndex, match.index));
    parts.push(
      <span key={`k${match.index}`} className="tok-keyword">
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length) parts.push(code.slice(lastIndex));
  return parts;
}

function shellLine(line: string) {
  const match = line.match(/^(\s*)([A-Z_]+)=(.*)$/);
  if (match) {
    return (
      <>
        {match[1]}
        <span className="tok-keyword">{match[2]}</span>=
        <span className="tok-string">{match[3]}</span>
      </>
    );
  }
  const commentAt = line.indexOf("#");
  if (commentAt > -1) {
    return (
      <>
        {line.slice(0, commentAt)}
        <span className="tok-comment">{line.slice(commentAt)}</span>
      </>
    );
  }
  return line;
}

export function CodeBlock({
  lang,
  title,
  code,
}: {
  lang?: string;
  title?: string;
  code: string;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* clipboard unavailable (insecure context) — ignore */
    }
  }

  return (
    <figure className="group my-7 overflow-hidden rounded-lg border bg-code-bg">
      {(title || lang) && (
        <figcaption className="bg-muted/60 flex items-center justify-between border-b px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">
            {title ?? lang}
          </span>
          {lang && !title && (
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase">
              {lang}
            </span>
          )}
        </figcaption>
      )}
      <div className="relative">
        <pre className="scroll-slim overflow-x-auto p-4 text-[0.82rem] leading-relaxed">
          <code className="font-mono">{highlight(code.trim(), lang)}</code>
        </pre>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="bg-background/80 hover:bg-background focus-visible:ring-ring absolute top-2 right-2 cursor-pointer rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

export function DataTable({
  columns,
  rows,
  caption,
  scroll = true,
}: {
  columns: string[];
  rows: string[][];
  caption?: string;
  scroll?: boolean;
}) {
  const table = (
    <table className="w-full min-w-[34rem] border-collapse text-sm">
      <thead>
        <tr className="bg-muted/60">
          {columns.map((col) => (
            <th
              key={col}
              scope="col"
              className="border-b px-3 py-2.5 text-left align-top text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-muted/35 transition-colors">
            {row.map((cell, j) => (
              <td
                key={j}
                className="border-border/70 border-b px-3 py-2.5 align-top leading-relaxed"
              >
                <Inline text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <figure className="my-7">
      <div
        className={cn(
          "overflow-hidden rounded-lg border",
          scroll && "scroll-slim overflow-x-auto",
        )}
      >
        {table}
      </div>
      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Endpoint reference                                                         */
/* -------------------------------------------------------------------------- */

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  POST: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PATCH: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  PUT: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function EndpointList({
  items,
}: {
  items: Extract<Block, { t: "endpoints" }>["items"];
}) {
  return (
    <ul className="my-7 space-y-1.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="bg-card hover:border-primary/40 flex flex-col gap-1.5 rounded-lg border px-3.5 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4"
        >
          <span className="flex shrink-0 items-center gap-2 sm:w-28">
            <Badge
              variant="muted"
              className={cn(
                "w-16 justify-center font-mono text-[11px] tracking-wide",
                METHOD_STYLE[item.method],
              )}
            >
              {item.method}
            </Badge>
          </span>
          <code className="text-primary min-w-0 flex-1 font-mono text-[0.82rem] break-all">
            {item.path}
          </code>
          <span className="text-muted-foreground min-w-0 flex-1 text-sm">
            <Inline text={item.description} />
          </span>
          {item.auth && (
            <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
              {item.auth}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fields table (request bodies / params)                                    */
/* -------------------------------------------------------------------------- */

export function FieldList({
  items,
}: {
  items: Extract<Block, { t: "fields" }>["items"];
}) {
  return (
    <ul className="my-7 divide-border overflow-hidden rounded-lg border">
      {items.map((field) => (
        <li key={field.name} className="bg-card px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <code className="font-mono text-[0.82rem] font-medium">
              {field.name}
            </code>
            <span className="text-muted-foreground font-mono text-[0.75rem]">
              {field.type}
            </span>
            {field.required ? (
              <Badge variant="destructive" className="text-[10px]">
                required
              </Badge>
            ) : (
              <Badge variant="muted" className="text-[10px]">
                optional
              </Badge>
            )}
            {field.default && (
              <span className="text-muted-foreground text-[0.75rem]">
                default:{" "}
                <code className="bg-muted rounded px-1 py-0.5 font-mono">
                  {field.default}
                </code>
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            <Inline text={field.description} />
          </p>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cards                                                                     */
/* -------------------------------------------------------------------------- */

export function CardGrid({
  items,
  cols = 3,
}: {
  items: Extract<Block, { t: "cards" }>["items"];
  cols?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "my-7 grid gap-3",
        cols === 1 && "sm:grid-cols-1",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item, i) => {
        const inner = (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold">{item.title}</span>
              {item.badge && (
                <Badge variant="info" className="shrink-0 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              <Inline text={item.text} />
            </p>
          </>
        );

        return item.href ? (
          <Link
            key={i}
            to={item.href}
            className="bg-card hover:border-primary/50 hover:bg-accent/40 group flex flex-col rounded-lg border p-4 transition-all"
          >
            {inner}
            <span className="text-primary mt-3 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Read more →
            </span>
          </Link>
        ) : (
          <div key={i} className="bg-card rounded-lg border p-4">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screenshots                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A screenshot with its caption.
 *
 * Every screenshot shares one frame, one caption style and one vertical rhythm,
 * and — critically — one left edge: the same edge as the body text. Earlier
 * versions broke wide images out of the column with a negative margin and
 * centred phone shots, which meant three different left edges down a single
 * page and read as an untidy list. Now `wide` and `full` both fill the content
 * column flush with the text, and `phone` is simply narrower but still flush.
 */
export function Screenshot({
  src,
  caption,
  alt,
  size = "wide",
}: {
  src: string;
  caption: string;
  alt?: string;
  size?: "wide" | "phone";
}) {
  const phone = size === "phone";

  return (
    <figure className="my-7">
      {/* Single frame, flush left, image filling it edge to edge. */}
      <div
        className={cn(
          "border-border bg-card overflow-hidden rounded-lg border shadow-sm",
          phone ? "w-[min(19rem,100%)]" : "w-full",
        )}
      >
        <img
          src={src}
          alt={alt ?? caption}
          loading="lazy"
          decoding="async"
          // Screenshots are dense; a border helps them read as UI, not prose.
          className="block w-full bg-white"
        />
      </div>

      <figcaption className="text-muted-foreground mt-3 flex gap-2.5 text-sm leading-relaxed">
        <span
          aria-hidden
          className="bg-primary/60 mt-[0.55rem] size-1.5 shrink-0 rounded-full"
        />
        <span className="max-w-prose">{caption}</span>
      </figcaption>
    </figure>
  );
}

export function ScreenshotGrid({
  items,
}: {
  items: Extract<Block, { t: "screenshotGrid" }>["items"];
}) {
  return (
    <div className="my-7 grid gap-7">
      {items.map((item) => (
        <Screenshot
          key={item.src}
          src={item.src}
          caption={item.caption}
          alt={item.alt}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Callout                                                                   */
/* -------------------------------------------------------------------------- */

const CALLOUT = {
  info: {
    icon: InfoIcon,
    cls: "border-sky-500/30 bg-sky-50/60 dark:bg-sky-950/25",
  },
  tip: {
    icon: LightbulbIcon,
    cls: "border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/25",
  },
  warn: {
    icon: AlertTriangleIcon,
    cls: "border-amber-500/35 bg-amber-50/60 dark:bg-amber-950/25",
  },
  danger: {
    icon: OctagonAlertIcon,
    cls: "border-rose-500/35 bg-rose-50/60 dark:bg-rose-950/25",
  },
} as const;

export function Callout({
  kind,
  title,
  text,
}: {
  kind: keyof typeof CALLOUT;
  title?: string;
  text: string;
}) {
  const { icon: Icon, cls } = CALLOUT[kind];
  return (
    <aside className={cn("my-7 flex gap-3 rounded-lg border-l-[3px] p-4", cls)}>
      <Icon className="mt-0.5 size-4 shrink-0 opacity-80" />
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="mb-1 font-semibold tracking-tight">{title}</p>}
        <p className="text-foreground/80">
          <Inline text={text} />
        </p>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/*  Steps                                                                     */
/* -------------------------------------------------------------------------- */

export function Steps({
  items,
}: {
  items: Extract<Block, { t: "steps" }>["items"];
}) {
  return (
    <ol className="my-7 space-y-0">
      {items.map((step, i) => (
        <li key={i} className="relative flex gap-4 pb-7 last:pb-0">
          {i < items.length - 1 && (
            <span
              aria-hidden
              className="bg-border absolute top-9 bottom-1 left-[15px] w-px"
            />
          )}
          <span className="bg-primary/10 text-primary border-primary/20 relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold">
            {i + 1}
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-semibold tracking-tight">{step.title}</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              <Inline text={step.text} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dispatcher                                                                */
/* -------------------------------------------------------------------------- */

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockItem key={i} block={block} />
      ))}
    </>
  );
}

function BlockItem({ block }: { block: Block }) {
  switch (block.t) {
    case "p":
      return (
        <p className="my-4 text-[0.95rem] leading-[1.75] text-foreground/85">
          <Inline text={block.text} />
        </p>
      );

    case "lead":
      return (
        <p className="text-muted-foreground my-5 text-lg leading-relaxed text-pretty">
          <Inline text={block.text} />
        </p>
      );

    case "h2":
    case "h3":
      return <Heading block={block} />;

    case "ul":
      return (
        <ul className="my-4 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative pl-5 text-[0.95rem] leading-[1.7] text-foreground/85 before:absolute before:top-[0.7em] before:left-0.5 before:size-1.5 before:rounded-full before:bg-primary/60"
            >
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol className="my-4 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative pl-7 text-[0.95rem] leading-[1.7] text-foreground/85"
            >
              <span className="text-primary absolute top-0 font-mono text-[0.8rem] font-semibold">
                {i + 1}.
              </span>
              <Inline text={item} />
            </li>
          ))}
        </ol>
      );

    case "code":
      return (
        <CodeBlock lang={block.lang} title={block.title} code={block.code} />
      );

    case "table":
      return (
        <DataTable
          columns={block.columns}
          rows={block.rows}
          caption={block.caption}
          scroll={block.scroll}
        />
      );

    case "cards":
      return <CardGrid items={block.items} cols={block.cols} />;

    case "image":
      return (
        <Screenshot
          src={block.src}
          caption={block.caption}
          alt={block.alt}
          size={block.size}
        />
      );

    case "screenshotGrid":
      return <ScreenshotGrid items={block.items} />;

    case "callout":
      return (
        <Callout kind={block.kind} title={block.title} text={block.text} />
      );

    case "steps":
      return <Steps items={block.items} />;

    case "fields":
      return <FieldList items={block.items} />;

    case "endpoints":
      return <EndpointList items={block.items} />;

    case "hr":
      return <hr className="my-10 border-border" />;

    case "spacer":
      return (
        <div
          className={cn(
            block.size === "sm" && "h-3",
            (!block.size || block.size === "md") && "h-6",
            block.size === "lg" && "h-12",
          )}
        />
      );

    default:
      return null;
  }
}
