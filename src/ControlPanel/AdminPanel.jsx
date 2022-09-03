import React from "react";
// import img from "../components/images/pricing.jpg";
import FeaturedData from "./components/FeaturedData/FeaturedData";
import "./AdminPanel.css";
// import SideBar from "./components/SideBar/SideBar";
import { PROFILE_SIDE_DATA } from "./AdminData";
import ViewTable from "./components/ViewTable/ViewTable";
import Tile from "./components/TileData/Tile";
import Chart from "./components/Charts/Charts";
import SideBar from "./components/SideBar/SideBar";

function AdminPanel({ adminName = "Admin Account" }) {
  // const [file, setFile] = useState(null);

  // const handleChange = (file) => {
  //   setFile(file);
  // };
  return (
    <div className="adminPanel_mainWrapper">
      <div className="sideDashboard">
        {/* <SideBar sideBarData={PROFILE_SIDE_DATA} /> */}
      </div>
      <div className="adminContentWrapper">
        <div className="adminMainContent">
          <div className="tileWrapper">
            <Tile number={490} itemName={"Listed Property"} />
            <Tile price={490} itemName={"Listed Property"} />
            <Tile price={490} itemName={"Listed Property"} />
            <Tile price={490} itemName={"Listed Property"} />
          </div>
          <div>
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

export default AdminPanel;
