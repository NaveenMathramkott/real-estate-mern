import React from "react";
import "../../App.css";

const Heading = ({ title, subtitle }) => {
  return (
    <>
      <div className="heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </>
  );
};

export default Heading;
