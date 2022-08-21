import React from "react";
import "./Login.css";
import { motion } from "framer-motion";

function Login({ onClose }) {
  const [newUser, setNewUser] = React.useState(0);
  return (
    <motion.div
      initial={{ y: "-400" }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
      className="loginWrapper"
    >
      <form>
        {newUser === 1 ? <h2>Register</h2> : <h2>Login</h2>}
        {newUser === 1 ? (
          <label>User Name/Phone Number</label>
        ) : (
          <label>User Name</label>
        )}

        <input
          type="text"
          placeholder={newUser === 1 ? "username or phone number" : "Username"}
        />
        <label>Password</label>
        <input type="password" placeholder="Password" />

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
        >
          Login
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
