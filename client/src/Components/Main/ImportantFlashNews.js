import React from "react";
import { useSelector } from "react-redux";
import HomeFN from "./HomeFN";
import LoadingDots from "../LoadingDots";

export default function ImportantFlashNews() {
  const importantFlashNews = useSelector((state) => state.importantFlashNews);
  return (
    <div
      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
      style={{
        backgroundColor: "var(--c1-side)",
        rowGap: "24px",
        border: "none",
      }}
    >
      <h4>Important Flash News</h4>
      {importantFlashNews.length > 0 && (
        <HomeFN flashnews={importantFlashNews} />
      )}
      {importantFlashNews.length === 0 && (
        <div className="fit-container fx-centered" style={{height: "300px"}}>
          <LoadingDots />
        </div>
      )}
    </div>
  );
}
