import React, { useEffect, useState } from "react";
import Heading from "../../common/Heading";
import Chip from "../../common/commonComp/Chip/Chip";
import "./hero.css";
import { chipData } from "../../data/Data";
import { useSelector, useDispatch } from "react-redux";

const Hero = () => {
  const dispatch = useDispatch();
  const { locationAutoComplete } = useSelector((state) => state.home);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const handleKeyPress = () => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
    }, 3000);
  };
  useEffect(() => {
    if (!typing && search) {
      console.log(dispatch, "enetered");
      dispatch.home.locationAutocomplte(search);
    }
  }, [typing]);
  console.log(locationAutoComplete, "locationAutoComplete");
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
                {
                  <div className="search-content">
                    <ul className="search-ul">
                      {locationAutoComplete.length ? (
                        locationAutoComplete.map((item, index) => (
                          <li key={index} className="search-li">
                            {item?.location}
                          </li>
                        ))
                      ) : (
                        <li className="search-li">no data</li>
                      )}
                    </ul>
                  </div>
                }
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
