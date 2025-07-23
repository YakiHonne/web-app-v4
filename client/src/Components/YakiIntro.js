import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ymaQR from "../media/images/yma-qr.png";
import { setToast } from "../Store/Slides/Publishers";
import { useDispatch } from "react-redux";
import DonationBoxSuggestionCards from "./SuggestionsCards/DonationBoxSuggestionCards";

const content = [
  {
    url: "/yakihonne-smart-widgets",
    thumbnail:
      "https://yakihonne.s3.ap-east-1.amazonaws.com/sw-thumbnails/update-smart-widget.png",
    tag: "Smart widgets",
    new: true,
  },
  {
    url: "/points-system",
    thumbnail:
      "https://yakihonne.s3.ap-east-1.amazonaws.com/sw-thumbnails/update-points-system.png",
    tag: "Points system",
    new: false,
  },
  {
    url: "/yakihonne-paid-notes",
    thumbnail:
      "https://yakihonne.s3.ap-east-1.amazonaws.com/sw-thumbnails/update-flash-news.png",
    tag: "Paid note",
    new: false,
  },
  {
    url: "/yakihonne-mobile-app",
    thumbnail:
      "https://yakihonne.s3.ap-east-1.amazonaws.com/sw-thumbnails/update-mobile-app.png",
    tag: "Mobile app",
    new: false,
  },
];

