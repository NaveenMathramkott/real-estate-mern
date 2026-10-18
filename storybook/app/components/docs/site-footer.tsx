import { HeartIcon, LinkedinIcon, GlobeIcon } from "lucide-react";

import { REPO_URL } from "~/lib/site";
import { cn } from "~/lib/utils";

const AUTHOR = {
  name: "NMS",
  website: "https://naveenmathramkott.vercel.app",
  websiteLabel: "Portfolio",
  linkedin: "https://www.linkedin.com/in/naveenmathramkott",
  linkedinLabel: "LinkedIn",
};

/**
 * The site footer.
 *
 * One component for both the homepage and the documentation pages, so the
 * attribution and outbound links never drift between them. `width` lets the
 * docs pages align the footer to their full three-column measure while the
 * homepage keeps its narrower marketing container.
 */
export function SiteFooter({
  width = "wide",
  note,
}: {
  width?: "wide" | "narrow";
  note?: string;
}) {
  return (
    <footer className="border-border bg-muted/20 mt-auto border-t">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4 px-5 py-8 text-sm sm:px-8 lg:flex-row lg:items-center lg:px-10",
          width === "wide" ? "max-w-[110rem]" : "max-w-6xl",
        )}
      >
        {/* Attribution */}
        <p className="text-muted-foreground">
          {note ?? "Free to use and adapt for learning."}{" "}
          <span className="text-foreground">
            Made with
            <HeartIcon
              aria-hidden
              className="text-primary mx-1.5 inline size-3.5 fill-current align-[-2px]"
            />
            <span className="sr-only">love</span>
            by <span className="font-medium">{AUTHOR.name}</span>
          </span>
        </p>

        {/* Outbound links */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:ml-auto">
          <a
            href={AUTHOR.website}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            {AUTHOR.websiteLabel}
          </a>

          <a
            href={AUTHOR.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            {AUTHOR.linkedinLabel}
          </a>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
