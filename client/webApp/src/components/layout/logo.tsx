import logo from "../../../public/logo.png";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src={logo} alt="Logo" className="size-9" />

      <span className="font-display text-xl leading-none font-medium tracking-tight">
        Tenementary
      </span>
    </span>
  );
}
