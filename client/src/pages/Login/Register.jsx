import React, { useContext, useState } from "react";
import "./Form.css";
import apiCall from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Register({ setUserLogged, loggedUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { updateUser } = useContext(AuthContext);

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall.post("/auth/register", {
        username,
        password,
        email,
      });
      console.log(res);
      updateUser(res.data.user);
      navigate("/");
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitRegister}>
      <h2>Register</h2>

      <label>Name</label>
      <input
        type="text"
        name="name"
        placeholder={"Username"}
        required
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <label>Email</label>

      <input
        type="email"
        name="email"
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
        <span onClick={() => setUserLogged(false)}>
          Already have an Account?
        </span>
      </div>
      <button
        type="submit"
        className={loggedUser ? "submit-btn" : "submit-btn-disabled"}
        disabled={!loggedUser}
      >
        Register
      </button>
    </form>
  );
}

export default Register;
