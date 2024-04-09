import React from "react";

const Back = ({ name, title, cover, height = "30vh" }) => {
  return (
    <>
      <div className="back" style={{ height: height }}>
        <div className="container">
          <span>{name}</span>
          <h1>{title}</h1>
        </div>
        <img src={cover} alt="" />
      </div>
    </>
  );
};

export default Back;
