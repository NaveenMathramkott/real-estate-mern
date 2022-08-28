import React from "react";
import GeneralListItem from "../GeneralListItem/GeneralListItem";
import "./SideBar.css";

function ProfileDash({ adminName = "Admin", img, dashboardData }) {
  return (
    <>
      <div className="sideProfileWrapper">
        <div className="proPicWrapper">
          <img src={img} alt={adminName} className="proPic" />
          <h4>{adminName}</h4>
        </div>
        <div className="adminSideContent">
          {dashboardData.map((item, index) => (
            <div className="listSection">
              <GeneralListItem icon={item.icon} itemName={item.name} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ProfileDash;
