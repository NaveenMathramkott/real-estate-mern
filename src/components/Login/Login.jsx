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

  return (
    <motion.div
      initial={{ y: "-400" }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
      className="loginWrapper"
    >
      <form onSubmit={() => {}}>
        {newUser === 1 ? <h2>Register</h2> : <h2>Login</h2>}

        <label>Name</label>
        <input
          type="text"
          name="name"
          placeholder={"Username"}
          // required
          // onChange={handleChange}
        />
        {newUser === 1 && <label>Email</label>}
        {newUser === 1 && (
          <input
            type="email"
            name="email"
            placeholder={"Email"}
            // required
            // onChange={handleChange}
          />
        )}

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          // required
          // onChange={handleChange}
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
