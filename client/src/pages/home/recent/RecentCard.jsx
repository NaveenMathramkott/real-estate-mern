import React, { useEffect, useState } from "react";
// import { list } from "../../data/Data";

const RecentCard = ({ selectedLocation, rentalList }) => {
  const [list, setList] = useState([]);
  useEffect(() => {
    let tempArray = rentalList;
    if (selectedLocation && rentalList && rentalList.length) {
      tempArray = rentalList.filter((item) =>
        item.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    setList(tempArray);
  }, [selectedLocation, rentalList]);
  console.log(selectedLocation, rentalList, "{selectedLocation , rentalList}");
  return (
    <>
      <div className="content grid3 mtop">
        {list.map((val, index) => {
          const {
            image,
            Status,
            location,
            listing_name,
            price,
            room_type,
            description,
            isFurnished,
            listing_type,
          } = val;
          return (
            <div className="box shadow" key={index}>
              <div className="recentImg">
                {/* <img src={`${config.imageUrl}${image}`} alt="" /> */}
              </div>
              <div className="text">
                <div className="category flex">
                  <span
                    style={{
                      background: Status === 1 ? "#25b5791a" : "#ff98001a",
                      color: Status === 1 ? "#25b579" : "#ff9800",
                    }}
                  >
                    {Status === 1 ? "Available" : "Not available"}
                  </span>
                </div>
                <h4>{listing_name}</h4>
                <p>{description}</p>
                <p>{isFurnished}</p>
                <p>
                  <i className="fa fa-location-dot"></i> {location}
                </p>
              </div>
              <div className="button bottom ">
                <div>
                  <button className="btn2">{price}/sqft</button>{" "}
                </div>
                <span
                  style={{
                    background: Status === 1 ? "#ff98001a" : "#25b5791a",
                    color: Status === 1 ? "#ff9800" : "#25b579",
                    borderRadius: "15px",
                  }}
                >
                  {room_type} {listing_type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RecentCard;
