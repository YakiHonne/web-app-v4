import React, { useState } from "react";
import SearchNetwork from "./SearchNetwork";

export default function SearchSidebar() {
  const [showSearchPage, setSearchPage] = useState(false);
  return (
    <>
      {showSearchPage && <SearchNetwork exit={() => setSearchPage(false)} />}
      <div
        onClick={() => setSearchPage(true)}
        className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s inactive-link`}
      >
        <div className={"search-24"}></div>
        <div className="link-label">Search</div>
      </div>
    </>
  );
}
