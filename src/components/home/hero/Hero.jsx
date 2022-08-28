import React from "react";
import Heading from "../../common/Heading";
import Chip from "../../common/commonComp/Chip/Chip";
import "./hero.css";
import { chipData } from "../../data/Data";

const Hero = () => {
  return (
    <>
      <div className="hero">
        <div className="container ">
          <div className="headingSec">
            <Heading
              title="This is a rental portal for people "
              subtitle="Find new & featured property located in your local city."
            />
          </div>

          <form className="formContainer">
            <div className="leftWrapper">
              <div className="searchBox">
                <input
                  type="text"
                  placeholder="Search by City, area or building name..."
                />
                <div className="heroBtnSec">
                  <button className="heroBtn">
                    <i
                      className="fa fa-map-marker locationBtn"
                      aria-hidden="true"
                    ></i>
                  </button>
                  <button className="heroBtn">
                    <i className="fa fa-search"></i>
                  </button>
                </div>
              </div>
              <div className="heroBtnMobile">
                <button className="btnMob">
                  <i className="fa fa-map-marker locationBtn"></i>
                </button>
                <button className="btnMob">
                  <i className="fa fa-search"></i>
                </button>
              </div>
              <div className="chipWrapper">
                {chipData.map((data, index) => (
                  <Chip title={data.text} />
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Hero;
