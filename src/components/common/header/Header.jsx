import React, { useState, useContext } from "react";
import "./header.css";
import { Link } from "react-router-dom";
import AuthContext from "../../AuthContext/AuthContext";

const Header = ({ navListData }) => {
  const [navList, setNavList] = useState(false);

  const love = useContext(AuthContext);

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
          <button>
            <i className="fa fa-sign-out"></i>Login
          </button>
          {/* <Popup
            trigger={(open) => <div>{btnName}</div>}
            position="bottom right"
          >
            {(close) => (
              <div className="loginFormRender">
                <Form
                  onClose={close}
                  handleChange={handleChange}
                  handleSubmitRegister={handleSubmitRegister}
                  handleSubmitLogin={handleSubmitLogin}
                  userLoggedIn={userLoggedIn}
                />
              </div>
            )}
          </Popup> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
