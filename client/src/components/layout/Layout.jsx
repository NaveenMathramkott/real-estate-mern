import React from "react";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import { nav } from "../data/Data";

const Layout = ({ children }) => {
  return (
    <>
      <Header navListData={nav} />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
