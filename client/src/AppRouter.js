import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
const Home = lazy(() => import("./components/home/Home"));
const About = lazy(() => import("./components/about/About"));
const Pricing = lazy(() => import("./components/pricing/Pricing"));
const Services = lazy(() => import("./components/services/Services"));
const Contact = lazy(() => import("./components/contact/Contact"));
const ScrollToTop = lazy(() => import("./components/ScrollToTop/ScrollToTop"));
const LoginPage = lazy(() => import("./components/Login/LoginPage"));
const Layout = lazy(() => import("./components/layout/Layout"));
const PageNotFound = lazy(() =>
  import("./components/PageNotFound/PageNotFound")
);

function AppRouter() {
  return (
    <Suspense fallback={<div style={{ height: "100vh" }}>Loading...</div>}>
      <Router>
        <ScrollToTop>
          <Layout>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/about" component={About} />
              <Route exact path="/services" component={Services} />
              <Route exact path="/pricing" component={Pricing} />
              <Route exact path="/contact" component={Contact} />
              <Route exact path="/login" component={LoginPage} />
              <Route exact path="/notFound" component={PageNotFound} />
              <Route component={PageNotFound} />
            </Switch>
          </Layout>
        </ScrollToTop>
      </Router>
    </Suspense>
  );
}

export default AppRouter;