export default function YakiIntro() {
  const [swipe, setSwipe] = useState(false);
  const [showMobileAd, setShowMobileAd] = useState(false);
  const [up, setUp] = useState(false);

  useEffect(() => {
    const handleScroll = (e) => {
      let el = document.querySelector(".main-page-nostr-container");
      if (!el) return;
      if (el.scrollTop >= 600) setUp(true);
      else setUp(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {swipe && <Banner exit={() => setSwipe(false)} />}
      {/* {showMobileAd &&  <MobileAppQR exit={() => setShowMobileAd(false)}/>} */}
      <div
        style={{
          position: "fixed",
          right: "38px",
          bottom: up ? "94px" : "16px",
          // top: "16px",
          transition: ".2s ease-in-out",
          zIndex: "1000000",
        }}
        className="fx-centered fx-end-h"
      >
        {/* <button className="btn btn-gray btn-small">Mobile app</button> */}
        {/* onClick={() => setShowMobileAd(true)} */}
        {/* <button className="btn btn-gst" style={{backgroundColor: "var(--orange-side)", boxShadow: "0 4px 25px  var(--orange-side)"}}>Mobile app</button> */}
        {!swipe && (
          <div className="slide-right" onClick={() => setSwipe(!swipe)}>
            <div className="info-24"></div>
          </div>
        )}
      </div>
    </>
  );
}

const MobileAppQR = ({ exit }) => {
  const dispatch = useDispatch();
  const copyKey = (keyType, key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${keyType} was copied! 👏`,
      })
    );
  };
  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        style={{ width: "min(100%, 350px)", position: "relative" }}
        className="fx-centered fx-col box-pad-h box-pad-v sc-s-18 bg-sp"
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4>Get the mobile app</h4>
        <p className="gray-c p-centered" style={{ maxWidth: "250px" }}>
          Download the YakiHonne app for Android or iOS
        </p>
        <div className="fit-container ">
          <img
            className="sc-s-18 fit-container"
            src={ymaQR}
            style={{ aspectRatio: "1/1" }}
          />
        </div>
        <div
          className={"fx-scattered if pointer fit-container dashed-onH"}
          style={{ borderStyle: "dashed" }}
          onClick={() =>
            copyKey("Link", `https://yakihonne.com/yakihonne-mobile-app-links`)
          }
        >
          <div className="link-24"></div>
          <p className="p-one-line">{`https://yakihonne.com/yakihonne-mobile-app-links`}</p>
          <div className="copy-24"></div>
        </div>
      </div>
    </div>
  );
};

const Banner = ({ exit }) => {
  return (
    <div
      style={{
        position: "fixed",
        right: "0",
        top: 0,
        transition: ".2s ease-in-out",
        width: "100vw",
        height: "100vh",
        zIndex: "100000000",
      }}
      className="fixed-container fx-centered fx-col fx-end-v  box-pad-h"
      onClick={(e) => {
        e.stopPropagation();
        exit();
      }}
    >
      <div
        className="fx-scattered box-pad-v-s"
        style={{ width: "min(100%, 400px)" }}
      >
        <h4>Updates news</h4>
        <div className="close" style={{ position: "static" }} onClick={exit}>
          <div></div>
        </div>
      </div>
      <div
        style={{
          height: "90%",
          width: "min(100%, 400px)",
          position: "relative",
          backgroundColor: "transparent",
          border: "none",
        }}
        className="sc-s-18 bg-img cover-bg fx-centered fx-start-v "
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          className="fit-container fit-height fx-centered fx-col fx-start-h fx-start-v box-pad-h-s box-pad-v-s"
          style={{ overflow: "scroll" }}
        >
          <div
            className="box-pad-h-m box-pad-v-m fit-container sc-s-18 fx-shrink"
            style={{
              position: "relative",
            }}
          >
            <div className="fit-container fx-scattered">
              <div>
                <p>Updates</p>
                <p className="gray-c p-italic p-medium">
                  Last updated July 22, 2025
                </p>
              </div>
              <p className="orange-c p-medium">
                v{process.env.REACT_APP_APP_VERSION}
              </p>
            </div>
            <div className="box-pad-v-s"></div>
            <ul>
              <li>
                Secure login with remote signers (nSec Bunkers) is now available
                for safer account management.
              </li>
              <li>
                BLOSSOM is now supported, allowing you to upload, mirror, and
                access mirrored files—with easy server setup in settings.
              </li>
              <li>
                The zapping window has a brand-new design—quick wallet
                switching, recipient previews, and a bigger, more user-friendly
                layout make sending zaps easier than ever.
              </li>
              <li>
                Favorite relays support lets you easily access and manage your
                go-to relay sources when browsing content.
              </li>
              <li>
                Smart Widget AI Assistant is live! Developers can now get
                real-time help to build and use smart widgets more easily.
              </li>
              <li>
                Lightning payments through miniapps are now supported, letting
                developers securely trigger payments via smart widgets.
              </li>
              <li>
                Web of Trust is now everywhere, helping improve post stats,
                notifications, and messaging based on who you trust.
              </li>
              <li>
                Set your own trust score threshold in settings to fine-tune what
                you see and who you interact with.
              </li>
              <li>
                Custom messaging relays let you send and receive DMs through the
                relays you choose.
              </li>
              <li>
                Relay settings got a fresh redesign for a cleaner, more
                intuitive experience.
              </li>
              <li>
                Notifications now load faster, giving you a smoother experience
                all around.
              </li>
              <li>
                Search is faster and smarter—across spotlight, the main search
                page, and mentions in notes.
              </li>
              <li>
                Refined dashboard layout for a smoother and more intuitive user
                experience.
              </li>
              <li>
                See signer types at a glance in the side menu to better
                understand each connected account.
              </li>
              <li>
                Interest list added to both the search page and spotlight for
                quicker content discovery.
              </li>
              <li>
                Arabic and French language support has been added for a more
                inclusive experience.
              </li>
              <li>
                Removing selected filter now stick—your choices are remembered
                even after refreshing the page.
              </li>
              <li>General improvements and bug fix</li>
            </ul>
          </div>
          {content.map((card, index) => {
            return (
              <Link
                to={card.url}
                target="_blank"
                className="box-pad-h box-pad-v fit-container sc-s-18 pointer option fx-shrink bg-img cover-bg"
                style={{
                  aspectRatio: "16/9",
                  position: "relative",
                  borderColor: card.new ? "var(--orange-main)" : "",
                  backgroundImage: `url(${card.thumbnail})`,
                }}
                key={index}
              >
                <div
                  className="sticker sticker-normal "
                  style={{
                    position: "absolute",
                    left: card.new ? "50px" : 0,
                    paddingLeft: card.new ? "25px" : "",
                    top: 0,
                    color: "white",
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: 0,
                    backgroundColor: "#555555",
                  }}
                >
                  <p className="p-medium p-italic ">{card.tag}</p>
                </div>
                {card.new && (
                  <div
                    className="sticker sticker-normal "
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      color: card.new ? "white" : "var(--gray)",
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: 0,
                      backgroundColor: card.new
                        ? "var(--orange-main)"
                        : "var(--dim-gray)",
                    }}
                  >
                    <p className="p-medium p-italic ">New</p>
                  </div>
                )}
              </Link>
            );
          })}
          <DonationBoxSuggestionCards padding={false} />
        </div>
      </div>
    </div>
  );
};
