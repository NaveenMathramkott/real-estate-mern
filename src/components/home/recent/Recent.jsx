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
            subtitle="Listed property for your desired locstion,Sometimes, properties can practically sell themselves—as long as they are priced right, promoted correctly, and the property listing description plainly conveys why it is the bargain of a lifetime."
          />
          <RecentCard {...props} />
        </div>
      </section>
    </>
  );
};

export default Recent;
