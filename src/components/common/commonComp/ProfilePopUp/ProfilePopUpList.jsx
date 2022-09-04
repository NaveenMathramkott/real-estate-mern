import React from "react";
import { Link, useHistory } from "react-router-dom";
import "./ProfilePopUp.css";

// import { motion } from "framer-motion";
function ProfilePopUpList({ list }) {
  const history = useHistory();
  const checker = (str) => {
    if (str === "logout") {
      localStorage.clear();
      history.push("/login");
      window.location.reload();
    }
  };
  return (
    <div
      className="profilePopUpListWrapper"
      // initial={{ y: "-20vh" }}
      // animate={{ y: 0 }}
      // transition={{ delay: 1 }}
    >
      <ul>
        {list.map((list, index) => (
          <li key={index}>
            <Link
              to={list.path}
              className="popUpList"
              onClick={() => {
                checker(list.check);
              }}
            >
              {list.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProfilePopUpList;
