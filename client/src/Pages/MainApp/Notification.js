import React from "react";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import ArrowUp from "../../Components/ArrowUp";
import NotificationCenterMain from "../../Components/Main/NotificationCenterMain";
import { useSelector } from "react-redux";
import PagePlaceholder from "../../Components/PagePlaceholder";

export default function Notification() {
  const userKeys = useSelector((state) => state.userKeys);
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
          <Sidebar />
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
                  {userKeys && <NotificationCenterMain />}
                  {!userKeys && (
                    <PagePlaceholder page={"nostr-not-connected"} />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
