import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PageNotFound() {
  // const location = useLocation();
  const navigate = useNavigate();
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      if (count > 0) {
        setCount((prev) => prev - 1);
      } else {
        navigate("/");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        width: "100vw",
        height: "90vh",
      }}
    >
      <h1 style={{ color: "#3aafa9" }}>404 Page Not Found</h1>
      <h4 style={{ color: "#2b7a78" }}>Redirecting in {count}</h4>
    </div>
  );
}

export default PageNotFound;
