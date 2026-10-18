import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

const STORAGE_KEY = "storybook:theme";

type Theme = "light" | "dark";

/**
 * Theme is applied by a tiny inline script in the document head (see
 * `ThemeScript`) so there is no flash of the wrong theme on first paint, and
 * this component only mirrors that state into React.
 */
export function ThemeScript() {
  // Dark is the product default (the mobile app's "Ivory & Emerald" scheme is
  // designed dark-first), so anything other than an explicit "light" resolves
  // to dark. The OS preference is deliberately not consulted.
  const script = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var t=s==="light"?"light":"dark";document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add("dark");}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const current = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — theme just will not persist */
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={className}
    >
      {theme === "dark" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  );
}
