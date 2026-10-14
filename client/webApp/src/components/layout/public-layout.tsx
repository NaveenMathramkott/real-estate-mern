import { Outlet } from "react-router-dom";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Public shell. The sticky header is transparent over the home hero and
 * frosted everywhere else, so it reads as part of the artwork on the landing
 * page without special-casing routes.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
