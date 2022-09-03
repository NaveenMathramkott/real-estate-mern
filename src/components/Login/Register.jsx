import React from "react";
import "./Form.css";
import { motion } from "framer-motion";

function Register({ handleSubmitRegister, handleChange, setSignUp, onClose }) {
  return (
    <form onSubmit={handleSubmitRegister}>
      <h2>Register</h2>

      <label>Name</label>
      <input
        type="text"
        name="name"
        placeholder={"Username"}
        required
        onChange={handleChange}
      />
      <label>Email</label>

      <input
        type="email"
        name="email"
        placeholder={"Email"}
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
        <span onClick={() => setSignUp(false)}>Already have an Account?</span>
      </div>
      <motion.button
        whileHover={{
          scale: 1.2,
          transition: { duration: 0.2 },
        }}
        type="submit"
      >
        Register
      </motion.button>

      <div className="closeBtn">
        <div onClick={onClose}>
          <i className="fa fa-close " />
        </div>
      </div>
    </form>
  );
}

export default Register;
