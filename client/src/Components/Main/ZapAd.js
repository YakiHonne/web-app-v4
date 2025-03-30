import React, { useEffect, useMemo } from "react";
import UserProfilePic from "./UserProfilePic";

export default function ZapAd({ zappers = [] }) {
  let highest = useMemo(() => {
    if (!zappers.length) return false;
    return zappers.sort((a, b) => b.amount - a.amount)[0];
  }, [zappers]);

  if (!highest) return;
  return (
    <div
      className="fit-container fx-scattered"
      style={{ marginTop: "1rem" }}
    >
      <HighestZapper />
    </div>
  );
}

const HighestZapper = ({}) => {

  return (
    <div className="fx-centered">
      <div style={{position: "relative"}}>
        <div className="bolt-bold" style={{position: "absolute", left: "-10px", top: "50%", transform: "translateY(-50%)"}}></div>
        <div
          className="round-icon orange-pulse"
          style={{ minWidth: "30px", border: "none" }}
        >
          <p className="p-medium">42</p>
        </div>
      </div>
      <div style={{ position: "relative", left: "-15px" }}>
        <UserProfilePic mainAccountUser={true} size={30} />
      </div>
      <div style={{ position: "relative", left: "-25px" }}>
        <div
          style={{
            height: "30px",
            borderRadius: "20px",
            borderBottomLeftRadius: 0,
          }}
          className="box-pad-h-m sticker sticker-small sticker-gray-black"
        >
          <p>some message</p>
        </div>
      </div>
    </div>
  );
};
