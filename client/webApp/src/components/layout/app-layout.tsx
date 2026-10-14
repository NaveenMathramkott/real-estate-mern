import {
  BellIcon,
  Building2Icon,
  HeartIcon,
  InboxIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  UserIcon,
} from "lucide-react";
import * as React from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SiteFooter } from "@/components/layout/site-footer";
import { Logo } from "@/components/layout/logo";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationCount } from "@/features/notifications/use-notification-count";

type NavItem = {
  label: string;
  to: string;
  icon: typeof HeartIcon;
  badge?: number;
};

/**
 * Sidebar contents depend on role — a buyer gets Saved and Reviews, a lister
 * gets Listings, Media and Enquiries. `admin` is not a self-service role on the
 * public site, so it borrows the lister view.
 */
function navForRole(role: string | undefined): {
  primary: NavItem[];
  secondary: NavItem[];
} {
  const isLister = role === "agent" || role === "landlord" || role === "admin";

  const primary: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboardIcon },
    { label: "Search", to: "/search", icon: SearchIcon },
  ];

  if (isLister) {
    primary.push(
      { label: "My listings", to: "/listings", icon: Building2Icon },
      { label: "Enquiries", to: "/inquiries", icon: InboxIcon },
      { label: "Messages", to: "/messages", icon: MessageSquareIcon },
    );
  } else {
    primary.push(
      { label: "Saved", to: "/saved", icon: HeartIcon },
      { label: "Saved searches", to: "/saved-searches", icon: ListChecksIcon },
      { label: "Messages", to: "/messages", icon: MessageSquareIcon },
    );
  }

  const secondary: NavItem[] = [
    { label: "Reviews", to: "/reviews", icon: StarIcon },
    { label: "Notifications", to: "/notifications", icon: BellIcon },
    { label: "Profile", to: "/profile", icon: UserIcon },
  ];

  return { primary, secondary };
}

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge ? <Badge variant="destructive">{item.badge}</Badge> : null}
    </NavLink>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const unread = useNotificationCount();
  const { primary, secondary } = navForRole(user?.role);
  const canPublish =
    user?.role === "agent" ||
    user?.role === "landlord" ||
    user?.role === "admin";

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" onClick={onNavigate}>
        <Logo />
      </Link>

      {canPublish && (
        <Button
          onClick={() => {
            navigate("/listings/new");
            onNavigate?.();
          }}
        >
          <Building2Icon />
          New listing
        </Button>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        {primary.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <Separator className="my-3" />
        {secondary.map((item) =>
          item.to === "/notifications" ? (
            <SidebarLink
              key={item.to}
              item={{ ...item, badge: unread }}
              onNavigate={onNavigate}
            />
          ) : (
            <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {initials(user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="text-muted-foreground text-xs">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/">Back to site</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            onClick={() => void logout()}
          >
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Authenticated shell. Sidebar on desktop, a sheet on mobile, and the public
 * footer kept at the bottom so long pages still resolve.
 */
export function AppLayout() {
  const location = useLocation();
  // The drawer closes itself by becoming stale: it is only "open" while the
  // route is still the one it was opened on, so navigation dismisses it
  // without an effect.
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);
  const open = openedOn === location.pathname;
  const setOpen = (next: boolean) =>
    setOpenedOn(next ? location.pathname : null);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1">
        <aside className="border-border bg-card sticky top-0 hidden h-dvh w-64 shrink-0 border-r lg:block">
          <SidebarBody />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-border bg-background/90 sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-3 backdrop-blur lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Logo className="[&_span:last-child]:text-base" />
            <Link to="/notifications" className="ml-auto">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <BellIcon />
              </Button>
            </Link>
          </div>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export { SettingsIcon };
