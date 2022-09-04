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
  const [signUp, setSignUp] = React.useState(userLoggedIn);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
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
