import React from "react";
import Dropzone from "react-dropzone";
import "./UserForm.css";

function UserForm() {
  return (
    <>
      <form className="kycUploadForm" onSubmit={() => {}}>
        <div className="headingSec">
          <h3>KYC UPDATION</h3>
        </div>
        <div className="nameSec">
          <div>
            <label>First Name</label>
            <input type="text" placeholder="First name" />
          </div>
          <div>
            <label>Last Name</label>
            <input type="text" placeholder="Last name" />
          </div>
        </div>
        <div className="addressSec">
          <label>Address</label>
          <textarea className="textArea" />
        </div>
        <div className="emailSec">
          <label>Email</label>
          <input type="email" placeholder="example@gmail.com" />
        </div>
        <div className="mboNumberSec">
          <label>Mobile Number</label>
          <input type="text" placeholder="mobile numbers" />
        </div>
        <div className="idSec">
          <div>
            <label>Id Number</label>
            <input type="text" placeholder="Adhar, PAN, " />
          </div>
          <div>
            <label>Location</label>
            <input type="text" placeholder="Location" />
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
