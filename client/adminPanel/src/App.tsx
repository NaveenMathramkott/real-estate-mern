import * as React from "react";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "@/app-routes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth-store";

function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <TooltipProvider>
        <AppRoutes />
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
