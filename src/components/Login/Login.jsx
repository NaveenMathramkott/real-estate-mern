import React from "react";
import "./Login.css";
import { motion } from "framer-motion";
import { registerAuth, loginAuth } from "../../Service/authService";

function Login({ onClose }) {
  const [signUp, setSignUp] = React.useState(false);
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
      .then(
        (res) => console.log(res)
        // setFormValue({
        //   successMsg: res.data.message,
        // })
      )
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
  console.log(formValue);
  return (
    <motion.div
      initial={{ y: "-400" }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2 }}
      className="loginWrapper"
    >
      {!signUp ? (
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
          <motion.button
            whileHover={{
              scale: 1.2,
              transition: { duration: 0.2 },
            }}
            type="submit"
          >
            Login
          </motion.button>

          <div className="closeBtn">
            <div onClick={onClose}>
              <i className="fa fa-close " />
            </div>
          </div>
        </form>
      ) : (
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
            <span onClick={() => setSignUp(false)}>
              Already have an Account?
            </span>
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
      )}
    </motion.div>
  );
}

export default Login;
