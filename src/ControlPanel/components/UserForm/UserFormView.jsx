import React from "react";
import "./UserForm.css";

function UserFormView({
  firstName = "maverick",
  lastName = "top gun",
  address = "fighter jets",
  email = "tom curise",
  mobile = "99887766",
  idNo = "10101010101",
  location = "blue whale",
}) {
  return (
    <>
      <form className="kycUploadFormView">
        <div className="headingSec">
          <h3>KYC Status</h3>
        </div>

        <div>
          <label>First Name</label>
          <span>{firstName}</span>
        </div>
        <div>
          <label>Last Name</label>
          <span>{lastName}</span>
        </div>

        <div>
          <label>Address</label>
          <span>{address}</span>
        </div>
        <div>
          <label>Email</label>
          <span>{email}</span>
        </div>
        <div>
          <label>Mobile Number</label>
          <span>{mobile}</span>
        </div>

        <div>
          <label>Id Number</label>
          <span>{idNo}</span>
        </div>
        <div>
          <label>Location</label>
          <span>{location}</span>
        </div>
      </form>
    </>
  );
}

export default UserFormView;
