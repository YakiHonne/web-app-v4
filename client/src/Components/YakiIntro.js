import React, { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../Context/Context";
import hero from "../media/images/yaki-intro.jpg";
import Follow from "./NOSTR/Follow";
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
    url: "/yakihonne-flash-news",
    thumbnail:
      "https://yakihonne.s3.ap-east-1.amazonaws.com/sw-thumbnails/update-flash-news.png",
    tag: "Flash news",
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
  const ref = useRef(null);

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
          // right: "-200px",
          // bottom: "128px",
          // transform: "translateY(-50%)",
          right: "0px",
          bottom: up ? "74px" : "16px",
          transition: ".2s ease-in-out",
          zIndex: "1000000",
        }}
        className="fx-centered fx-end-h"
      >
        {!swipe && (
          <div className="slide-right" onClick={() => setSwipe(!swipe)}>
            {/* <div
              style={{
                border: "none",
                background: "var(--dim-gray)",
                transform: "rotate(-90deg) translateY(-150px)",
              }}
              className="fx-centered pointer sc-s box-pad-h box-pad-v-m "
              onClick={() => setSwipe(!swipe)}
            >
              <div>Hey 👋🏻 Check me!</div>
            </div> */}
            <div className="bunny-icon"></div>
          </div>
        )}
      </div>
    </>
  );
}

const Banner = ({ exit }) => {
  const { nostrKeys } = useContext(Context);
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
                    // color: card.new ? "white" : "var(--gray)",
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
                  Last updated Aug 16, 2024
                </p>
              </div>
              <p className="orange-c p-medium">v3.121.0</p>
            </div>
            <p>{`
- Smart widgets are here! Our new feature.
- Our new bunny on the right side to notify you about new updates.
- Notes now appear first in order in the home page.
- The ability to add smart widgets on notes.
- The ability to tag people on notes.
- Mentioned smart widgets and uploaded images are now sorted as a gallery for easy access while creating a note.
- Minor design changes and scaling.
- Optimizing singin/signup performance
- Bug fix.
`}</p>
            <div className="fit-container fx-centered box-pad-v">
              <p className="orange-c p-medium">
                {" "}
                {">>"} The end 😁 {"<<"}{" "}
              </p>
            </div>
            <div className="box-pad-v"></div>
            <div className="box-pad-v"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
// const Banner = ({ exit }) => {
//   const { nostrKeys } = useContext(Context);
//   return (
//     <div
//       style={{
//         position: "fixed",
//         right: "0",
//         top: 0,
//         transition: ".2s ease-in-out",
//         width: "100vw",
//         height: "100vh",
//         zIndex: "100000000",
//       }}
//       className="fx-centered fx-end-h box-pad-h"
//       onClick={(e) => {
//         e.stopPropagation();
//         exit();
//       }}
//     >
//       <div
//         style={{
//           height: "90%",
//           width: "min(100%, 400px)",
//           backgroundImage: `url(${hero})`,
//           border: "none",
//           position: "relative",
//         }}
//         className="sc-s bg-img cover-bg fx-centered fx-end-v box-pad-h slide-right"
//         onClick={(e) => {
//           e.stopPropagation();
//         }}
//       >
//         <div className="close" onClick={exit}>
//           <div></div>
//         </div>
//         <div
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: "100%",
//             height: "100%",
//             zIndex: 0,
//             background:
//               "linear-gradient(179.82deg, rgba(0, 0, 0, 0) 19.91%, #000000 93.18%)",
//           }}
//           className="fx-centered fx-end-v"
//         ></div>
//         <div
//           className="fit-container fx-centered fx-col"
//           style={{ height: "50%", position: "relative", zIndex: "1" }}
//         >
//           <div
//             className="yakihonne-logo"
//             style={{ filter: "brightness(0) invert()" }}
//           ></div>
//           <p
//             className="p-centered"
//             style={{ maxWidth: "400px", color: "white" }}
//           >
//             YakiHonne is a Nostr-based decentralized content media protocol,
//             which supports free curation, creation, publishing, and reporting by
//             various media.
//           </p>
//           {nostrKeys && (
//             <div className="fit-container fx-centered box-pad-v fx-col">
//               <Follow
//                 toFollowKey={
//                   "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3"
//                 }
//                 toFollowName={"Yakihonne"}
//               />
//               {/* <button className="btn btn-normal">Read about us</button> */}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
