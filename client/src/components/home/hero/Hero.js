import React, { useEffect, useState } from "react";
import Heading from "../../Heading";
import "./hero.css";

import { useSelector } from "react-redux";
import Recent from "../recent/Recent";

const Hero = () => {
  // const { rentalList } = useSelector((state) => state.home);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [autCompleteLocation, setAutCompleteLocation] = useState([]);

  console.log(autCompleteLocation, "autCompleteLocation");

  return (
    <>
      <div className="hero">
        <div className="container">
          <div className="headingSec">
            <Heading
              title="This is a rental portal"
              subtitle="Find new & featured property located in your local city."
            />
          </div>

          <form className="formContainer">
            <div className="leftWrapper">
              <div className="search-wrapper">
                <div className="searchBox">
                  <input
                    type="text"
                    placeholder="Search by City, area or building name..."
                    // onChange={(e) => setSearch(e.target.value)}
                    value={search}
                    // onKeyDown={(e) => handleKeyPress(e)}
                  />
                  {typing && <div class="typing-loader"></div>}
                  <div className="heroBtnSec">
                    <button className="heroBtn">
                      <i className="fa fa-refresh"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* <Recent selectedLocation={selectedLocation} rentalList={rentalList} /> */}
    </>
  );
};

export default Hero;
