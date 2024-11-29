import React, { useState } from "react";
import ymaQR from "../media/images/yma-qr.png";
import { Link } from "react-router-dom";

export default function YakiMobileappSidebar() {
  const [showDemo, setShowDemo] = useState(false);
  return (
    <>
      {showDemo && <MobileDemo exit={() => setShowDemo(false)} />}
      <div
        className="fit-container fx-centered fx-col fx-end-v"
        style={{
          position: "relative",
        }}
        onClick={() => setShowDemo(true)}
      >
        <div
          className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s inactive-link`}
        >
          <div className="fx-centered">
            <div className={"mobile-24"}></div>
            <div className="link-label">Download app</div>
          </div>
        </div>
      </div>
    </>
  );
}

const MobileDemo = ({ exit }) => {
  return (
    <div
      className="fixed-container fx-centered fx-col box-pad-h"
      onClick={(e) => {
        e.stopPropagation();
        exit();
      }}
    >
      <div
        style={{ width: "min(100%, 800px)", position: "relative", gap: "16px" }}
        className="sc-s-18 box-pad-h-s box-pad-v-s bg-sp fx-centered fx-col fx-start-v"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <video
          autoPlay="autoplay"
          loop="loop"
          // muted
          playsInline
          // onContextMenu={() => {
          //   return false;
          // }}
          preload="auto"
          id="myVideo"
          controls={true}

          // autoPlay muted loop id="myVideo"
          style={{
            position: "relative",
            border: "none",
            zIndex: "0",
            borderRadius: "var(--border-r-18)",
          }}
          className="fit-container"
          // src={
          //   "https://yakihonne.s3.ap-east-1.amazonaws.com/videos/yakihonne-mobile-app-promo.mp4"
          // }
        >
          <source
            src="https://yakihonne.s3.ap-east-1.amazonaws.com/videos/yakihonne-mobile-app-promo-2.mp4"
            type="video/mp4"
          />{" "}
          Your browser does not support HTML5 video.
        </video>
      </div>
      <div
        style={{ position: "relative", gap: "16px", maxWidth: "fit-content" }}
        className="sc-s-18 box-pad-h box-pad-v bg-sp fx-centered fx-col fx-start-v slide-up"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="fx-wrap fx-centered" style={{ gap: "20px" }}>
          <div style={{ width: "150px" }}>
            <img
              className="sc-s-18 fit-container"
              src={ymaQR}
              style={{ aspectRatio: "1/1" }}
            />
          </div>
          <div className="fx-centered fx-col" style={{ gap: "10px" }}>
            <div className="fx-centered fx-col">
              <h4>Get the mobile app</h4>
              <p className="gray-c p-centered">
                Download the YakiHonne app for Android or iOS
              </p>
            </div>
            <div className="fx-centered fx-co fx-start-v">
              <a
                href="https://apps.apple.com/mo/app/yakihonne/id6472556189?l=en-GB"
                target="_blank"
              >
                <button className="btn btn-gray fx-centered">
                  <div className="apple"></div> Download iOS
                </button>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.yakihonne.yakihonne&hl=en&gl=US&pli=1"
                target="_blank"
              >
                <button className="btn btn-gray fx-centered">
                  <div className="google"></div> Download Android
                </button>
              </a>
            </div>
            <Link
              to={"/yakihonne-mobile-app"}
              className="fit-container"
              target="_blank"
            >
              <button className="btn btn-normal btn-full">Read more</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

{
  /* {userKeys &&  <ZapTip
recipientLNURL={process.env.REACT_APP_YAKI_LUD16}
recipientPubkey={process.env.REACT_APP_YAKI_PUBKEY}
senderPubkey={userKeys.pub}
recipientInfo={{
  name: "Yakihonne",
  img:
    "https://yakihonne.s3.ap-east-1.amazonaws.com/20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3/files/1691722198488-YAKIHONNES3.png",
}}
custom={{
  textColor: "",
  backgroundColor: "",
  content: "❤︎ Support us",
}}
/>} */
}
