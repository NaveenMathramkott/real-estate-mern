import React, { useEffect } from "react";
import "./Login.css";
import { motion } from "framer-motion";

const axios = require("axios");

const BASE_URL = "https://sysirohub.com/rent_api";

function Login({ onClose }) {
  const [newUser, setNewUser] = React.useState(0);
  const [formValue, setFormValue] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  // const usersName = JSON.stringify({
  //   name: "John Doe",
  //   email: "sv@gmail.com",
  //   password: "12345678",
  // });

  // const handleSubmit = async () => {
  //   console.log("its a log value to test");
  //   const result = await axios.post(
  //     "https://sysirohub.com/rent_api/register",
  //     usersName,
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );

  //   console.log(result.data.data);
  //   console.log(result.data.headers["Content-Type"]);
  // };
  // useEffect(() => {
  //   handleSubmit();
  // }, []);

  // const handleSubmit = async () => {
  //   console.log("its a log value to test");
  //   const response = await axios
  //     .post(`${BASE_URL}/register`, {
  //       name: formValue.name,
  //       email: formValue.email,
  //       password: formValue.password,
  //     })
  //     .then((res) => console.log(res));
  //   console.log(response);
  // };

  const handleSubmit = async () => {
    const loginFormData = new FormData();
    loginFormData.append("name", formValue.name);
    loginFormData.append("email", formValue.email);
    loginFormData.append("password", formValue.password);

    try {
      const response = await axios({
        method: "post",
        url: { BASE_URL } + "/register",
        data: loginFormData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
  console.log(formValue);

  const handleChange = (event) => {
    setFormValue({
      ...formValue,
      [event.target.name]: event.target.value,
    });
  };

  return (
    <motion.div
      initial={{ y: "-400" }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
      className="loginWrapper"
    >
      <form onSubmit={handleSubmit} method="post">
        {newUser === 1 ? <h2>Register</h2> : <h2>Login</h2>}

        <label>Name</label>
        <input
          type="text"
          name="name"
          placeholder={"Username"}
          required
          onChange={handleChange}
        />
        {newUser === 1 && <label>Email</label>}
        {newUser === 1 && (
          <input
            type="email"
            name="email"
            placeholder={"Email"}
            required
            onChange={handleChange}
          />
        )}

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          onChange={handleChange}
        />

        <div className="userQus">
          {newUser === 0 && (
            <span onClick={() => setNewUser(1)}>Create a New Account?</span>
          )}
          {newUser === 0 && <span>Forgotten Password!</span>}
        </div>
        <motion.button
          whileHover={{
            scale: 1.2,
            transition: { duration: 0.2 },
          }}
          type="submit"
        >
          {newUser === 1 ? "Register" : "Login"}
        </motion.button>

        <div className="closeBtn">
          <div onClick={onClose}>
            <i className="fa fa-close " />
          </div>
        </div>
      </form>
    </motion.div>
  );
}

export default Login;
