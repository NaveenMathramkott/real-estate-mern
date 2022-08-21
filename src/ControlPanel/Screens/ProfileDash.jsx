import React from "react";
import GeneralListItem from "../components/GeneralListItem/GeneralListItem";
import "./ProfileDash.css";

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
              <GeneralListItem
                icon={item.icon}
                itemName={item.name}
                updateNum={item.num}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ProfileDash;
