import React from "react";
import "./Form.css";
import Login from "./Login";
import Register from "./Register";
import loginImg from "../images/Login-bro.svg";

function LoginForm() {
  const loggedUser = localStorage.getItem("user");
  const [userLogged, setUserLogged] = React.useState(false);

  return (
    <div className="loginPageWrapper">
      <div className="loginWrapper">
        {!userLogged ? (
          <Login setUserLogged={setUserLogged} loggedUser={loggedUser} />
        ) : (
          <Register setUserLogged={setUserLogged} loggedUser={loggedUser} />
        )}
      </div>
      <img src={loginImg} alt={loginImg} />
    </div>
  );
}

export default LoginForm;
