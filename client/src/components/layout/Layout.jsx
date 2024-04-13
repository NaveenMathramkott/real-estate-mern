import React from "react";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import { nav } from "../data/Data";
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Layout = () => {
  return (
    <>
      <Header navListData={nav} />
      <Outlet />
      <Footer />
    </>
  );
};
const AuthRequiredLayout = () => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return <Navigate to="/login" />;
  else {
    return (
      <>
        <Header navListData={nav} />
        <Outlet />
        <Footer />
      </>
    );
  }
};

export { Layout, AuthRequiredLayout };
