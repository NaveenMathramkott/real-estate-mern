import React from "react";
import "./IconText.css";

const IconText = ({ icon, title, onPress }) => {
  return (
    <div className="iconWrapper" onClick={onPress}>
      <i className={icon}></i>
      <span className="iconText">{title}</span>
    </div>
  );
};
export default IconText;
