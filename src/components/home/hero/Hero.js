import React, { useEffect, useState } from "react";
import Heading from "../../common/Heading";
import Chip from "../../common/commonComp/Chip/Chip";
import "./hero.css";
import { chipData } from "../../data/Data";

import { useSelector, useDispatch } from "react-redux";
import Recent from "../recent/Recent";

const Hero = () => {
  const dispatch = useDispatch();
  const { rentalList } = useSelector((state) => state.home);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [autCompleteLocation, setAutCompleteLocation] = useState([]);
  const handleKeyPress = () => {
    setTyping(true);
    if (selectedLocation) {
      setSelectedLocation("");
    }
    setTimeout(() => {
      setTyping(false);
    }, 1000);
  };
  useEffect(() => {
    if (!typing) {
      let filteredVal = [];
      if (!search) {
        filteredVal = rentalList;
      } else {
        filteredVal = rentalList.filter((item) =>
          item.location.toLowerCase().includes(search.toLowerCase())
        );
      }
      let locations = filteredVal.map((item) => item.location);
      let uniqueLoc = [...new Set(locations)];
      setAutCompleteLocation(uniqueLoc);
    }
  }, [typing]);
  useEffect(() => {
    dispatch.home.fetchAllRental();
  }, []);

  useEffect(() => {
    let locations = rentalList.map((item) => item.location);
    let uniqueLoc = [...new Set(locations)];
    console.log(locations, "locations");
    setAutCompleteLocation(uniqueLoc);
  }, [rentalList]);

  const onSelectLocation = (item) => {
    setSearch(item);
    setSelectedLocation(item);
  };

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
                    onChange={(e) => setSearch(e.target.value)}
                    value={search}
                    onKeyDown={(e) => handleKeyPress(e)}
                  />
                  {typing && <div class="typing-loader"></div>}
                  <div className="heroBtnSec">
                    <button className="heroBtn">
                      <i className="fa fa-refresh"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="chipWrapper">
                {autCompleteLocation.length ? (
                  autCompleteLocation.map((item, index) => (
                    <div onClick={() => onSelectLocation(item)} key={index}>
                      {/* {item} */}
                      <Chip title={item} />
                    </div>
                  ))
                ) : (
                  <span>No Property found in this Location</span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      <Recent selectedLocation={selectedLocation} rentalList={rentalList} />
    </>
  );
};

export default Hero;
