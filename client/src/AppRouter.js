import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./components/home/Home";
import About from "./components/about/About";
import Pricing from "./components/pricing/Pricing";
import Services from "./components/services/Services";
import Contact from "./components/contact/Contact";
import { Layout } from "./components/layout/Layout";
import PageNotFound from "./components/PageNotFound/PageNotFound";
import LoginForm from "./components/Login/LoginForm";

function AppRouter() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <PageNotFound />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/about",
          element: <About />,
        },
        {
          path: "/services",
          element: <Services />,
        },
        {
          path: "/pricing",
          element: <Pricing />,
        },
        {
          path: "/contact",
          element: <Contact />,
        },
        {
          path: "/login",
          element: <LoginForm />,
        },
        {
          path: "/notFound",
          element: <PageNotFound />,
        },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default AppRouter;
