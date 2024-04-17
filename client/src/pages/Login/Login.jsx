import React, { useContext, useState } from "react";
import "./Form.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.js";
import apiCall from "../../utils/api.js";

function Login({ setUserLogged, loggedUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { updateUser } = useContext(AuthContext);

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall.post("/auth/login", {
        email,
        password,
      });

      updateUser(res.data);
      navigate("/");
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitLogin}>
      <h2>Welcome Back</h2>

      <label>Email</label>
      <input
        type="text"
        name="name"
        placeholder={"Email"}
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label>Password</label>
      <div className="password-sec">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div
          className="password-icon"
          onClick={() => setShowPassword(!showPassword)}
        >
          <i
            className={
              showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"
            }
          />
        </div>
      </div>
      <div className="userQus">
        <span onClick={() => setUserLogged(true)}>Create a New Account?</span>
        <span>Forgotten Password!</span>
      </div>
      <button
        className={loggedUser ? "submit-btn" : "submit-btn-disabled"}
        disabled={!loggedUser}
        type="submit"
      >
        Login
      </button>
    </form>
  );
}

export default Login;
