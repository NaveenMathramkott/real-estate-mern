import React from "react";
import Pages from "./components/pages/Pages";
import { registerAuth, loginAuth } from "./Service/authService";

function AppRouter() {
  const [formValue, setFormValue] = React.useState({
    name: "",
    email: "",
    password: "",
    successMsgReg: "",
    successMsgLog: "",
    successful: false,
  });

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    loginAuth({ username: formValue.name, password: formValue.password })
      .then((res) => {
        console.log(res);
        setFormValue({
          successMsg: res.data.message,
        });
      })
      .catch((error) => console.log(error));
  };

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
          successful: true,
        });
      })
      .catch((error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        setFormValue({
          successMsgReg: resMessage,
          successful: false,
        });
      });
  };
  const handleChange = (event) => {
    setFormValue({
      ...formValue,
      [event.target.name]: event.target.value,
    });
  };
  return <Pages />;
}

export default AppRouter;
