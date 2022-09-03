import React from "react";
import "./SideBar.css";
import { Link } from "react-router-dom";

function SideBar({ sideBarData }) {
  return (
    <>
      {/* <div className="sideProfileWrapper">
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
      </div> */}

      <nav class="main-menu">
        <ul>
          {sideBarData.map((item) => (
            <li>
              <Link to="/">
                <i className={`fa ${item.icon}`}></i>
                <span className="nav-text">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul class="logout">
          <li>
            <Link to="/">
              <i className="fa fa-power-off fa-2x"></i>
              <span className="nav-text">Logout</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default SideBar;
