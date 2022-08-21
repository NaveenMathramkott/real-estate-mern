import React from "react";
import "./Avatar.css";
import image from "../../../images/team-4.jpg";

function Avatar({ img = image, name }) {
  return (
    <>
      <div className="avatarWrapper">
        <img src={img} alt={name} className="imageStyle" />
      </div>
    </>
  );
}

export default Avatar;
