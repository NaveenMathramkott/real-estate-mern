import React from "react";
import "./GeneralListItem.css";

function GeneralListItem({
  icon = "fa fa-dashboard",
  itemName = "Dashboard",
  updateNum,
}) {
  return (
    <>
      <div className="generalListItemWrapper">
        <div className="listLeftWrapper">
          <i className={icon} />
        </div>
        <div className="listCenterWrapper">
          <p>{itemName}</p>
        </div>
      </div>
    </>
  );
}

export default GeneralListItem;
