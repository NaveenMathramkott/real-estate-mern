import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { LoadingBlock } from "@/components/common";
import { setUnauthorizedHandler } from "@/lib/api-client";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { useFavoritesStore } from "@/store/favorites-store";
import type { Role } from "@/lib/types";

const HomePage = lazy(() => import("@/pages/home-page"));
const SearchPage = lazy(() => import("@/pages/search-page"));
const PropertyDetailPage = lazy(() => import("@/pages/property-detail-page"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));
const AreasPage = lazy(() =>
  import("@/pages/areas-page").then((m) => ({ default: m.AreasPage })),
);
const AreaDetailPage = lazy(() =>
  import("@/pages/areas-page").then((m) => ({ default: m.AreaDetailPage })),
);
const BuildingsPage = lazy(() =>
  import("@/pages/directory-pages").then((m) => ({ default: m.BuildingsPage })),
);
const BuildingDetailPage = lazy(() =>
  import("@/pages/directory-pages").then((m) => ({
    default: m.BuildingDetailPage,
  })),
);
const AgenciesPage = lazy(() =>
  import("@/pages/directory-pages").then((m) => ({ default: m.AgenciesPage })),
);
const AgencyDetailPage = lazy(() =>
  import("@/pages/directory-pages").then((m) => ({
    default: m.AgencyDetailPage,
  })),
);
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ListingsPage = lazy(() => import("@/pages/listings-page"));
const ListingEditorPage = lazy(
  () => import("@/features/listings/listing-form"),
);
const ListingMediaPage = lazy(
  () => import("@/features/listings/media-manager"),
);
const InquiriesPage = lazy(() => import("@/pages/inquiries-page"));
const MessagesPage = lazy(() => import("@/pages/messages-page"));
const NotificationsPage = lazy(() => import("@/pages/notifications-page"));
const SavedPage = lazy(() =>
  import("@/pages/saved-page").then((m) => ({ default: m.SavedPage })),
);
const SavedSearchesPage = lazy(() =>
  import("@/pages/saved-page").then((m) => ({
    default: m.SavedSearchesPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/pages/profile-page").then((m) => ({ default: m.ProfilePage })),
);
const ReviewsPage = lazy(() =>
  import("@/pages/profile-page").then((m) => ({ default: m.ReviewsPage })),
);
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

/** Blocks a route for signed-out visitors, remembering where they were headed. */
function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return <LoadingBlock className="min-h-dvh" />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Narrows a route to one set of roles; anything else falls back to the dashboard. */
function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const LISTER_ROLES: Role[] = ["agent", "landlord", "admin"];

/** Loads the shortlist once per session so hearts are correct everywhere. */
function ShortlistLoader() {
  const user = useAuthStore((s) => s.user);
  const load = useFavoritesStore((s) => s.load);

  useEffect(() => {
    if (user) void load();
    else useFavoritesStore.getState().clear();
  }, [user, load]);

  return null;
}

function RouteFallback() {
  return <LoadingBlock className="py-32" />;
}

export default function AppRoutes() {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.setState({ user: null, status: "unauthenticated" });
      useFavoritesStore.getState().clear();
      toast.error("Session expired", "Please sign in again to continue.");
    });
  }, []);

  return (
    <>
      <ShortlistLoader />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ------------------------------------------- public surface */}
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="areas" element={<AreasPage />} />
            <Route path="areas/:id" element={<AreaDetailPage />} />
            <Route path="buildings" element={<BuildingsPage />} />
            <Route path="buildings/:id" element={<BuildingDetailPage />} />
            <Route path="agencies" element={<AgenciesPage />} />
            <Route path="agencies/:id" element={<AgencyDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* ---------------------------------------- authenticated area */}
          {/*
            These sit at the top level rather than under a pathless group so
            that the URLs people share ("/listings", "/inquiries") stay short
            and match the dashboard links that point at them.
          */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="saved-searches" element={<SavedSearchesPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:id" element={<MessagesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Listing management is for agents, landlords and admins only. */}
            <Route
              path="listings"
              element={
                <RequireRole roles={LISTER_ROLES}>
                  <ListingsPage />
                </RequireRole>
              }
            />
            <Route
              path="listings/new"
              element={
                <RequireRole roles={LISTER_ROLES}>
                  <ListingEditorPage />
                </RequireRole>
              }
            />
            <Route
              path="listings/:id/edit"
              element={
                <RequireRole roles={LISTER_ROLES}>
                  <ListingEditorPage />
                </RequireRole>
              }
            />
            <Route
              path="listings/:id/media"
              element={
                <RequireRole roles={LISTER_ROLES}>
                  <ListingMediaPage />
                </RequireRole>
              }
            />
            <Route
              path="inquiries"
              element={
                <RequireRole roles={LISTER_ROLES}>
                  <InquiriesPage />
                </RequireRole>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
