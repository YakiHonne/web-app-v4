import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Context } from "../../Context/Context";
import DtoLToggleButton from "../DtoLToggleButton";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import { minimizeKey } from "../../Helpers/Encryptions";
import { nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import LoginNOSTR from "./LoginNOSTR";
import { useMemo } from "react";
import NotificationCenter from "./NotificationCenter";
import { useEffect } from "react";
import { useRef } from "react";
import ProgressBar from "../ProgressBar";
import ProgressCirc from "../ProgressCirc";
import { getCurrentLevel, levelCount } from "../../Helpers/Helpers";
import LoadingDots from "../LoadingDots";
import axiosInstance from "../../Helpers/HTTP_Client";
import LoginWithAPI from "./LoginWithAPI";

export default function NavBar() {
  const {
    nostrUser,
    nostrKeys,
    nostrUserLoaded,
    nostrUserAbout,
    nostrUserLogout,
    chatrooms,
    isConnectedToYaki,
    yakiChestStats,
    isYakiChestLoaded
  } = useContext(Context);
  const navigateTo = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  // const [isLoaded, setIsLoaded] = useState(false);
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMyContent, setShowMyContent] = useState(false);
  const [showWritingOptions, setShowWritingOptions] = useState(false);
  const settingsRef = useRef(null);
  const myContentRef = useRef(null);
  const writingOpt = useRef(null);
  const mainFrame = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [showYakiChest, setShowYakiChest] = useState(false);

  const isNewMsg = useMemo(() => {
    return chatrooms.find((chatroom) => !chatroom.checked);
  }, [chatrooms]);
  const isPage = (url) => {
    if (url === window.location.pathname) return true;
    return false;
  };

  useEffect(() => {
    const handleOffClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setShowSettings(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [settingsRef]);
  useEffect(() => {
    const handleOffClick = (e) => {
      if (myContentRef.current && !myContentRef.current.contains(e.target))
        setShowMyContent(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [myContentRef]);
  useEffect(() => {
    const handleOffClick = (e) => {
      if (writingOpt.current && !writingOpt.current.contains(e.target))
        setShowWritingOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [writingOpt]);
  useEffect(() => {
    const handleOffClick = (e) => {
      if (mainFrame.current && !mainFrame.current.contains(e.target))
        setIsActive(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [mainFrame]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setIsLoaded(false);
  //       const data = await axiosInstance.get("/api/v1/yaki-chest/stats");
  //       if (data.data.user_stats.pubkey !== nostrKeys.pub) {
  //         nostrUserLogout();
  //         setIsLoaded(false);
  //         return;
  //       }
  //       let { user_stats, platform_standards } = data.data;
  //       let xp = user_stats.xp;
  //       let currentLevel = getCurrentLevel(xp);
  //       let nextLevel = currentLevel + 1;
  //       let toCurrentLevelPoints = levelCount(currentLevel);
  //       let toNextLevelPoints = levelCount(nextLevel);
  //       let totalPointInLevel = toNextLevelPoints - toCurrentLevelPoints;
  //       let inBetweenLevelPoints = xp - toCurrentLevelPoints;
  //       let remainingPointsToNextLevel =
  //         totalPointInLevel - inBetweenLevelPoints;

  //       setYakiChestStats({
  //         xp,
  //         currentLevel,
  //         nextLevel,
  //         toCurrentLevelPoints,
  //         toNextLevelPoints,
  //         totalPointInLevel,
  //         inBetweenLevelPoints,
  //         remainingPointsToNextLevel,
  //       });
  //       setIsLoaded(true);
  //     } catch (err) {
  //       console.log(err);
  //       setIsLoaded(false);
  //     }
  //   };
  //   if (nostrKeys && isConnectedToYaki) fetchData();
  //   if (nostrKeys && !isConnectedToYaki) setIsLoaded(true);
  // }, [nostrKeys, isConnectedToYaki]);

  return (
    <>
      {showYakiChest && <LoginWithAPI exit={() => setShowYakiChest(false)} />}
      <div
        className="fx-scattered fx-end-v nostr-sidebar box-pad-v-m box-pad-h fx-col "
        style={{ paddingBottom: "1em", zIndex: isActive ? 1000 : 200 }}
        onClick={() => setIsActive(true)}
        ref={mainFrame}
      >
        {triggerLogin && <LoginNOSTR exit={() => setTriggerLogin(false)} />}
        <div
          className="fx-scattered fx-end-v fx-col"
          style={{ height: "100%" }}
        >
          <div className="fx-centered fx-start-h fit-container">
            <div
              className="yakihonne-logo-128"
              onClick={() => navigateTo("/")}
            ></div>
          </div>

          <div
            className="fit-container link-items fx-scattered fx-col fx-start-v"
            style={{ rowGap: 0 }}
          >
            <div
              onClick={() => navigateTo("/")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="home-24"></div>
              <div className="link-label">Home</div>
            </div>
            <div
              onClick={() => navigateTo("/articles")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/articles") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="posts-24"></div>
              <div className="link-label">Articles</div>
            </div>
            <div
              onClick={() => navigateTo("/curations")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/curations") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="curation-24"></div>
              <div className="link-label">Curations</div>
            </div>
            <div
              onClick={() => navigateTo("/flash-news")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/flash-news") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="news-24"></div>
              <div className="link-label">Flash news</div>
            </div>
            <div
              onClick={() => navigateTo("/uncensored-notes")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/uncensored-notes") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="note-24"></div>
              <div className="link-label">Uncensored notes</div>
            </div>
            <div
              onClick={() => navigateTo("/buzz-feed")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/buzz-feed") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="buzz-24"></div>
              <div className="link-label">Buzz feed</div>
            </div>
            <div
              onClick={() => navigateTo("/videos")}
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                isPage("/videos") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="play-24"></div>
              <div className="link-label">Videos</div>
            </div>
            <div
              onClick={() => navigateTo("/messages")}
              className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                isPage("/messages") ? "active-link" : "inactive-link"
              }`}
            >
              <div className="fx-centered">
                <div className="env-24"></div>
                <div className="link-label">Messages</div>
              </div>
              {isNewMsg && (
                <div
                  style={{
                    minWidth: "8px",
                    aspectRatio: "1/1",
                    backgroundColor: "var(--green-main)",
                    borderRadius: "var(--border-r-50)",
                  }}
                ></div>
              )}
            </div>
            <NotificationCenter />
            {/* <div
            onClick={() => navigateTo("/my-curations")}
            className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
              isPage("/my-curations") ? "active-link" : "inactive-link"
            }`}
          >
            <div className="stories-24"></div>
            <div className="link-label">My curations</div>
          </div> */}
            {/* <Link
            to={"/my-articles"}
            className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
              isPage("/my-articles") ? "active-link" : "inactive-link"
            }`}
            style={{ position: "relative" }}
          >
            <div className="posts-24"></div>
            <div className="link-label">My articles</div>
          </Link> */}
            {nostrKeys && (
              <div
                className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                  showMyContent ||
                  isPage("/my-flash-news") ||
                  isPage("/my-curations") ||
                  isPage("/my-articles") ||
                  isPage("/bookmarks")
                    ? "active-link"
                    : "inactive-link"
                }`}
                style={{ position: "relative" }}
                onClick={() => setShowMyContent(!showMyContent)}
                ref={myContentRef}
              >
                <div className="folder-24"></div>
                <div className="link-label">My content</div>
                {showMyContent && (
                  <div
                    className="sc-s-18 fx-centered fx-start-v fx-col pointer slide-left"
                    style={{
                      position: "absolute",
                      bottom: "0",
                      right: "-230px",
                      width: "220px",
                      height: "max-content",
                      zIndex: "900",
                      rowGap: 0,
                    }}
                  >
                    <div
                      className="fx-centered fx-col fx-start-v fit-container"
                      style={{ rowGap: "0" }}
                    >
                      <div
                        onClick={() => navigateTo("/my-flash-news")}
                        className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                          isPage("/my-flash-news")
                            ? "active-link"
                            : "inactive-link"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="news-24"></div>
                        <div>My flash news</div>
                      </div>
                      <hr />

                      <div
                        onClick={() => navigateTo("/my-curations")}
                        className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                          isPage("/my-curations")
                            ? "active-link"
                            : "inactive-link"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="stories-24"></div>
                        <div>My curations</div>
                      </div>
                      <hr />
                      <div
                        onClick={() => navigateTo("/my-articles")}
                        className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                          isPage("/my-articles")
                            ? "active-link"
                            : "inactive-link"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="posts-24"></div>
                        <div>My articles</div>
                      </div>
                      <hr />
                      <div
                        onClick={() => navigateTo("/my-videos")}
                        className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                          isPage("/my-videos") ? "active-link" : "inactive-link"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="play-24"></div>
                        <div>My videos</div>
                      </div>
                      <hr />
                      <div
                        onClick={() => navigateTo("/bookmarks")}
                        className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                          isPage("/bookmarks") ? "active-link" : "inactive-link"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="bookmark-i-24"></div>
                        <div>My bookmarks</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* {nostrUser && ( */}
            <div
              className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                showWritingOptions ? "active-link" : "inactive-link"
              }`}
              style={{ position: "relative" }}
              onClick={() =>
                nostrKeys
                  ? setShowWritingOptions(!showWritingOptions)
                  : setTriggerLogin(true)
              }
              ref={writingOpt}
            >
              <div className="write-24"></div>
              <div className="link-label">Write</div>
              {showWritingOptions && (
                <div
                  className="sc-s-18 fx-centered fx-start-v fx-col pointer slide-left"
                  style={{
                    position: "absolute",
                    bottom: "0",
                    right: "-230px",
                    width: "220px",
                    height: "max-content",
                    zIndex: "900",
                    rowGap: 0,
                  }}
                >
                  <div
                    className="fx-centered fx-col fx-start-v fit-container"
                    style={{ rowGap: "0" }}
                  >
                    <Link
                      // onClick={() => navigateTo("/my-flash-news")}

                      to={"/my-flash-news"}
                      state={{ addFN: true }}
                      className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                        "inactive-link"
                        // isPage("/my-flash-news") ? "active-link" : "inactive-link"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <div className="fx-centered">
                        <div className="news-24"></div>
                        <div>Flash news</div>{" "}
                      </div>
                      <p className="p-big">+</p>
                    </Link>
                    <hr />
                    <Link
                      to={"/my-curations"}
                      state={{ addCuration: true }}
                      // onClick={() => navigateTo("/my-curations")}
                      className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                        // isPage("/my-curations") ? "active-link" : "inactive-link"
                        "inactive-link"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <div className="fx-centered">
                        <div className="stories-24"></div>
                        <div>Curation</div>
                      </div>
                      <p className="p-big">+</p>
                    </Link>
                    <hr />
                    <div
                      onClick={() => navigateTo("/write-article")}
                      className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                        "inactive-link"
                        // isPage("/write-article") ? "active-link" : "inactive-link"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <div className="fx-centered">
                        <div className="posts-24"></div>
                        <div>Article</div>
                      </div>
                      <p className="p-big">+</p>
                    </div>
                    <hr />
                    <Link
                      to={"/my-videos"}
                      state={{ addVideo: true }}
                      className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                        "inactive-link"
                        // isPage("/write-article") ? "active-link" : "inactive-link"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <div className="fx-centered">
                        <div className="play-24"></div>
                        <div>Video</div>
                      </div>
                      <p className="p-big">+</p>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {/* )} */}
            {/*                
        <div className="fx-centered" style={{ position: "relative" }}>
          <Link
            className="pointer box-pad-h-s box-pad-v-s 
               active-link"
            style={{ backgroundColor: "var(--c1-side)" }}
            to={"/yakihonne-mobile-app"}
            target={"_blank"}
          >
            <div className="tooltip-sidebar-hover">Get the app</div>
            <div
              className="mobile-24"
              // style={{ filter: "invert()" }}
            ></div>
          </Link>
        </div> */}
            <div>
              <div
                className="pointer fx-centered
               inactive-link"
              >
                <DtoLToggleButton />
                {/* <div className="link-label">Switch theme</div> */}
              </div>
            </div>
          </div>
          {/* {nostrUser && nostrUserLoaded && (
        <div className="fx-centered" style={{ position: "relative" }}>
          <div
            className="pointer box-pad-h-s box-pad-v-s 
               active-link"
            onClick={nostrUserLogout}
          >
            <div className="switch-arrows-24"></div>
          </div>
        </div>
      )} */}
          {nostrKeys && (
            <div
              className="fx-scattered fx-col fit-container sidebar-user-settings "
              style={{ columnGap: "0", position: "relative", zIndex: 100 }}
              // ref={ref}
              ref={settingsRef}
            >
              {/* <div className="fit-container fx-centered fx-col box-pad-h-m box-marg-s">
              <div className="fit-container fx-scattered">
                <div className="fx-centered fx-start-h" style={{columnGap: "3px"}}>
 
                  <p className="orange-c p-medium">4</p>
                  <p className="gray-c p-medium">xp</p>
                  <p className="gray-c p-medium">LvL</p>
                
                  <p className="gray-c p-medium">4</p>
                </div>
                <div>
                  <p className="orange-c p-medium">5</p>

                </div>
              </div>
              <ProgressBar total={100} current={40} full={true}/>
            </div> */}
              <div
                className="fx-scattered fit-container sidebar-user-settings-button fx-wrap"
                onClick={() => setShowSettings(!showSettings)}
              >
                <div
                  className="fx-centered fx-start-h  pointer"
                  style={{ columnGap: "16px" }}
                >
                  <UserProfilePicNOSTR
                    size={40}
                    mainAccountUser={true}
                    allowClick={false}
                    ring={false}
                  />
                  <div className="mb-hide">
                    <p>
                      {nostrUserAbout.display_name ||
                        nostrUserAbout.name ||
                        minimizeKey(nostrKeys.pub)}
                    </p>
                    <p className="gray-c p-medium">
                      @
                      {nostrUserAbout.name ||
                        nostrUserAbout.display_name ||
                        minimizeKey(nostrKeys.pub)}
                    </p>
                  </div>
                </div>
                {/* <div className="box-pad-h-s pointer mb-hide">
                <div>&#8942;</div>
              </div> */}

                {isYakiChestLoaded && !yakiChestStats && (
                  <div
                    className="round-icon round-icon-tooltip"
                    data-tooltip={"Yaki chest"}
                    style={{ minWidth: "40px", minHeight: "40px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYakiChest(true);
                    }}
                  >
                    <div className="cup"></div>
                  </div>
                )}
                {isYakiChestLoaded && yakiChestStats && (
                  <ProgressCirc
                    size={54}
                    percentage={yakiChestStats.inBetweenLevelPoints*100/yakiChestStats.totalPointInLevel}
                    innerComp={
                      <div className="fx-centered fx-col" style={{ rowGap: 0 }}>
                        <p className="orange-c p-small mb-hide">{yakiChestStats.xp} xp</p>
                        <p className="gray-c p-small">Lvl {yakiChestStats.currentLevel}</p>
                      </div>
                    }
                    tooltip={`Level ${yakiChestStats.currentLevel}`}
                  />
                )}
                {!isYakiChestLoaded && <LoadingDots />}
              </div>
              {showSettings && (
                <div
                  className="sc-s-18 fx-centered fx-start-v fx-col pointer slide-left"
                  style={{
                    position: "absolute",
                    bottom: "70px",
                    // right: "-230px",
                    width: "220px",
                    height: "max-content",
                    zIndex: "900",
                    rowGap: 0,
                  }}
                >
                  <div
                    className="fx-centered fx-col fx-start-v fit-container"
                    style={{ rowGap: "0" }}
                  >
                    <div
                      className="fit-container fx-centered fx-start-h  box-pad-h-m box-pad-v-m nostr-navbar-link"
                      onClick={() =>
                        navigateTo(
                          `/users/${nip19.nprofileEncode({
                            pubkey: nostrKeys.pub,
                            relays: relaysOnPlatform,
                          })}`
                        )
                      }
                    >
                      <div className="user"></div>
                      <p>Profile</p>
                    </div>
                    {/* <hr />

                  <div
                    className="fit-container fx-centered fx-start-h box-pad-h-m  box-pad-v-m nostr-navbar-link"
                    onClick={() => navigateTo(`/bookmarks`)}
                  >
                    <div className="bookmark-i"></div>
                    <p>Bookmarks</p>
                  </div> */}
                    <hr />
                    <div
                      className="fit-container fx-centered fx-start-h box-pad-h-m  box-pad-v-m nostr-navbar-link"
                      onClick={() => navigateTo(`/yaki-points`)}
                    >
                      <div className="cup"></div>
                      <p>Yaki points</p>
                    </div>
                    <hr />
                    <div
                      className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m nostr-navbar-link"
                      onClick={() => navigateTo(`/settings`)}
                    >
                      <div className="setting"></div>
                      <p>Settings</p>
                    </div>
                    <hr />
                    <div
                      className="fit-container fx-centered fx-start-h box-pad-h-m  box-pad-v-m nostr-navbar-link"
                      onClick={() => navigateTo(`/yakihonne-mobile-app`)}
                    >
                      <div className="mobile"></div>
                      <p className="c1-c">Get the app</p>
                    </div>
                  </div>
                  <hr />
                  <div
                    className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m nostr-navbar-link"
                    onClick={() => {
                      setShowSettings(false);
                      nostrUserLogout();
                    }}
                  >
                    <div className="logout"></div>
                    <p className="c1-c">Logout</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {!nostrKeys && (
            <button
              className="btn btn-normal btn-full fx-centered"
              onClick={() => setTriggerLogin(true)}
            >
              <div className="link-label">Login</div>
              <div className="connect-24"></div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
// export default function NavBar() {
//   const { nostrUser, nostrUserLoaded, nostrUserLogout } = useContext(Context);
//   const navigateTo = useNavigate();
//   const [showLogout, setShowLogout] = useState(false);
//   const isPage = (url) => {
//     if (url === window.location.pathname) return true;
//     return false;
//   };

//   const switchPlatform = () => {
//     document.body.style.transition = ".2s ease-in-out";
//     document.body.style.transformOrigin = "center center";
//     document.body.style.opacity = "0";
//     document.body.style.transform = "translateY(50px)";
//     let timer = setTimeout(() => {
//       navigateTo("/");
//       document.body.style.opacity = "1";
//       document.body.style.transform = "initial";
//     }, 300);
//   };
//   return (
//     <div className="fx-scattered nostr-sidebar box-pad-v-m fx-col">
//       <div>
//         <div className="sidebar-logo fx-centered fit-container">
//           <div
//             className="yakihonne-logo-128"
//             onClick={() => navigateTo("/")}
//           ></div>
//         </div>
//       </div>
//       <div className="fx-scattered fx-col">
//         <div
//           onClick={() => navigateTo("/")}
//           className={` pointer box-pad-h-s box-pad-v-s ${
//             isPage("/") ? "active-link" : "inactive-link"
//           }`}
//         >
//           <div className="tooltip-sidebar-hover">Home</div>
//           <div className="home-24"></div>
//         </div>
//         <div
//           onClick={() => navigateTo("/curations")}
//           className={`pointer box-pad-h-s box-pad-v-s ${
//             isPage("/curations") ? "active-link" : "inactive-link"
//           }`}
//         >
//           <div className="tooltip-sidebar-hover">Curations</div>
//           <div className="curation-24"></div>
//         </div>
//         <div
//           onClick={() => navigateTo("/flash-news")}
//           className={`pointer box-pad-h-s box-pad-v-s ${
//             isPage("/flash-news") ? "active-link" : "inactive-link"
//           }`}
//         >
//           <div className="tooltip-sidebar-hover">Flash news</div>
//           <div className="news-24"></div>
//         </div>
//         <div
//           onClick={() => navigateTo("/uncensored-notes")}
//           className={`pointer box-pad-h-s box-pad-v-s ${
//             isPage("/uncensored-notes") ? "active-link" : "inactive-link"
//           }`}
//         >
//           <div className="tooltip-sidebar-hover">Uncensored notes</div>
//           <div className="note-24"></div>
//         </div>

//         <div
//           onClick={() => navigateTo("/my-curations")}
//           className={`pointer box-pad-h-s box-pad-v-s ${
//             isPage("/my-curations") ? "active-link" : "inactive-link"
//           }`}
//         >
//           <div className="tooltip-sidebar-hover">My curations</div>
//           <div className="stories-24"></div>
//         </div>

//         <Link
//           to={"/my-articles"}
//           // onClick={() => navigateTo("/my-articles")}
//           className={`pointer box-pad-h-s box-pad-v-s ${
//             isPage("/my-articles") ? "active-link" : "inactive-link"
//           }`}
//         >
//           <div className="tooltip-sidebar-hover">My articles</div>
//           <div className="posts-24"></div>
//         </Link>
//         {nostrUser && (
//           <Link
//             to={"/write"}
//             // onClick={() => navigateTo("/my-articles")}
//             className={`pointer box-pad-h-s box-pad-v-s ${
//               isPage("/write") ? "active-link" : "inactive-link"
//             }`}
//           >
//             <div className="tooltip-sidebar-hover">Write</div>
//             <div className="edit-24"></div>
//           </Link>
//         )}
//         {/*
//         <div className="fx-centered" style={{ position: "relative" }}>
//           <Link
//             className="pointer box-pad-h-s box-pad-v-s
//                active-link"
//             style={{ backgroundColor: "var(--c1-side)" }}
//             to={"/yakihonne-mobile-app"}
//             target={"_blank"}
//           >
//             <div className="tooltip-sidebar-hover">Get the app</div>
//             <div
//               className="mobile-24"
//               // style={{ filter: "invert()" }}
//             ></div>
//           </Link>
//         </div> */}
//         <div>
//           <div
//             className="pointer fx-centered
//                inactive-link"
//           >
//             <DtoLToggleButton />
//           </div>
//         </div>
//       </div>
//       {/* {nostrUser && nostrUserLoaded && (
//         <div className="fx-centered" style={{ position: "relative" }}>
//           <div
//             className="pointer box-pad-h-s box-pad-v-s
//                active-link"
//             onClick={nostrUserLogout}
//           >
//             <div className="switch-arrows-24"></div>
//           </div>
//         </div>
//       )} */}
//     </div>
//   );
// }
