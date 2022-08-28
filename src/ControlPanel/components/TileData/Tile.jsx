import React from "react";
import "./Tile.css";

function Tile({ number, itemName, price }) {
  return (
    <>
      <div className="tileMainWrapper">
        <div className="numberWrapper">
          <h2>
            {price ? (
              <>
                <i class="fa-solid fa-indian-rupee-sign" />
                {price}
              </>
            ) : (
              number
            )}
          </h2>
        </div>
        <p className="itemWrapper">{itemName}</p>
      </div>
    </>
  );
}

export default Tile;
