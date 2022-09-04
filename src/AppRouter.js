import React, { useState } from "react";
import Pages from "./components/pages/Pages";

function AppRouter() {
  const [isLogged, setIsLogged] = useState(false);

  return <>{!isLogged && <Pages />}</>;
}

export default AppRouter;
