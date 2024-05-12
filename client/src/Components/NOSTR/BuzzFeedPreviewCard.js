import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Date_ from "../Date_";
import { Context } from "../../Context/Context";

export default function BuzzFeedPreviewCard({ item }) {
  const [artURL, setArtURL] = useState(`${item.nEvent}`);

  return (
    <div
      className={"fit-container fx-scattered sc-s-18 "}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "relative",
        columnGap: "16px",
      }}
    >
      <Link
        key={item.id}
        style={{
          backgroundImage: `url(${item.image})`,
        }}
        to={`/buzz-feed/${item.nEvent}`}
        className="fit-container fx-scattered fx-col bg-img cover-bg pointer"
      >
        <div style={{ height: "50px" }}></div>
        <div
          className="fit-container fx-centered fx-start-h fx-wrap box-pad-h-m box-pad-v-m"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 87%)",
          }}
        >
          {/* <div className="fit-container box-marg-full"></div> */}
          {/* <div className="fit-container box-marg-full"></div> */}
          <div>
            <p className="fit-container p-medium gray-c left-p">
              <Date_ toConvert={new Date(item.published_at * 1000)} time={true}/>
            </p>
            <p className="fit-container left-p" style={{ color: "white" }}>
              {item.title}
            </p>
          </div>
          <div className="fit-container fx-scattered">
            <a
              className="fx-centered"
              href={item.source_domain}
              target="_blank"
            >
              <div
                style={{
                  minWidth: "20px",
                  minHeight: "20px",
                  borderRadius: "var(--border-r-50)",
                  backgroundImage: `url(${item.source_icon})`,
                }}
                className="bg-img cover-bg"
              ></div>
              <p className="p-medium">{item.source_name}</p>
            </a>
            <a
              href={item.source_url}
              target="_blank"
              className="round-icon-tooltip"
              data-tooltip="source"
            >
              <div className="share-icon"></div>
            </a>
          </div>
        </div>
      </Link>
    </div>
  );
  //   return (
  //     <div
  //       className={"posts-card fx-scattered sc-s-18 box-pad-h-m"}
  //       onClick={(e) => e.stopPropagation()}
  //       style={{
  //         position: "relative",
  //         overflow: "visible",
  //         columnGap: "16px",
  //         borderLeft: "2px solid var(--green-main)",
  //         borderTopLeftRadius: 0,
  //         borderBottomLeftRadius: 0,
  //       }}
  //     >
  //       <div className="fx-scattered fit-container" style={{ columnGap: "32px" }}>
  //         <div className="fit-container">
  //           <div className="fx-scattered box-pad-v-m">
  //             <div className="fx-centered">
  //               <AuthorPreview author={authorData} />
  //               <p className="p-medium gray-c">|</p>
  //               <div className="fx-start-h fx-centered">
  //                 <p className="p-medium gray-c">
  //                   <Date_
  //                     toConvert={new Date(item.created_at * 1000)}
  //                     time={true}
  //                   />
  //                 </p>
  //               </div>
  //               {isFollowing && (
  //                 <div className="sticker sticker-small sticker-c1">
  //                   following
  //                 </div>
  //               )}
  //             </div>
  //             <div className="fx-centered">
  //               <SaveArticleAsBookmark pubkey={item.id} itemType="e" kind="1" />
  //             </div>
  //           </div>
  //           {(item.is_important || item.keywords.length > 0) && (
  //             <div
  //               className="fx-centered fx-start-h fx-wrap box-marg-s"
  //               style={{ rowGap: 0, columnGap: "4px" }}
  //             >
  //               {item.is_important && (
  //                 <div className="sticker sticker-small sticker-c1-pale">
  //                   <svg
  //                     viewBox="0 0 13 12"
  //                     xmlns="http://www.w3.org/2000/svg"
  //                     className="hot"
  //                   >
  //                     <path d="M10.0632 3.02755C8.69826 3.43868 8.44835 4.60408 8.5364 5.34427C7.56265 4.13548 7.60264 2.74493 7.60264 0.741577C4.47967 1.98517 5.20595 5.57072 5.11255 6.65955C4.32705 5.98056 4.17862 4.35822 4.17862 4.35822C3.3494 4.80884 2.93359 6.01229 2.93359 6.98846C2.93359 9.34905 4.7453 11.2626 6.98011 11.2626C9.21492 11.2626 11.0266 9.34905 11.0266 6.98846C11.0266 5.58561 10.0514 4.93848 10.0632 3.02755Z"></path>
  //                   </svg>
  //                   Important
  //                 </div>
  //               )}
  //               {item.keywords.map((keyword, index) => {
  //                 return (
  //                   // <div
  //                   //   key={keyword}
  //                   //   className="sticker sticker-small sticker-gray-black"
  //                   // >
  //                   <Link
  //                     key={`${keyword}-${index}`}
  //                     className="sticker sticker-small sticker-gray-black"
  //                     to={`/tags/${keyword.replace("#", "%23")}`}
  //                     target={"_blank"}
  //                     onClick={(e) => e.stopPropagation()}
  //                   >
  //                     {keyword}
  //                   </Link>
  //                   // </div>
  //                 );
  //               })}
  //             </div>
  //           )}
  //           <Link
  //             to={`/flash-news/${artURL}`}
  //             className="fit-container fx-centered fx-start-h fx-start-v fx-col"
  //           >
  //             <div className="fit-container">{item.content}</div>
  //           </Link>
  //           <Link
  //             className="fit-container "
  //             onClick={(e) => e.stopPropagation()}
  //             to={`/uncensored-notes/${item.nEvent}`}
  //           >
  //             <div
  //               className="fx-scattered fit-container option if pointer  box-marg-s"
  //               style={{
  //                 border: "none",
  //                 backgroundColor: "var(--very-dim-gray)",
  //               }}
  //             >
  //               <p className="gray-c">See all uncensored notes</p>
  //               <div
  //                 className="arrow"
  //                 style={{ transform: "rotate(-90deg)" }}
  //               ></div>
  //             </div>
  //           </Link>
  //         </div>
  //       </div>
  //     </div>
  //   );
}
