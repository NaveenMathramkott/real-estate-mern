import React from "react";
import "./Form.css";
import { motion } from "framer-motion";
import Login from "./Login";
import Register from "./Register";

function Form({
  onClose,
  handleChange,
  handleSubmitRegister,
  handleSubmitLogin,
  userLoggedIn,
}) {
  const [signUp, setSignUp] = React.useState(false);

  return (
    <motion.div
      initial={{ y: "-400" }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
      className="loginWrapper"
    >
      {!signUp ? (
        <Login
          handleChange={handleChange}
          handleSubmitLogin={handleSubmitLogin}
          setSignUp={setSignUp}
          onClose={onClose}
        />
      ) : (
        <Register
          handleChange={handleChange}
          handleSubmitRegister={handleSubmitRegister}
          setSignUp={setSignUp}
          onClose={onClose}
        />
      )}
    </motion.div>
  );
}

export default Form;
