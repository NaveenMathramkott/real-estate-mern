import React, { useEffect, useState } from "react";
import Heading from "../../Heading";
import "./hero.css";

import SearchBar from "../../searchBar/SearchBar";

const Hero = () => {
  // const { rentalList } = useSelector((state) => state.home);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [autCompleteLocation, setAutCompleteLocation] = useState([]);

  return (
    <>
      <div className="hero">
        <div className="headingSec">
          <Heading
            title="Buy your New Home"
            subtitle="Find new & featured property located in your local city."
          />
        </div>
        <div className="searchBarSec">
          <SearchBar />
        </div>
      </div>
      {/* <Recent selectedLocation={selectedLocation} rentalList={rentalList} /> */}
    </>
  );
};

export default Hero;
