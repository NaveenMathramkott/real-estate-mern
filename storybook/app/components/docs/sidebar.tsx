import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { ThemeToggle } from "~/components/docs/theme";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { NAV_SECTIONS } from "~/content/nav";
import { headingId, type Block, type Section } from "~/content/types";
import { cn } from "~/lib/utils";

/**
 * Left column of the documentation layout.
 *
 * Purely navigational — the wordmark, search and repository status all live in
 * the top bar. The five sections are an accordion: one open at a time by
 * default, revealing that section's top-level headings. The section being read
 * is always open, so the reader never has to expand anything to see where they
 * are.
 */
export function DocsSidebar({
  sections,
  currentSlug,
  onNavigate,
}: {
  sections: Section[];
  currentSlug?: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string[]>(currentSlug ? [currentSlug] : []);

  // Follow the route: navigating to another section opens it automatically.
  useEffect(() => {
    if (!currentSlug) return;
    setOpen((current) =>
      current.includes(currentSlug) ? current : [...current, currentSlug],
    );
  }, [currentSlug]);

  return (
    <div className="bg-sidebar flex h-full flex-col">
      <nav
        aria-label="Documentation"
        className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 py-5"
      >
        <p className="text-muted-foreground px-2.5 pb-2 text-[11px] font-semibold tracking-widest uppercase">
          The build
        </p>

        <Accordion
          type="multiple"
          value={open}
          onValueChange={setOpen}
          className="gap-0"
        >
          {NAV_SECTIONS.map((item) => {
            const section = sections.find((s) => s.slug === item.slug);
            const isCurrent = currentSlug === item.slug;
            const Icon = item.icon;

            return (
              <AccordionItem key={item.slug} value={item.slug}>
                {/*
                  The entire row is the trigger — there is no separate chevron
                  button. Clicking a section both navigates to it and toggles
                  its contents, which is what makes the sidebar feel like one
                  control rather than a link with a decoration bolted on.
                */}
                <AccordionTrigger
                  onClick={() => {
                    navigate(`/docs/${item.slug}`);
                    onNavigate?.();
                  }}
                  className={cn(
                    "group/section hover:bg-sidebar-accent/60 flex h-auto w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    isCurrent &&
                      "text-sidebar-accent-foreground bg-sidebar-accent font-medium",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isCurrent ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="font-mono text-[0.7rem] text-muted-foreground">
                      {item.step}
                    </span>
                    <span className="truncate">{item.nav}</span>
                  </span>
                </AccordionTrigger>

                <AccordionContent className="px-0">
                  <SectionSubnav
                    section={section}
                    slug={item.slug}
                    onNavigate={onNavigate}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
    </div>
  );
}

function SectionSubnav({
  section,
  slug,
  onNavigate,
}: {
  section?: Section;
  slug: string;
  onNavigate?: () => void;
}) {
  // Top-level only — sub-headings live in the right-hand TOC, and duplicating
  // them here would make both columns harder to scan.
  const headings = (section?.blocks ?? []).filter(
    (block): block is Extract<Block, { t: "h2" }> => block.t === "h2",
  );

  if (!headings.length) return null;

  return (
    <ul className="mb-1 ml-[1.4rem] space-y-0.5 border-l pl-3">
      {headings.map((heading) => (
        <li key={headingId("h2", heading.text)}>
          <a
            href={`/docs/${slug}#${headingId("h2", heading.text)}`}
            onClick={onNavigate}
            className="text-muted-foreground hover:text-sidebar-accent-foreground block truncate py-1 text-[0.8rem] leading-snug transition-colors"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
}
