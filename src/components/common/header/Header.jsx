import React, { useState } from "react";
import "./header.css";
import { nav } from "../../data/Data";
import { Link } from "react-router-dom";
import Login from "../../Login/Login";
import Popup from "reactjs-popup";
import Avatar from "../commonComp/Avatar/Avatar";

const Header = () => {
  const [navList, setNavList] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  const toggleLogin = () => {
    return (
      <div className="button flex">
        <Popup
          trigger={(open) => (
            <button className="btn1">
              <i className="fa fa-sign-out"></i> Sign In
            </button>
          )}
          position="bottom right"
        >
          {(close) => (
            <div style={{ marginTop: "10px" }}>
              <Login onClose={close} />
            </div>
          )}
        </Popup>
      </div>
    );
  };
  return (
    <>
      <header>
        <div className="container headerMainWrapper">
          <div className="toggle">
            <button onClick={() => setNavList(!navList)} className="btnBurger">
              {navList ? (
                <i className="fa fa-times"></i>
              ) : (
                <i className="fa fa-bars"></i>
              )}
            </button>
          </div>
          <div className="logo">
            <Link to="/">
              <img src="./images/Logo2_rental.png" alt="company Logo" />
            </Link>
          </div>
          <div className="nav">
            <ul className={navList ? "small" : "flex"}>
              {nav.map((list, index) => (
                <li key={index} onClick={() => setNavList(false)}>
                  <Link to={list.path}>{list.text}</Link>
                </li>
              ))}
            </ul>
          </div>

          {userLoggedIn ? (
            <div className="profileHeader">
              <Avatar />
            </div>
          ) : (
            toggleLogin()
          )}

          {/* <Link to="/AdminPanel">adminPanel</Link>
          <Link to="/UserPanel">UserPanel</Link> */}
        </div>
      </header>
    </>
  );
};

export default Header;
