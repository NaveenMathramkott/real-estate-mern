import React from "react";
import "./ViewTable.css";
import img from "../../../components/images/team-4.jpg";

function ViewTable({
  image = img,
  itemName = "Anna Tomson",
  status = "proceeding",
  number = "97 44 22 4047",
  email = "test@gmail.com",
}) {
  return (
    <>
      <div className="viewMainContainer">
        <img src={image} alt={itemName} className="imageStyle" />
        <div className="nameTag">{itemName}</div>
        <div className="numberTag">
          <div>{number}</div>
          <div>{email}</div>
        </div>
        <div className="statusTag">{status}</div>
        <div className="actionTag">
          <button>
            <i className="fa fa-edit" />
          </button>
          <button>
            <i className="fa fa-trash" />
          </button>
        </div>
      </div>
    </>
  );
}

export default ViewTable;
