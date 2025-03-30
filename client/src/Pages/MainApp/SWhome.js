import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import PagePlaceholder from "../../Components/PagePlaceholder";

export default function SWhome() {
  const [searchType, setSearchType] = useState(0);
  const inputFieldRef = useRef(null);
  return (
    <div>
      <Helmet>
        <title>Yakihonne | Smart widgets</title>
        <meta
          name="description"
          content={"Interact with the community smart widgets"}
        />
        <meta
          property="og:description"
          content={"Interact with the community smart widgets"}
        />
        <meta
          property="og:url"
          content={`https://yakihonne.com/smart-widget`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Smart widget" />
        <meta property="twitter:title" content="Yakihonne | Smart widget" />
        <meta
          property="twitter:description"
          content={"Interact with the community smart widgets"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
          {/* <PagePlaceholder page={"maintenance"}/> */}
            <div
              className="fx-centered fit-container fx-col box-pad-v"
              style={{ gap: 0, minHeight: "100vh" }}
            >
              <div className="box-pad-v fx-centered">
                <div
                  className="smart-widget-24"
                  style={{
                    minWidth: "44px",
                    minHeight: "44px",
                    animation: "1.5s infinite rotate",
                  }}
                ></div>
                <h3>Smart Widgets</h3>
              </div>
              <div
                className="sc-s box-pad-h-s box-pad-v-s fx-centered fx-col sw-search-box"
                style={{
                  width: "min(100%, 600px)",
                }}
                onClick={() => inputFieldRef?.current?.focus()}
              >
                <div className="fit-container">
                  <input
                    type="text"
                    className="if ifs-full if-no-border"
                    value={""}
                    placeholder="Ask anything..."
                    ref={inputFieldRef}
                  />
                </div>
                <div className="fit-container fx-scattered box-pad-h-m box-pad-v-m">
                  <div className="fx-centered">
                    <div
                      className="sc-s box-pad-h-m box-pad-v-s option pointer fx-centered"
                      style={{
                        backgroundColor: !searchType ? "var(--pale-gray)" : "",
                      }}
                      onClick={() => setSearchType(0)}
                    >
                      <div className="search"></div>
                      Widget search
                    </div>
                    <div
                      className="sc-s box-pad-h-m box-pad-v-s option pointer fx-centered"
                      style={{
                        backgroundColor: searchType ? "var(--pale-gray)" : "",
                      }}
                      onClick={() => setSearchType(1)}
                    >
                      <div className="ringbell"></div>
                      Get inspired
                    </div>
                  </div>
                  <div
                    className="round-icon"
                    style={{ minWidth: "40px", minHeight: "40px" }}
                  >
                    <div className="send"></div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "min(100%, 600px)",
                }}
                className="fx-centered fx-col fx-start-v box-pad-h-m box-pad-v"
              >
                <p className="gray-c">Try our different method of searching</p>
                <div className="fit-container fx-centered fx-stretch">
                  <div className="fx box-pad-h-m box-pad-v-m sc-s-18 bg-sp">
                    <p className="gray-c">
                      <span className="c1-c">Widget search </span>
                      searching for published smart widgets and what people made
                    </p>
                  </div>
                  <div className="fx box-pad-h-m box-pad-v-m sc-s-18 bg-sp fx-centered fx-col fx-start-v">
                    <p className="gray-c">
                      <span className="c1-c">Get inspired </span>
                      ask our AI to help you build your smart widget
                    </p>
                    <div className="box-pad-h-m box-pad-v-s sc-s fx-centered bg-sp option pointer">
                      <div className="github-logo"></div>
                      Get started
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
