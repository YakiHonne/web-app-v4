import React from "react";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { Helmet } from "react-helmet";

export default function NostrNotes() {
  return (
    <div>
      <Helmet>
        <title>Yakihonne | Notes</title>
        <meta name="description" content={"Enjoy what people write on NOSTR"} />
        <meta
          property="og:description"
          content={"Enjoy what people write on NOSTR"}
        />

        <meta property="og:url" content={`https://yakihonne.com/notes`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content={"Yakihonne | Notes"} />
        <meta property="twitter:title" content={"Yakihonne | Notes"} />
        <meta
          property="twitter:description"
          content={"Enjoy what people write on NOSTR"}
        />
      </Helmet>

      <div className="fit-container fx-centered" style={{ columnGap: 0 }}>
        <SidebarNOSTR />
        <main className="main-page-nostr-container">
          <ArrowUp />

          <div className="fit-container fx-centered fx-start-h fx-start-v">
            {/* <div
              style={{ width: "min(100%,700px)" }}
              className="box-pad-h-m "
            >
            </div> */}
            <div
              className="fx-centered fx-col fit-container"
              style={{ height: "100vh" }}
            >
              <h3>Notes</h3>
              <div className="box-pad-v">
                <div className="loader"></div>
              </div>
              <p className="gray-c">Coming soon...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
