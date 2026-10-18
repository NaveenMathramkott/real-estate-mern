import { Link } from "react-router";

import { cn } from "~/lib/utils";
import logo from "/public/favicon.png";

/**
 * The Tenementary mark: a stylised "T" inside a rounded building block.
 * Inline SVG so it renders identically on the server and the client.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex min-w-0 shrink items-center gap-2 sm:gap-2.5",
        className,
      )}
      aria-label="Tenementary Storybook — home"
    >
      <span className="bg-primary text-primary-foreground relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm">
        <img src={logo} className="h-8" />
      </span>
      <span className="hidden min-w-0 flex-col leading-none min-[380px]:flex">
        <span className="truncate text-[0.8rem] font-semibold tracking-tight min-[380px]:text-[0.85rem] sm:text-[0.95rem]">
          Tenementary
        </span>
        <span className="text-muted-foreground truncate font-mono text-[0.6rem] tracking-widest uppercase sm:text-[0.65rem]">
          Storybook
        </span>
      </span>
    </Link>
  );
}
