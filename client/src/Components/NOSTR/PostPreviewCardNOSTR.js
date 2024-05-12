import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Date_ from "../Date_";
import placeholder from "../../media/images/nostr-thumbnail-ph.svg";
import { Context } from "../../Context/Context";
import relaysOnPlatform from "../../Content/Relays";
import { relayInit, SimplePool } from "nostr-tools";
import SaveArticleAsBookmark from "./SaveArticleAsBookmark";
import { convertDate } from "../../Helpers/Encryptions";
import { getImagePlaceholder } from "../../Content/NostrPPPlaceholder";
import { getAuthPubkeyFromNip05 } from "../../Helpers/Helpers";
import Slider from "../Slider";

const pool = new SimplePool();

const checkFollowing = (list, toFollowKey) => {
  if (!list) return false;
  return list.find((people) => people[1] === toFollowKey) ? true : false;
};

export default function PostPreviewCardNOSTR({ item, highlithedTag = "" }) {
  const { nostrUser, getNostrAuthor, nostrAuthors } = useContext(Context);
  let [isThumbnailValid, setIsThumbnailValid] = useState(false);
  const [authorData, setAuthorData] = useState({
    author_img: item.author_img,
    author_pubkey: item.author_pubkey,
    author_name: item.author_name,
  });
  const [artURL, setArtURL] = useState(`${item.naddr}`);
  const [showContent, setShowContent] = useState(!item.contentSensitive);
  const [showArrows, setShowArrows] = useState(false);
  const [scrollPX, setScrollPX] = useState(0);

  const noScrollBarContainer = useRef(null);
  const noScrollBarContainerMain = useRef(null);

  const isFollowing = useMemo(() => {
    return checkFollowing(nostrUser?.following, item.author_pubkey);
  }, [nostrUser]);

  useEffect(() => {
    let carousel_container = noScrollBarContainerMain.current;
    let carousel = noScrollBarContainer.current;
    if (!(carousel && carousel_container)) return;
    if (carousel_container.clientWidth < carousel.scrollWidth) {
      setShowArrows(true);
      setScrollPX(0);
    } else {
      setShowArrows(false);
      setScrollPX(0);
    }
  }, []);

  useEffect(() => {
    var img = new Image();
    img.onload = function () {
      setIsThumbnailValid(true);
    };
    img.onerror = function () {
      setIsThumbnailValid(false);
    };
    img.src = item.thumbnail;
  }, [item.thumbnail]);

  const slideRight = () => {
    let carousel_container = noScrollBarContainerMain.current;
    let carousel = noScrollBarContainer.current;

    let pxToSlide =
      scrollPX + 100 < carousel.scrollWidth - carousel_container.clientWidth
        ? scrollPX + 100
        : carousel.scrollWidth - carousel_container.clientWidth;
    setScrollPX(pxToSlide);
  };
  const slideLeft = () => {
    let pxToSlide = scrollPX - 100 > 0 ? scrollPX - 100 : 0;
    setScrollPX(pxToSlide);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getNostrAuthor(item.author_pubkey);

        if (auth) {
          setAuthorData({
            author_img: auth.picture,
            author_name: auth.name,
            author_pubkey: auth.pubkey,
          });
          if (auth.nip05) {
            let authPubkey = await getAuthPubkeyFromNip05(auth.nip05);
            if (authPubkey) setArtURL(`${auth.nip05}/${item.d}`);
          }
        }
        return;
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [nostrAuthors]);

  return (
    <div
      className={"fit-container fx-scattered sc-s-18 box-pad-h-m"}
      onClick={(e) => e.stopPropagation()}
      style={{
        // borderColor: isFollowing ? "var(--c1)" : "",
        position: "relative",
        overflow: "visible",
        columnGap: "16px",
      }}
    >
      {!showContent && (
        <div className="rvl-btn sc-s-18">
          <p className="box-pad-v-m gray-c">
            This is a sensitive content, do you wish to reveal it?
          </p>
          <button
            className="btn-small btn-normal"
            onClick={() => setShowContent(true)}
          >
            Reveal
          </button>
        </div>
      )}
      <div className="fx-scattered fit-container" style={{ columnGap: "32px" }}>
        <div className="fit-container">
          <div className="fx-scattered box-pad-v-m">
            <div className="fx-centered">
              <AuthorPreview author={authorData} />
              <p className="p-medium gray-c">|</p>
              <div className="fx-start-h fx-centered">
                {/* <p className="p-medium gray-c">
                  <Date_ toConvert={item.added_date} />
                </p> */}
                {/* <div
                  className="round-icon-tooltip"
                  data-tooltip={`created at ${convertDate(
                    item.added_date
                  )}, edited on ${convertDate(item.modified_date)}`}
                >
                  <div className="edit"></div>
                </div> */}
                <p
                  className="pointer p-medium gray-c round-icon-tooltip"
                  data-tooltip={`created at ${convertDate(
                    item.added_date
                  )}, edited on ${convertDate(item.modified_date)}`}
                >
                 <Date_ toConvert={item.modified_date} time={true}/>
                </p>
              </div>
              {isFollowing && (
                <div className="sticker sticker-small sticker-c1">
                  following
                </div>
              )}
            </div>
            <div className="fx-centered">
              <SaveArticleAsBookmark
                pubkey={item.author_pubkey}
                kind={30023}
                d={item.d}
                image={item.thumbnail}
              />
            </div>
          </div>
          <Link
            to={`/article/${artURL}`}
            className="fit-container fx-scattered"
          >
            <div>
              <div className=" fx-scattered">
                <h4 className="p-three-lines">{item.title}</h4>
              </div>
              <div className="box-pad-v-s ">
                <p className="p-three-lines p-medium gray-c fit-container">
                  {item.summary}
                </p>
              </div>
            </div>
            {item.thumbnail && (
              <div
                className=" bg-img cover-bg sc-s "
                style={{
                  backgroundColor:
                    "linear-gradient(93deg, #880185 -6.44%, #FA4EFF 138.71%)",
                  backgroundImage: `url(${item.thumbnail})`,
                  minWidth: "100px",
                  aspectRatio: "1/1",
                  // borderRadius: "var(--border-r-50)",
                  border: "none",
                }}
              ></div>
            )}
          </Link>

          {/* <Link className="pointer fit-container" to={`/article/${artURL}`}>
            <div
              className="fit-container bg-img cover-bg sc-s-18 "
              style={{
                backgroundColor:
                  "linear-gradient(93deg, #880185 -6.44%, #FA4EFF 138.71%)",
                backgroundImage: `url(${item.thumbnail})`,
                width: "100%",
                aspectRatio: "16/9",
                border: "none",
              }}
            ></div>
          </Link> */}
          {item.postTags.length === 0 && <div className="box-pad-v-s"></div>}
          {item.postTags.length > 0 && (
            <div
              className="fit-container fx-scattered box-pad-v-m"
              style={{ marginTop: ".5rem" }}
            >
              {showArrows && (
                <div
                  className="box-pad-h-s pointer slide-right"
                  onClick={slideLeft}
                >
                  <div
                    className="arrow"
                    style={{ transform: "rotate(90deg)" }}
                  ></div>
                </div>
              )}
              <div
                className="fx-centered fx-start-h no-scrollbar"
                style={{ overflow: "hidden" }}
                ref={noScrollBarContainerMain}
              >
                <div
                  className="fx-centered fx-start-h no-scrollbar"
                  style={{
                    transform: `translateX(-${scrollPX}px)`,
                    transition: ".3s ease-in-out",
                  }}
                  ref={noScrollBarContainer}
                >
                  {item.postTags.map((tag, index) => {
                    if (!tag) return;
                    if (highlithedTag && highlithedTag === tag)
                      return (
                        <Link
                          key={`${tag}-${index}`}
                          style={{
                            textDecoration: "none",
                            color: "var(--white)",
                          }}
                          className="sticker sticker-small sticker-c1 fx-shrink"
                          to={`/tags/${tag.replace("#", "%23")}`}
                          target={"_blank"}
                        >
                          {tag}
                        </Link>
                      );
                    return (
                      <Link
                        key={`${tag}-${index}`}
                        style={{
                          textDecoration: "none",
                          color: "var(--gray)",
                        }}
                        className="sticker sticker-small sticker-gray-gray fx-shrink"
                        to={`/tags/${tag.replace("#", "%23")}`}
                        target={"_blank"}
                      >
                        {tag}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {showArrows && (
                <div
                  className="box-pad-h-s pointer slide-left"
                  onClick={slideRight}
                >
                  <div
                    className="arrow"
                    style={{ transform: "rotate(-90deg)" }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  // return (
  //   <div
  //     className={"posts-card fx-scattered sc-s-18 box-pad-h-m"}
  //     onClick={(e) => e.stopPropagation()}
  //     style={{
  //       borderColor: isFollowing ? "var(--c1)" : "",
  //       position: "relative",
  //       overflow: "visible",
  //       columnGap: "16px",
  //     }}
  //   >
  //     {!showContent && (
  //       <div className="rvl-btn">
  //         <p className="box-pad-v-m gray-c">
  //           This is a sensitive content, do you wish to reveal it?
  //         </p>
  //         <button
  //           className="btn-small btn-normal"
  //           onClick={() => setShowContent(true)}
  //         >
  //           Reveal
  //         </button>
  //       </div>
  //     )}
  //     <div
  //       className="box-pad-v fx-scattered posts-card-desc"
  //       style={{ columnGap: "32px" }}
  //     >
  //       <div className="fit-container">
  //         <div className="fx-centered fx-start-h box-marg-s">
  //           <AuthorPreview author={authorData} />
  //           <p className="p-medium gray-c">|</p>
  //           <div className="fx-start-h fx-centered">
  //             <p className="p-medium gray-c">
  //               <Date_ toConvert={item.added_date} />
  //             </p>
  //             <div
  //               className="edit icon-tooltip"
  //               data-tooltip={`created at ${convertDate(
  //                 item.added_date
  //               )}, edited on ${convertDate(item.modified_date)}`}
  //             ></div>
  //             <p className="p-medium gray-c">
  //               <Date_ toConvert={item.modified_date} />
  //             </p>
  //           </div>
  //           {isFollowing && (
  //             <div className="sticker sticker-small sticker-c1">following</div>
  //           )}
  //         </div>
  //         <Link
  //           to={`/article/${artURL}`}
  //           className="fit-container fx-centered fx-start-h fx-start-v fx-col"
  //           style={{
  //             aspectRatio: "unset",
  //             borderRadius: "0",
  //           }}
  //         >
  //           <div className="fit-container fx-scattered">
  //             <h4>{item.title}</h4>
  //             <div className="pointer thumbnail-mob">
  //               <div
  //                 className="fit-container bg-img cover-bg"
  //                 style={{
  //                   backgroundColor:
  //                     "linear-gradient(93deg, #880185 -6.44%, #FA4EFF 138.71%)",
  //                   backgroundImage: `url(${item.thumbnail})`,
  //                   width: "50px",
  //                   height: "50px",
  //                   borderRadius: "var(--border-r-50)",
  //                 }}
  //               ></div>
  //             </div>
  //             {/* )} */}
  //           </div>
  //           <div className="box-pad-v-s">
  //             <p className="p-four-lines p-medium gray-c">{item.summary}</p>
  //           </div>
  //         </Link>
  //         <div
  //           className="fit-container fx-scattered"
  //           style={{ marginTop: ".5rem" }}
  //         >
  //           <div
  //             className="fx-scattered fit-container"
  //             style={{ maxWidth: "90%" }}
  //           >
  //             {showArrows && (
  //               <div
  //                 className="box-pad-h-s pointer slide-right"
  //                 onClick={slideLeft}
  //               >
  //                 <div
  //                   className="arrow"
  //                   style={{ transform: "rotate(90deg)" }}
  //                 ></div>
  //               </div>
  //             )}
  //             <div
  //               className="fx-centered fx-start-h no-scrollbar"
  //               style={{ overflow: "hidden" }}
  //               ref={noScrollBarContainerMain}
  //             >
  //               <div
  //                 className="fx-centered fx-start-h no-scrollbar"
  //                 style={{
  //                   transform: `translateX(-${scrollPX}px)`,
  //                   transition: ".3s ease-in-out",
  //                 }}
  //                 ref={noScrollBarContainer}
  //               >
  //                 {item.postTags.map((tag, index) => {
  //                   if (!tag) return;
  //                   if (highlithedTag && highlithedTag === tag)
  //                     return (
  //                       <Link
  //                         key={`${tag}-${index}`}
  //                         style={{
  //                           textDecoration: "none",
  //                           color: "var(--white)",
  //                         }}
  //                         className="sticker sticker-small sticker-c1 fx-shrink"
  //                         to={`/tags/${tag.replace("#", "%23")}`}
  //                         target={"_blank"}
  //                       >
  //                         {tag}
  //                       </Link>
  //                     );
  //                   return (
  //                     <Link
  //                       key={`${tag}-${index}`}
  //                       style={{
  //                         textDecoration: "none",
  //                         color: "var(--gray)",
  //                       }}
  //                       className="sticker sticker-small sticker-gray-gray fx-shrink"
  //                       to={`/tags/${tag.replace("#", "%23")}`}
  //                       target={"_blank"}
  //                     >
  //                       {tag}
  //                     </Link>
  //                   );
  //                 })}
  //               </div>
  //             </div>

  //             {showArrows && (
  //               <div
  //                 className="box-pad-h-s pointer slide-left"
  //                 onClick={slideRight}
  //               >
  //                 <div
  //                   className="arrow"
  //                   style={{ transform: "rotate(-90deg)" }}
  //                 ></div>
  //               </div>
  //             )}
  //           </div>

  //           <div className="fx-centered">
  //             <SaveArticleAsBookmark
  //               pubkey={item.author_pubkey}
  //               kind={30023}
  //               d={item.d}
  //               image={item.thumbnail}
  //             />
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     <Link className="pointer thumbnail" to={`/article/${artURL}`}>
  //       <div
  //         className="fit-container bg-img cover-bg"
  //         style={{
  //           backgroundColor:
  //             "linear-gradient(93deg, #880185 -6.44%, #FA4EFF 138.71%)",
  //           backgroundImage: `url(${item.thumbnail})`,
  //           width: "100%",
  //           height: "100%",
  //         }}
  //       ></div>
  //     </Link>
  //   </div>
  // );
}

const AuthorPreview = ({ author }) => {
  return (
    <div className="fx-centered">
      <UserProfilePicNOSTR
        size={24}
        ring={false}
        img={author.author_img}
        mainAccountUser={false}
        user_id={author.author_pubkey}
      />

      <p className="p-one-line p-medium">
        By: <span className="c1-c">{author.author_name}</span>
      </p>
    </div>
  );
};
