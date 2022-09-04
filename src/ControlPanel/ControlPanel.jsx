import React from "react";
import AdminPanel from "./AdminPanel";
import UserPanel from "./UserPanel";

function ControlPanel() {
  const users = localStorage.getItem("user");
  const loggedAccount = JSON.parse(users);

  const userAccount = loggedAccount.roles[0] === "ROLE_USER";
  const adminAccount = loggedAccount.roles[0] === "ROLE_ADMIN";
  return (
    <>
      {userAccount && <UserPanel />}
      {adminAccount && <AdminPanel />}
    </>
  );
}

export default ControlPanel;
