import React from "react";
import "./Form.css";
import { motion } from "framer-motion";

function Login({ handleSubmitLogin, handleChange, setSignUp, onClose }) {
  const loggedInUser = localStorage.getItem("authenticated");
  return (
    <form onSubmit={handleSubmitLogin}>
      <h2>Login</h2>

      <label>Name</label>
      <input
        type="text"
        name="name"
        placeholder={"Username"}
        required
        onChange={handleChange}
      />
      <label>Password</label>
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        onChange={handleChange}
      />
      <div className="userQus">
        <span onClick={() => setSignUp(true)}>Create a New Account?</span>
        <span>Forgotten Password!</span>
      </div>
      {!loggedInUser ? (
        <motion.button
          whileHover={{
            scale: 1.2,
            transition: { duration: 0.2 },
          }}
          type="submit"
        >
          Login
        </motion.button>
      ) : (
        <motion.button
          whileHover={{
            opacity: 0,
            transition: { duration: 0.2 },
          }}
          disabled
          style={{ backgroundColor: "gray " }}
        >
          Login
        </motion.button>
      )}

      {/* <div className="closeBtn">
        <div onClick={onClose}>
          <i className="fa fa-close " />
        </div>
      </div> */}
    </form>
  );
}

export default Login;
