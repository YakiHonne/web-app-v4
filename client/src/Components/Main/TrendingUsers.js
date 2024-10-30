import React from "react";
import TopCreators from "./TopCreators";
import LoadingDots from "../LoadingDots";
import { useSelector } from "react-redux";

export default function TrendingUsers() {
  const trendingUsers = useSelector((state) => state.trendingUsers);
  return (
    <div
      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
      style={{
        backgroundColor: "var(--c1-side)",
        rowGap: "24px",
        border: "none",
        overflow: 'visible'
      }}
    >
      <h4>Trending users</h4>

      {trendingUsers.length > 0 && (
        <TopCreators top_creators={trendingUsers} kind="" />
      )}
      {trendingUsers.length === 0 && (
        <div className="fit-container fx-centered" style={{ height: "300px" }}>
          <LoadingDots />
        </div>
      )}
    </div>
  );
}
