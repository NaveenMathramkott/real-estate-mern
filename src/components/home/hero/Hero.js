import React, { useEffect, useState } from "react";
import Heading from "../../common/Heading";
import Chip from "../../common/commonComp/Chip/Chip";
import "./hero.css";
import { chipData } from "../../data/Data";
import { useSelector, useDispatch } from 'react-redux';
import Recent from "../recent/Recent";

const Hero = () => {
  const dispatch = useDispatch()
  const { rentalList } = useSelector((state) => state.home)
  const [search, setSearch] = useState("")
  const [typing, setTyping] = useState(false)
  const [selectedLocation , setSelectedLocation] = useState("")
  const [autCompleteLocation, setAutCompleteLocation] = useState([])
  const handleKeyPress = () => {
    setTyping(true)
    if (selectedLocation){
      setSelectedLocation("")
    }
    setTimeout(() => {
      setTyping(false)
    }, 1000)
  }
  useEffect(() => {
    if (!typing) {
      let filteredVal = []
      if (!search) {
        filteredVal = rentalList
      } else {
        filteredVal = rentalList.filter((item) => item.location.toLowerCase().includes(search.toLowerCase()))
      }
      let locations = filteredVal.map((item) => item.location)
      let uniqueLoc = [...new Set(locations)];
      setAutCompleteLocation(uniqueLoc)
    }
  }, [typing])
  useEffect(() => {
    dispatch.home.fetchAllRental()
  }, [])

  useEffect(() => {
    let locations = rentalList.map((item) => item.location)
    let uniqueLoc = [...new Set(locations)];
    console.log(locations, "locations")
    setAutCompleteLocation(uniqueLoc)
  }, [rentalList])

  const onSelectLocation = (item) => { 
    setSearch(item)
    setSelectedLocation(item)
  }

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
                {<div className="search-content">
                  <ul className="search-ul">
                    {autCompleteLocation.length ? autCompleteLocation.map((item, index) =>
                      <li onClick={() => onSelectLocation(item)} key={index} className="search-li">
                        {item}
                      </li>
                    )
                      :
                      <li className="search-li">no data</li>}
                  </ul>

                </div>}
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
      <Recent selectedLocation = {selectedLocation} rentalList = {rentalList}/>
    </>
  );
};

export default Hero;
