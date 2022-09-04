import React, { useEffect, useState } from "react";
// import img from "../components/images/pricing.jpg";
import FeaturedData from "./components/FeaturedData/FeaturedData";
import "./AdminPanel.css";
// import { PROFILE_SIDE_DATA } from "./AdminData";
import ViewTable from "./components/ViewTable/ViewTable";
import Tile from "./components/TileData/Tile";
import Chart from "./components/Charts/Charts";
import SideBar from "./components/SideBar/SideBar";
import { Redirect } from "react-router-dom";
import UserFormView from "./components/UserForm/UserFormView";

function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    const loggedInUser = localStorage.getItem("authenticated");
    if (loggedInUser) {
      setAuthenticated(loggedInUser);
    }
  }, []);

  if (!authenticated) {
    <Redirect
      to={{
        pathname: "/notFound",
        // state: { from: location },
      }}
    />;
  } else {
    return (
      <div className="adminPanel_mainWrapper">
        {/* <div className="sideDashboard">
          <SideBar sideBarData={PROFILE_SIDE_DATA} />
        </div> */}
        <div className="adminContentWrapper">
          <div className="adminMainContent">
            <div className="tileWrapper">
              <Tile number={120} itemName={"Listed Property"} />
              <Tile number={109} itemName={"Sold Property"} />
              <Tile number={135} itemName={"Auction Property"} />
            </div>
            <div>
              <div>
                <UserFormView />
              </div>
              <div className="chartAndFeature">
                <div className="featuredData_View">
                  <FeaturedData />
                </div>
                <div className="chart_View">
                  <Chart title={"Last 6 month Revenue"} />
                </div>
              </div>
            </div>
            <ViewTable />
          </div>
        </div>
      </div>
    );
  }
}

export default AdminPanel;
