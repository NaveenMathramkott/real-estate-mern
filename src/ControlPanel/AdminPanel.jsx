import React, { useState } from "react";
import img from "../components/images/pricing.jpg";
import Back from "../components/common/Back";
import "./AdminPanel.css";
import ProfileDash from "./Screens/ProfileDash";
import { PROFILE_SIDE_DATA } from "./AdminData";
import ViewTable from "./components/ViewTable/ViewTable";
import Tile from "./components/TileData/Tile";

function AdminPanel({ adminName = "Admin Account" }) {
  const [file, setFile] = useState(null);

  const handleChange = (file) => {
    setFile(file);
  };
  return (
    <>
      <div className="adminWrapper">
        <Back
          name="Dashboard"
          title={`Hello ${adminName},welcome`}
          cover={img}
        />
        <div className="adminContentWrapper">
          <div className="sideDashboard">
            <ProfileDash
              adminName={adminName}
              img={img}
              dashboardData={PROFILE_SIDE_DATA}
            />
          </div>
          <div className="adminMainContent">
            <div className="tileWrapper">
              <Tile number={490} itemName={"Listed Property"} />
              <Tile number={490} itemName={"Listed Property"} />
              <Tile price={490} itemName={"Listed Property"} />
            </div>
            <div style={{ margin: "10px" }}>
              <ViewTable />
            </div>
            <div style={{ margin: "10px" }}>
              <ViewTable />
            </div>
            <div style={{ margin: "10px" }}>
              <ViewTable />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminPanel;
