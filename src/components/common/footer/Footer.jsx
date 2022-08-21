import React from "react";
import { footer } from "../../data/Data";
import "./footer.css";

const Footer = () => {
  return (
    <>
      <section className="footerContact">
        <div className="container">
          <div className="send flex">
            <div className="text">
              <h1>Do You Have Questions ?</h1>
              <p>We'll help you to grow your career and growth.</p>
            </div>
            <button className="btn5">Contact Us Today</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="box">
            <div>
              <div className="logoSec">
                <img
                  src="../images/Logo2_rental.png"
                  alt=""
                  height={"10px"}
                  width={"10px"}
                />
                <h2>Do You Need Help With Anything?</h2>
                <p>
                  Receive updates, hot deals, tutorials, discounts sent straight
                  in your inbox every month
                </p>
              </div>

              <div className="input flex">
                <input type="text" placeholder="Email Address" />
                <button>Subscribe</button>
              </div>
            </div>
          </div>

          {footer.map((val) => (
            <div className="detailSection">
              <ul className="detailList">
                {val.text.map((items) => (
                  <li className="footerPad"> {items.list} </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
      <div className="legal">
        <span>© 2022 RentIsEazy. Designd By NvN</span>
      </div>
    </>
  );
};

export default Footer;
