import { Outlet, useLocation } from "react-router-dom";

import { SidebarContent } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export function AppShell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  return (
    <div className="bg-background flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>

      <Dialog open={mobileNavOpen} onOpenChange={setMobileNav}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 h-svh w-64 max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-0 sm:max-w-64"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <SidebarContent onNavigate={() => setMobileNav(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div
            key={location.pathname}
            className="animate-in-up mx-auto w-full max-w-[1400px]"
          >
            {status === "loading" ? (
              <div className="space-y-6">
                <Skeleton className="h-9 w-64" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-72 rounded-xl" />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
