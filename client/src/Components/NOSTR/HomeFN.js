import React, { useEffect, useRef, useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Date_ from "../Date_";
import Follow from "./Follow";
import { Link } from "react-router-dom";
import LoadingDots from "../LoadingDots";
import { nip19 } from "nostr-tools";

export default function HomeFN({ flashnews }) {
  const noScrollBarContainer = useRef(null);
  const noScrollBarContainerMain = useRef(null);
  const autoScrollTimer = useRef(null);
  const scrollStep = 1;
  const scrollDelay = 3000;
  const pauseDelay = 3000;

  useEffect(() => {
    var innerTimeout;
    const handleScroll = () => {
      if (
        noScrollBarContainer.current.scrollHeight -
          noScrollBarContainer.current.scrollTop ===
        noScrollBarContainer.current.clientHeight
      ) {
        clearInterval(autoScrollTimer.current);
        innerTimeout = setTimeout(() => {
          noScrollBarContainer.current.scrollTop = 0;
          startAutoScroll();
        }, pauseDelay);
      }
    };
    const handleMouseEnter = () => {
      clearInterval(autoScrollTimer.current);
    };

    const handleMouseLeave = () => {
      startAutoScroll();
    };
    if (!noScrollBarContainer.current) return;

    noScrollBarContainer.current.addEventListener("scroll", handleScroll);
    noScrollBarContainer.current.addEventListener(
      "mouseenter",
      handleMouseEnter
    );
    noScrollBarContainer.current.addEventListener(
      "mouseleave",
      handleMouseLeave
    );
    startAutoScroll();
    return () => {
      noScrollBarContainer.current?.removeEventListener("scroll", handleScroll);
      noScrollBarContainer.current?.removeEventListener(
        "mouseenter",
        handleMouseEnter
      );
      noScrollBarContainer.current?.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );
      clearInterval(autoScrollTimer.current);
      clearInterval(autoScrollTimer.current);
      if (innerTimeout) clearTimeout(innerTimeout);
    };
  }, [noScrollBarContainer.current]);

  const startAutoScroll = () => {
    autoScrollTimer.current = setInterval(() => {
      noScrollBarContainer.current?.scrollBy(0, scrollStep);
    }, scrollDelay);
  };

  if (!flashnews.length)
    return (
      <div
        className="fit-container fx-centered sc-s posts-card"
        style={{
          height: "200px",
          backgroundColor: "transparent",
          border: "none",
        }}
      >
        <LoadingDots />
      </div>
    );

  return (
    <div
      className="fit-container fx-centered fx-start-h "
      style={{ overflow: "visible", position: "relative" }}
    >
      <div
        className="fx-centered fx-wrap fx-start-h no-scrollbar"
        style={{ overflow: "visible" }}
        ref={noScrollBarContainerMain}
      >
        <div
          className="fx-centered fx-wrap fx-start-h no-scrollbar"
          style={{
            transition: ".3s ease-in-out",
            maxHeight: "380px",
            overflowX: "visible",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
          }}
          ref={noScrollBarContainer}
        >
          {flashnews.map((fn, index) => {
            return (
              <div
                className="fx-centered fit-container fx-start-h fx-stretch"
                style={{
                  border: "none",
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                  overflow: "visible",
                  columnGap: "16px",
                }}
                key={fn.flashnews.id}
              >
                <div className="fx-centered fx-col fx-start-h">
                  <h5 className="gray-c">&#x2022;</h5>
                  {index + 1 !== flashnews.length && (
                    <div
                      style={{
                        backgroundColor: "#555555",
                        width: "2px",
                        height: "100%",
                      }}
                    ></div>
                  )}
                </div>
                <div className="fx-centered fx-col fx-start-v">
                  <div className="fx-scattered fit-container">
                    <div className="fx-centered">
                      <UserProfilePicNOSTR
                        img={fn.author.picture}
                        size={16}
                        ring={false}
                        mainAccountUser={false}
                        user_id={fn.author.pubkey}
                      />
                      <div>
                        <p className="p-medium gray-c">
                          <Date_
                            toConvert={new Date(fn.flashnews.created_at * 1000)}
                            time={true}
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/flash-news/${nip19.neventEncode({
                      id: fn.flashnews.id,
                      author: fn.flashnews.pubkey,
                    })}`}
                  >
                    <p className="p-two-lines">{fn.flashnews.content}</p>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  // return (
  //   <div
  //     className="fit-container fx-centered fx-start-h carouselX"
  //     style={{ overflow: "visible", position: "relative" }}
  //   >
  //     <div
  //       className="fx-centered fx-wrap fx-start-h no-scrollbar"
  //       style={{ overflow: "visible" }}
  //       ref={noScrollBarContainerMain}
  //     >
  //       <div
  //         className="fx-centered fx-wrap fx-start-h no-scrollbar"
  //         style={{
  //           transition: ".3s ease-in-out",
  //           maxHeight: "380px",
  //           overflowX: "visible",
  //           overflowY: "scroll",
  //           scrollSnapType: "y mandatory",
  //           scrollBehavior: "smooth",
  //         }}
  //         ref={noScrollBarContainer}
  //       >
  //         {flashnews.map((fn) => {
  //           let rating = fn.sealed_note
  //             ? fn.sealed_note.tags.find((tag) => tag[0] === "rating")[1] ===
  //               "+"
  //               ? true
  //               : false
  //             : false;
  //           return (
  //             <div
  //               className="fx-centered fx-col fit-container fx-start-v sc-s-18  box-pad-h-m box-pad-v-m"
  //               style={{
  //                 backgroundColor: "var(--dim-gray)",
  //                 border: "none",
  //                 scrollSnapAlign: "start",
  //                 scrollSnapStop: "always",
  //                 overflow: "visible",
  //               }}
  //               key={fn.flashnews.id}
  //             >
  //               <div className="fx-scattered fit-container">
  //                 <div className="fx-centered">
  //                   <UserProfilePicNOSTR
  //                     img={fn.author.picture}
  //                     size={32}
  //                     ring={false}
  //                     mainAccountUser={false}
  //                     user_id={fn.author.pubkey}
  //                   />
  //                   <div>
  //                     <p className="p-medium">
  //                       {fn.author.display_name || fn.author.name}
  //                     </p>
  //                     <p className="p-medium gray-c p-small">
  //                       @{fn.author.name || fn.author.display_name}
  //                     </p>
  //                   </div>
  //                 </div>
  //                 <Follow
  //                   size="small"
  //                   toFollowKey={fn.author.pubkey}
  //                   toFollowName={fn.author.display_name || fn.author.name}
  //                   bulkList={[]}
  //                 />
  //               </div>

  //               <Link to={`/flash-news/${fn.flashnews.nEvent}`}>
  //                 <p className="p-two-lines p-medium">{fn.flashnews.content}</p>
  //                 <p className="blue-c p-medium">See more</p>
  //               </Link>
  //               <div className="fit-container fx-scattered">
  //                 <div className="fx-centered">
  //                   <p className="p-medium orange-c">
  //                     <Date_
  //                       toConvert={new Date(fn.flashnews.created_at * 1000)}
  //                       time={true}
  //                     />
  //                   </p>
  //                 </div>
  //                 <div>
  //                   {fn.nmh_notes && (
  //                     <div
  //                       className=" pointer fx-centered  round-icon-tooltip"
  //                       data-tooltip="notes waiting rating"
  //                       style={{ columnGap: "4px", filter: "invert()" }}
  //                     >
  //                       <div
  //                         className="note"
  //                         style={{ filter: "brightness(0)" }}
  //                       ></div>
  //                       <p className="gray-c p-medium">
  //                         {fn.nmh_notes.length >= 10
  //                           ? fn.nmh_notes.length
  //                           : `0${fn.nmh_notes.length}`}
  //                       </p>
  //                     </div>
  //                   )}
  //                   {fn.sealed_note && (
  //                     <div
  //                       className="round-icon-tooltip pointer"
  //                       data-tooltip={
  //                         rating ? "Checked positively" : "Checked negatively"
  //                       }
  //                       style={{ filter: "invert()" }}
  //                     >
  //                       <div
  //                         className="checkmark"
  //                         style={{ filter: "invert()" }}
  //                       ></div>
  //                     </div>
  //                   )}
  //                 </div>
  //               </div>
  //             </div>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   </div>
  // );
}
