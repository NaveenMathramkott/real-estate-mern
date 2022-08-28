import React, { useState } from "react";
import img from "../components/images/pricing.jpg";
import Back from "../components/common/Back";
import { FileUploader } from "react-drag-drop-files";
import "./UserPanel.css";
import Tile from "./components/TileData/Tile";
import SideBar from "./components/SideBar/SideBar";
import { PROFILE_SIDE_DATA } from "./AdminData";
import ViewTable from "./components/ViewTable/ViewTable";

const fileTypes = ["JPG", "PNG", "GIF"];
function UserPanel({ adminName = "User Account" }) {
  const [file, setFile] = useState(null);

  const handleChange = (file) => {
    setFile(file);
  };
  return (
    <div className="adminWrapper">
      <div className="adminContentWrapper">
        <div className="sideDashboard">
          <SideBar
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
            <Tile price={490} itemName={"Listed Property"} />
          </div>
          <div style={{ width: "100%", padding: "8px" }}>
            <FileUploader
              handleChange={handleChange}
              name="file"
              types={fileTypes}
              // hoverTitle="Drop files here to upload"
              multiple
            >
              <div className="uploadBtn">
                <i className="fas fa-upload"></i>
                <p>Click or Drop files Here</p>
              </div>
            </FileUploader>
          </div>
          <div>
            <ViewTable />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPanel;
