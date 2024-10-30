import React from "react";
import LoadingDots from "../LoadingDots";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function RecentTags() {
  const recentTags = useSelector((state) => state.recentTags);

  return (
    <div
      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
      style={{
        backgroundColor: "var(--c1-side)",
        rowGap: "24px",
        border: "none",
      }}
    >
      <h4>Recent tags</h4>

      {recentTags.length > 0 && (
        <div className="fx-centered fx-start-h fx-wrap">
          {recentTags.map((tag, index) => {
            return (
              <Link
                key={index}
                className="sticker sticker-small sticker-c1 pointer"
                to={`/tags/${tag?.replace("#", "%23")}`}
              >
                {tag}
              </Link>
            );
          })}
        </div>
      )}
      {recentTags.length === 0 && (
        <div className="fit-container fx-centered" style={{ height: "300px" }}>
          <LoadingDots />
        </div>
      )}
    </div>
  );
}
