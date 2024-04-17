import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Pricing from "./pages/pricing/Pricing";
import Services from "./pages/services/Services";
import Contact from "./pages/contact/Contact";
import { AuthRequiredLayout, Layout } from "./components/layout/Layout";
import PageNotFound from "./pages/PageNotFound/PageNotFound";
import LoginForm from "./pages/Login/LoginForm";
import ListPage from "./pages/listPage/ListPage";
import SinglePage from "./pages/singlePage/SinglePage";
import Profile from "./pages/profile/Profile";
import {
  listPageLoader,
  singlePageLoader,
  profilePageLoader,
} from "./utils/loaders.js";

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
          path: "/list",
          element: <ListPage />,
          loader: listPageLoader,
        },
        {
          path: "/detail/:id",
          element: <SinglePage />,
          loader: singlePageLoader,
        },
        {
          path: "/notFound",
          element: <PageNotFound />,
        },
      ],
    },
    {
      path: "/",
      element: <AuthRequiredLayout />,
      children: [
        {
          path: "/profile",
          element: <Profile />,
          loader: profilePageLoader,
        },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default AppRouter;
