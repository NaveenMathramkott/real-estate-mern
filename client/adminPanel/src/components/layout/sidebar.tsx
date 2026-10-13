import { ChevronsLeftIcon, LifeBuoyIcon, PanelLeftIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { navGroups } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-3 px-4">
      <div className="from-primary to-primary/60 text-primary-foreground shadow-primary/25 relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm">
        <img src="/logo.png" alt="Logo" className="h-full w-full rounded-xl" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            Tenementary
          </p>
          <p className="text-muted-foreground truncate text-xs">
            Admin console
          </p>
        </div>
      )}
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const location = useLocation();

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col border-r">
      <Brand collapsed={collapsed} />
      <Separator />

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-5">
          {navGroups.map((group) => (
            <li key={group.label}>
              {!collapsed && (
                <p className="text-sidebar-foreground/60 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
                  {group.label}
                </p>
              )}
              {collapsed && <Separator className="mb-3" />}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  const link = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </NavLink>
                  );
                  return (
                    <li key={item.to}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />
      <div className="p-3">
        {!collapsed && (
          <div className="bg-sidebar-accent mb-3 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <LifeBuoyIcon className="size-4" />
              <p className="text-xs font-medium">API documentation</p>
            </div>
            <p className="text-sidebar-foreground/60 mt-1 text-xs leading-relaxed">
              73 operations across 54 paths.
            </p>
            <a
              href="http://localhost:4000/api-docs"
              target="_blank"
              rel="noreferrer"
              className="text-sidebar-primary mt-2 inline-block text-xs font-medium hover:underline"
            >
              Open Swagger UI
            </a>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "text-sidebar-foreground/80 hover:bg-sidebar-accent w-full justify-start",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <PanelLeftIcon className="size-4" />
          ) : (
            <>
              <ChevronsLeftIcon className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
