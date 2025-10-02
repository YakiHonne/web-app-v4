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
        <title>Yakihonne | Notifications</title>
        <meta
          name="description"
          content={"Stay updated on interactions with your content and connections in real-time. Never miss important engagement from your audience."}
        />
        <meta
          property="og:description"
          content={"Stay updated on interactions with your content and connections in real-time. Never miss important engagement from your audience."}
        />
        <meta property="og:image" content="https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="700" />
        <meta property="og:url" content={`https://yakihonne.com`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Notifications" />
        <meta property="twitter:title" content="Yakihonne | Notifications" />
        <meta
          property="twitter:description"
          content={"Stay updated on interactions with your content and connections in real-time. Never miss important engagement from your audience."}
        />
        <meta property="twitter:image" content="https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png" />
      </Helmet>

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
            {!userKeys && <PagePlaceholder page={"nostr-not-connected"} />}
          </div>
        </div>
      </div>
    </div>
  );
}
