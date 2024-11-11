import React from "react";
import { Helmet } from "react-helmet";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import TrendingUsers from "../../Components/Main/TrendingUsers";
import RecentTags from "../../Components/Main/RecentTags";
import Footer from "../../Components/Footer";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import ArrowUp from "../../Components/ArrowUp";
import NotificationCenterMain from "../../Components/Main/NotificationCenterMain";
import { useSelector } from "react-redux";
import PagePlaceholder from "../../Components/PagePlaceholder";

export default function Notification() {
  const userKeys = useSelector(state => state.userKeys)
  return (
    <div style={{ overflow: "auto" }}>
      <Helmet>
        <title>Yakihonne | Notification</title>
        <meta
          name="description"
          content={"Take a glimpse of all your notification"}
        />
        <meta
          property="og:description"
          content={"Take a glimpse of all your notification"}
        />
        <meta property="og:url" content={`https://yakihonne.com`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Notification" />
        <meta property="twitter:title" content="Yakihonne | Notification" />
        <meta
          property="twitter:description"
          content={"Take a glimpse of all your notification"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <SidebarNOSTR />
          <main
            className="main-page-nostr-container"
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{ padding: 0 }}
          >
            <ArrowUp />

            <div className="fit-container fx-centered fx-start-h fx-start-v">
              <div
                className="fit-container fx-centered fx-start-v "
                style={{ gap: 0 }}
              >
                <div
                  style={{ gap: 0 }}
                  className={`fx-centered  fx-wrap main-middle`}
                >
                  {/* <div
                    className="fit-container sticky fx-centered box-pad-h fx-col"
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--very-dim-gray)",
                    }}
                  >
                    <div className="fit-container fx-scattered">
                      <h3>Notification</h3>
                    </div>
                  </div> */}
                  {userKeys && <NotificationCenterMain />}
                  {!userKeys && <PagePlaceholder page={"nostr-not-connected"} />}
                </div>
                {/* <div
                  className=" fx-centered fx-col fx-start-v extras-homepage"
                  style={{
                    position: "sticky",
                    zIndex: "100",
                    top: 0,
                    flex: 1,
                  }}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>
                  <TrendingUsers />
                  <Footer />
                </div> */}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
