import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingBlock } from "@/components/common";
const AgenciesPage = lazy(() => import("@/pages/agencies-page"));
const AnalyticsPage = lazy(() => import("@/pages/analytics-page"));
const AreasPage = lazy(() => import("@/pages/areas-page"));
const BuildingsPage = lazy(() => import("@/pages/buildings-page"));
const ConversationsPage = lazy(() => import("@/pages/conversations-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const InquiriesPage = lazy(() => import("@/pages/inquiries-page"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const NotificationsPage = lazy(() => import("@/pages/notifications-page"));
const PropertiesPage = lazy(() => import("@/pages/properties-page"));
const PropertyDetailPage = lazy(() => import("@/pages/property-detail-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const ReviewsPage = lazy(() => import("@/pages/reviews-page"));
const SearchPage = lazy(() => import("@/pages/search-page"));
const UsersPage = lazy(() => import("@/pages/users-page"));
import { setUnauthorizedHandler } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.setState({ user: null, status: "unauthenticated" });
      toast.error("Session expired", "Please sign in again to continue.");
    });
  }, []);

  if (status === "idle" || status === "loading") {
    return <LoadingBlock className="min-h-screen" />;
  }
  if (status === "unauthenticated" || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }
  return <>{children}</>;
}

function RouteFallback() {
  return <LoadingBlock className="py-32" />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="agencies" element={<AgenciesPage />} />
          <Route path="areas" element={<AreasPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
