import {
  BellIcon,
  BuildingIcon,
  ChevronDownIcon,
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessagesSquareIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import * as React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useFavoritesStore } from "@/store/favorites-store";
import logo from "../../../public/logo.png";

const NAV_LINKS = [
  //   { label: "Buy", to: "/search?purpose=buy" },
  //   { label: "Rent", to: "/search?purpose=rent" },
  { label: "Properties", to: "/search" },
  { label: "Neighbourhoods", to: "/areas" },
  { label: "Buildings", to: "/buildings" },
  { label: "Agencies", to: "/agencies" },
];

/** Role-aware destinations shown in the account menu. */
function accountLinks(role?: string | null) {
  if (!role) return [];
  if (role === "agent" || role === "landlord" || role === "admin") {
    return [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboardIcon },
      { label: "My listings", to: "/listings", icon: BuildingIcon },
      { label: "Enquiries", to: "/inquiries", icon: MessagesSquareIcon },
    ];
  }
  return [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboardIcon },
    { label: "Saved", to: "/saved", icon: HeartIcon },
    { label: "My reviews", to: "/reviews", icon: SparklesIcon },
  ];
}

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = React.useState(false);
  // Held against the route it was opened on so navigating dismisses the drawer.
  const [navOpenedOn, setNavOpenedOn] = React.useState<string | null>(null);
  const mobileOpen = navOpenedOn === location.pathname;
  const setMobileOpen = (next: boolean) =>
    setNavOpenedOn(next ? location.pathname : null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const favorites = useFavoritesStore((s) => s.ids);

  const canPublish =
    user?.role === "agent" ||
    user?.role === "landlord" ||
    user?.role === "admin";
  const extraLinks = accountLinks(user?.role);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/85 border-border border-b backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Tenementary home"
        >
          <img src={logo} alt="Logo" className="size-9" />
          <span className="font-display text-lg leading-none font-medium tracking-tight">
            Tenementary
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => navigate("/search")}
            className="sm:hidden"
          >
            <SearchIcon />
          </Button>

          {user ? (
            <>
              {canPublish && (
                <Button
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/listings/new")}
                >
                  <PlusIcon />
                  List property
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                aria-label="Saved properties"
                className="relative"
                onClick={() => navigate("/saved")}
              >
                <HeartIcon />
                {favorites.length > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular">
                    {favorites.length}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                onClick={() => navigate("/notifications")}
              >
                <BellIcon />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 gap-2 px-2"
                    aria-label="Account menu"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-accent text-accent-foreground text-[11px]">
                        {initials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDownIcon className="text-muted-foreground size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{user.email}</span>
                    <Badge variant="muted" className="w-fit">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {extraLinks.map((link) => (
                    <DropdownMenuItem key={link.to} asChild>
                      <Link to={link.to}>
                        <link.icon className="size-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserIcon className="size-4" />
                      Profile & preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => void logout()}
                  >
                    <LogOutIcon className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Join free</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="lg:hidden"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
              <div className="flex h-16 items-center gap-2 border-b px-5">
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                  <BuildingIcon className="size-4" />
                </span>
                <span className="font-display text-lg font-medium">
                  Tenementary
                </span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {[...NAV_LINKS, ...extraLinks].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {canPublish && (
                  <Button
                    className="mt-2 w-full"
                    onClick={() => navigate("/listings/new")}
                  >
                    <PlusIcon />
                    List a property
                  </Button>
                )}
                <div className="mt-3 border-t pt-3">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => void logout()}
                    >
                      <LogOutIcon />
                      Sign out
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to="/login">Sign in</Link>
                      </Button>
                      <Button className="flex-1" asChild>
                        <Link to="/register">Join free</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
