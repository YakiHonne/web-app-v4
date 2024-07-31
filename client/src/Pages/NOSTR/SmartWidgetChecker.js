import React from "react";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { Helmet } from "react-helmet";

export default function SmartWidgetChecker() {
  return (
    <div>
      <Helmet>
        <title>Yakihonne | Smart widget checker</title>
        <meta
          name="description"
          content={"Check the status of a smart widget"}
        />
        <meta
          property="og:description"
          content={"Check the status of a smart widget"}
        />

        <meta
          property="og:url"
          content={`https://yakihonne.com/smart-widget-checker`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Smart widget checker" />
        <meta
          property="twitter:title"
          content="Yakihonne | Smart widget checker"
        />
        <meta
          property="twitter:description"
          content={"Check the status of a smart widget"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <SidebarNOSTR />
          <main className="main-page-nostr-container">
            <div className="fx-centered fit-container fx-start-h fx-start-v">
              <div className="box-pad-h-m fit-container">
                <div className="fit-container fx-centered fx-start-h fx-start-v">
                  <div
                    style={{ width: "min(100%,700px)" }}
                    className="box-pad-h-m box-pad-v"
                  ></div>
                  <div
                    style={{
                      width: "min(100%,400px)",
                      height: "100vh",
                      overflow: "scroll",
                      padding: "1rem",
                      borderLeft: "1px solid var(--pale-gray)",
                    }}
                    className="box-pad-h-m box-pad-v sticky"
                  ></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
