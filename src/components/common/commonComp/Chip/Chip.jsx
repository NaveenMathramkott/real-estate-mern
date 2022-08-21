import React from "react";
import "./Chip.css";
const Chip = ({ title, onPress }) => {
  return (
    <div className="mainWrapper" onClick={onPress}>
      <span className="chipText">{title}</span>
    </div>
  );
};
export default Chip;
