import { create } from "zustand";

type Theme = "light" | "dark";

type UiState = {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
};

const THEME_KEY = "tap:theme";
const SIDEBAR_KEY = "tap:sidebar";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: readTheme(),
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === "true",
  mobileNavOpen: false,

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return { sidebarCollapsed: next };
    }),

  setMobileNav: (open) => set({ mobileNavOpen: open }),
}));

applyTheme(readTheme());
