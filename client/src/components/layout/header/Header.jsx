import React, { useContext, useEffect, useState } from "react";
import "./header.css";
import { Link, useNavigate } from "react-router-dom";
import Profile from "../../images/profile.jpg";
import { AuthContext } from "../../../context/AuthContext";

const Header = ({ navListData }) => {
  const navigate = useNavigate();
  const [navList, setNavList] = useState(false);
  const [loggedUser, setLoggedUser] = useState();
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    setLoggedUser(currentUser);
  }, [currentUser]);

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
          {!loggedUser ? (
            <Link to="/login">
              <button>SignIn</button>
            </Link>
          ) : (
            <>
              <div
                className="profileHeader"
                onClick={() => navigate("/profile")}
              >
                <img src={loggedUser?.avatar || Profile} alt="profile" />
                <div className="profileNameTag">
                  {loggedUser?.username.slice(0, 1).toUpperCase() +
                    loggedUser?.username
                      .slice(1, loggedUser?.username.length)
                      .toLowerCase()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
