import React, { useEffect, useState } from "react";
// import { list } from "../../data/Data";
import config from "../../../config"

const RecentCard = ({selectedLocation , rentalList}) => {
  const [list ,setList ] = useState([])
  useEffect(()=>{
    let tempArray = rentalList
    if (selectedLocation && rentalList && rentalList.length){
      tempArray =  rentalList.filter((item) => item.location.toLowerCase().includes(selectedLocation.toLowerCase()))
    }
    setList(tempArray)
  } , [selectedLocation , rentalList])
  console.log(selectedLocation , rentalList , "{selectedLocation , rentalList}")
  return (
    <>
      <div className="content grid3 mtop">
        {list.map((val, index) => {
          const { image, Status, location, name, price, room_type } = val;
          return (
            <div className="box shadow" key={index}>
              <div className="img">
                <img src={`${config.imageUrl}${image}`} alt="" />
              </div>
              <div className="text">
                <div className="category flex">
                  <span
                    style={{
                      background:
                      Status === 1  ? "#25b5791a" : "#ff98001a",
                      color: Status === 1 ? "#25b579" : "#ff9800",
                    }}
                  >
                    {Status === 1 ? "Available" : "Not available"}
                  </span>
                  <i className="fa fa-heart"></i>
                </div>
                <h4>{name}</h4>
                <p>
                  <i className="fa fa-location-dot"></i> {location}
                </p>
              </div>
              <div className="button bottom ">
                <div>
                  <button className="btn2">{price}/sqft</button>{" "}
                </div>
                <div>{room_type}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RecentCard;
