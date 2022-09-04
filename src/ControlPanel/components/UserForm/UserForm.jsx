import React from "react";
import Dropzone from "react-dropzone";
import { kycFormPost } from "../../../Service/authService";
import "./UserForm.css";

function UserForm() {
  const [kycFormValue, setKycFormValue] = React.useState({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    mobile: "",
    idNo: "",
    location: "",
    successfulLog: false,
    successfulReg: false,
  });
  const kycFormUpload = async (e) => {
    e.preventDefault();
    kycFormPost({
      firstName: kycFormValue.firstName,
      lastName: kycFormValue.lastName,
      address: kycFormValue.address,
      email: kycFormValue.email,
      mobile: kycFormValue.mobile,
      idNo: kycFormValue.idNo,
      location: kycFormValue.location,
    })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };
  const handleChange = (event) => {
    setKycFormValue({
      ...kycFormValue,
      [event.target.name]: event.target.value,
    });
  };
  return (
    <>
      <form className="kycUploadForm" onSubmit={kycFormUpload}>
        <div className="headingSec">
          <h3>KYC UPDATION</h3>
        </div>
        <div className="nameSec">
          <div>
            <label>First Name</label>
            <input
              type="text"
              placeholder="First name"
              name="firstName"
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              name="lastName"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="addressSec">
          <label>Address</label>
          <textarea
            className="textArea"
            name="address"
            onChange={handleChange}
          />
        </div>
        <div className="emailSec">
          <label>Email</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            name="email"
            onChange={handleChange}
          />
        </div>
        <div className="mboNumberSec">
          <label>Mobile Number</label>
          <input
            type="text"
            placeholder="mobile numbers"
            name="mobile"
            onChange={handleChange}
          />
        </div>
        <div className="idSec">
          <div>
            <label>Id Number</label>
            <input
              type="text"
              placeholder="Adhar, PAN, "
              name="idNo"
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Location</label>
            <input
              type="text"
              placeholder="Location"
              name="location"
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <Dropzone onDrop={(acceptedFiles) => console.log(acceptedFiles)}>
            {({ getRootProps, getInputProps }) => (
              <section className="dropZoneSec">
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop files here, or click to select files</p>
                </div>
              </section>
            )}
          </Dropzone>
        </div>
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export default UserForm;
