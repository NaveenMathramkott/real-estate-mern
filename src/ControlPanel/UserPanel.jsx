import React, { useState } from "react";
import img from "../components/images/pricing.jpg";
import Back from "../components/common/Back";
import { FileUploader } from "react-drag-drop-files";
import "./UserPanel.css";
import ProfileDash from "./Screens/ProfileDash";
import { PROFILE_SIDE_DATA } from "./AdminData";

const fileTypes = ["JPG", "PNG", "GIF"];
function UserPanel({ adminName = "User Account" }) {
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
          <ProfileDash
            adminName={adminName}
            img={img}
            dashboardData={PROFILE_SIDE_DATA}
          />
          <div className="adminMainContent">
            <div style={{ width: "100%" }}>
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
          </div>
        </div>
      </div>
    </>
  );
}

export default UserPanel;
