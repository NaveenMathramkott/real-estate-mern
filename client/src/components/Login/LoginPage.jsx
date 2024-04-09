import React, { useState } from "react";
import Form from "./Form";
import "./Form.css";
import loginImg from "../images/Login-bro.svg";

function LoginPage() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);

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
  };
  // ---------------------------------register-----------------------------------
  const handleSubmitRegister = async (e) => {
    e.preventDefault();
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
