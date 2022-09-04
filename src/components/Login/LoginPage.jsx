import React, { useState } from "react";
import Form from "./Form";
import "./Form.css";
import loginImg from "../images/Login-bro.svg";
import { useHistory } from "react-router-dom";
import { registerAuth, loginAuth } from "../../Service/authService";
import { Redirect } from "react-router-dom";

function LoginPage() {
  const history = useHistory();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [authenticated, setAuthenticated] = useState(
    localStorage.getItem(localStorage.getItem("authenticated") || false)
  );
  const [formValue, setFormValue] = React.useState({
    name: "",
    email: "",
    password: "",
    successMsgReg: "",
    successMsgLog: "",
    successfulLog: false,
    successfulReg: false,
  });
  // -------------------------------login-------------------------------------

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    loginAuth({ username: formValue.name, password: formValue.password })
      .then((res) => {
        console.log(res);
        setFormValue({
          // successMsg: res.data.message,
          successfulLog: true,
        });

        setAuthenticated(true);
        localStorage.setItem("authenticated", true);
        history.push("/userPanel");
        window.location.reload();
      })
      .catch((error) => {
        console.log(error);
        alert(error.response.data.message);
      });
  };
  // ---------------------------------register-----------------------------------
  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    registerAuth({
      username: formValue.name,
      email: formValue.email,
      password: formValue.password,
    })
      .then((response) => {
        setFormValue({
          successMsgReg: response.data.message,
          successfulReg: true,
        });
        alert(response.data.message);
        setUserLoggedIn(true);
        history.push("/login");
        window.location.reload();
      })
      .catch((error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        alert(resMessage);
        setFormValue({
          successMsgReg: resMessage,
          successful: false,
        });
      });
  };
  // ----------------------------------handleChange----------------------------------
  const handleChange = (event) => {
    setFormValue({
      ...formValue,
      [event.target.name]: event.target.value,
    });
  };
  return (
    <div className="loginPageWrapper">
      <Form
        handleChange={handleChange}
        handleSubmitRegister={handleSubmitRegister}
        handleSubmitLogin={handleSubmitLogin}
        userLoggedIn={userLoggedIn}
      />

      <img src={loginImg} alt={loginImg} />
    </div>
  );
}

export default LoginPage;
