import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
      <div
        style={{
          position: "fixed",
          right: "38px",
          bottom: up ? "74px" : "16px",
          transition: ".2s ease-in-out",
          zIndex: "1000000",
        }}
        className="fx-centered fx-end-h"
      >
        {!swipe && (
          <div className="slide-right" onClick={() => setSwipe(!swipe)}>
            {/* <div className="bunny-icon"></div> */}
            <div className="info-24"></div>
          </div>
        )}
      </div>
    </>
  );
}

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
        className="sc-s-18 bg-img cover-bg fx-centered fx-start-v slide-right carouselX"
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
                  Last updated Oct 30, 2024
                </p>
              </div>
              <p className="orange-c p-medium">
                v{process.env.REACT_APP_APP_VERSION}
              </p>
            </div>
            <p>{`
- A fresh design overhaul for the article, video, and curation pages, enabling seamless browsing and enhanced interaction with content.
- Connected threads! A refined notes thread makes following entire discussions more intuitive.
- Users can now personalize their home feed by selecting their top interests.
- The suggestions box on the home page can now be hidden.
- The on-hover user preview can now be disabled for quicker access to profiles.
- General improvements.
- Bug fixes and optimizations.
`}</p>
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
          <div className="box-pad-v"></div>
        </div>
      </div>
    </div>
  );
};

// - An entirely enhanced app core for faster, more reliable, and solid interaction with the Nostr network.
// - A redesigned UI/UX offering greater content visibility and a more user-friendly experience, featuring a new color palette, modern typeface, and sleek content cards.
// - A refreshed onboarding page to make logging in or creating new accounts quicker and more welcoming.
// - The new Discover page is now the hub for all media content, including articles, videos, and curated posts, offering easy access to what people are sharing and posting recently.
// - A redesigned Notifications page keeps you updated on the activities of those you follow and what others are saying about your published content.
// - A welcoming Dashboard, where you can manage all your published content in one place, quickly and easily.
// - Users without a wallet can now create one directly within Yakihonne to start sending and receiving zaps with their favorite people.
// - The Search feature is now faster, allowing you to paste any Nostr scheme or search for users or content directly from your sidebar.
// - Your published events are now saved in your browser for later management if they fail to publish when relays don't connect on the first try.
// - The Uncensored Notes page has been renamed to Verify Notes, keeping all the features you love, just as before.