import React, { useState } from "react";
import "./header.css";
import { Link, useHistory } from "react-router-dom";
import Profile from "../../images/profile.jpg";
import { PROFILE_POPUP_LIST } from "../../data/Data";

const Header = ({ navListData }) => {
  const history = useHistory();
  const [navList, setNavList] = useState(false);
  const [profileList, setProfileList] = useState(false);
  const loggedInUser = localStorage.getItem("authenticated");
  const users = localStorage.getItem("user");
  const user = JSON.parse(users);

  const checker = (str) => {
    if (str === "logout") {
      localStorage.clear();
      history.push("/login");
      window.location.reload();
    }
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
            <>
              <div
                className="profileHeader"
                onClick={() => setProfileList(!profileList)}
              >
                <img src={Profile} alt="profile" />
                <div className="profileNameTag">
                  {user?.username.slice(0, 1).toUpperCase() +
                    user?.username
                      .slice(1, user?.username.length)
                      .toLowerCase()}
                </div>
              </div>
              <div
                className={
                  profileList ? "profilePopUpShow" : "profilePopUpHide"
                }
              >
                <ul>
                  {PROFILE_POPUP_LIST.map((list, index) => (
                    <li key={index}>
                      <Link
                        to={list.path}
                        className="popUpList"
                        onClick={() => {
                          checker(list.check);
                        }}
                      >
                        {list.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
