import React from "react";
import img from "../../assets/images/pricing.jpg";
import Back from "../../components/Back";
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
          <form className="shadow contactWrapper">
            <h2>Contact Us</h2> <br />
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
