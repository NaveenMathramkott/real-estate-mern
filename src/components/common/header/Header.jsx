import React, { useState, useEffect } from "react";
import "./header.css";
import { Link } from "react-router-dom";
// import AuthContext from "../../AuthContext/AuthContext";
import Profile from "../../images/profile.jpg";
import Popup from "reactjs-popup";
import ProfilePopUpList from "../commonComp/ProfilePopUp/ProfilePopUpList";
import { PROFILE_POPUP_LIST } from "../../data/Data";

const Header = ({ navListData }) => {
  const [navList, setNavList] = useState(false);
  const loggedInUser = localStorage.getItem("authenticated");
  const users = localStorage.getItem("user");
  const user = JSON.parse(users);

  const popper = () => {
    return (
      <Popup
        trigger={(open) => (
          <div className="profileHeader">
            <img src={Profile} alt="profile" />
            <div>
              {user?.username.slice(0, 1).toUpperCase() +
                user?.username.slice(1, user?.username.length).toLowerCase()}
            </div>
          </div>
        )}
        position="bottom right"
      >
        {() => (
          <div className="profilePopUp">
            <ProfilePopUpList list={PROFILE_POPUP_LIST} />
          </div>
        )}
      </Popup>
    );
  };
  return (
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
            {navListData.map((list, index) => (
              <li key={index} onClick={() => setNavList(false)}>
                <Link to={list.path}>{list.text}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="button">
          {!loggedInUser ? (
            <Link to="/login">
              <button>
                <i className="fa fa-sign-out"></i>Login
              </button>
            </Link>
          ) : (
            popper()
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
