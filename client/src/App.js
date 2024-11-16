import React from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import { AuthContextProvider } from "./context/AuthContext";
import { SocketContextProvider } from "./context/SocketContext";

function App() {
  return (
    <AuthContextProvider>
      <SocketContextProvider>
        <AppRouter />
      </SocketContextProvider>
    </AuthContextProvider>
  );
}

export default App;
