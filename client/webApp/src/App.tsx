import * as React from "react";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "@/app-routes";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth-store";

function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // Resolve the session before the first paint so role-gated routes do not
  // briefly render their signed-out variant.
  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <ErrorBoundary label="The site failed to start">
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
