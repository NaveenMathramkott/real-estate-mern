import React from "react";
import Heading from "../../common/Heading";
import "./recent.css";
import RecentCard from "./RecentCard";

const Recent = (props) => {
  return (
    <>
      <section className="recent padding">
        <div className="container">
          <Heading
            title="Property Listed"
            subtitle="Listed property for your desired locstion"
          />
          <RecentCard {...props} />
        </div>
      </section>
    </>
  );
};

export default Recent;
