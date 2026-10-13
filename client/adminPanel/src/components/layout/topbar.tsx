import {
  BellIcon,
  Building2Icon,
  CommandIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@/hooks/use-query";
import { notificationApi, searchApi } from "@/lib/api";
import { initials } from "@/lib/format";
import type { Suggestion } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

function GlobalSearch() {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [debounced, setDebounced] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data } = useQuery(
    debounced.length >= 2 ? `get|/search/suggest|q=${debounced}` : null,
    () => searchApi.suggest(debounced),
    { enabled: debounced.length >= 2 },
  );

  const suggestions: Suggestion[] = data?.suggestions ?? [];

  const go = (suggestion: Suggestion) => {
    setOpen(false);
    setQuery("");
    if (suggestion.type === "property" && suggestion.propertyId) {
      navigate(`/properties/${suggestion.propertyId}`);
    } else if (suggestion.type === "area" && suggestion.areaId) {
      navigate(`/areas/${suggestion.areaId}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion.label)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-muted-foreground w-full max-w-sm justify-start gap-2 font-normal sm:w-72"
      >
        <SearchIcon className="size-4" />
        <span className="hidden flex-1 text-left sm:inline">
          Search anything…
        </span>
        <kbd className="bg-muted hidden items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-flex">
          <CommandIcon className="size-3" />K
        </kbd>
      </Button>

      <DialogContent className="top-[12%] translate-y-0 gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global search</DialogTitle>
          <DialogDescription>
            Search areas, listings and cities
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-4">
          <SearchIcon className="text-muted-foreground size-4" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search listings, areas, cities…"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="scrollbar-thin max-h-80 overflow-y-auto p-2">
          {debounced.length < 2 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Type at least two characters to search.
            </p>
          ) : suggestions.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              No matches for “{debounced}”.
            </p>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                type="button"
                onClick={() => go(suggestion)}
                className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors"
              >
                <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Building2Icon className="text-muted-foreground size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {suggestion.label}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {suggestion.address ?? suggestion.type}
                  </p>
                </div>
                <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
                  {suggestion.type}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotificationsBell() {
  const navigate = useNavigate();
  const { data } = useQuery("get|/notifications|", () =>
    notificationApi.list({ limit: 8 }),
  );
  const items = data?.notifications ?? [];
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/notifications")}
        >
          <BellIcon className="size-4" />
          {unread > 0 && (
            <span className="bg-destructive absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Notifications</TooltipContent>
    </Tooltip>
  );
}

function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg p-1 pr-2 transition-colors"
        >
          <div className="from-primary to-primary/60 text-primary-foreground flex size-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold">
            {initials(user?.email)}
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="max-w-32 truncate text-sm font-medium">
              {user?.email ?? "Guest"}
            </p>
            <p className="text-muted-foreground text-xs capitalize">
              {user?.role ?? "—"}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <p className="text-muted-foreground text-xs capitalize">
            Role: {user?.role}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <UserIcon className="size-4" />
          My profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleTheme}>
          {theme === "dark" ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void logout().then(() => navigate("/login", { replace: true }));
          }}
        >
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const notifications = useQuery("get|/notifications|", () =>
    notificationApi.list({ limit: 8 }),
  );
  const latest = notifications.data?.notifications?.[0];

  return (
    <header className="bg-background/85 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation"
      >
        <MenuIcon className="size-4" />
      </Button>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5">
        {latest && (
          <span className="text-muted-foreground hidden max-w-56 truncate text-xs xl:inline">
            {latest.payload?.preview ?? latest.type}
          </span>
        )}
        <Separator orientation="vertical" className="mx-1 h-6" />
        <NotificationsBell />
        <AccountMenu />
      </div>
    </header>
  );
}
