import React from "react";
import Header from "../common/header/Header";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { nav } from "../data/Data";
import Home from "../home/Home";
import Footer from "../common/footer/Footer";
import About from "../about/About";
import Pricing from "../pricing/Pricing";
import Services from "../services/Services";
import Contact from "../contact/Contact";
import ScrollToTop from "../ScrollToTop/ScrollToTop";
import LoginPage from "../Login/LoginPage";
import AuthContext from "../AuthContext/AuthContext";
import PageNotFound from "../PageNotFound/PageNotFound";
import { Suspense } from "react";
import ControlPanel from "../../ControlPanel/ControlPanel";

const Pages = () => {
  return (
    <>
      <Suspense fallback={<div style={{ height: "100vh" }}>Loading...</div>}>
        <Router>
          <ScrollToTop>
            <AuthContext.Provider value="naveen">
              <Header navListData={nav} />
              <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/about" component={About} />
                <Route exact path="/services" component={Services} />
                <Route exact path="/pricing" component={Pricing} />
                <Route exact path="/contact" component={Contact} />
                <Route exact path="/login" component={LoginPage} />
                <Route exact path="/dashboard" component={ControlPanel} />
                <Route exact path="/notFound" component={PageNotFound} />

                <Route component={PageNotFound} />
              </Switch>
              <Footer />
            </AuthContext.Provider>
          </ScrollToTop>
        </Router>
      </Suspense>
    </>
  );
};

export default Pages;
