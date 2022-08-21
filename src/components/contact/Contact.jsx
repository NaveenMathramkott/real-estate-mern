import React from "react";
import img from "../images/pricing.jpg";
import Back from "../common/Back";
import "./contact.css";

const Contact = () => {
  return (
    <>
      <section className="contact mb">
        <Back
          name="Contact Us"
          title="Get Helps & Friendly Support"
          cover={img}
        />
        <div className="container">
          <form className="shadow">
            <h4>Contact Us</h4> <br />
            <div className="contactDiv">
              <label>Name</label>
              <input type="text" placeholder="Name" className="contactInput" />
            </div>
            <div className="contactDiv">
              <label>Email</label>
              <input type="text" placeholder="Email" className="contactInput" />
            </div>
            <div className="contactDiv">
              <label>Subject</label>
              <input
                type="text"
                placeholder="Subject"
                className="contactInput"
              />
            </div>
            <button>Submit Request</button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Contact;
