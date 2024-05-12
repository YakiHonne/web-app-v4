import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  Fragment,
  useRef,
} from "react";
import LoadingScreen from "../../Components/LoadingScreen";
import Date_ from "../../Components/Date_";
import ShortenKey from "../../Components/NOSTR/ShortenKey";
import {
  checkForLUDS,
  decodeBolt11,
  filterRelays,
  getBech32,
  getBolt11,
  getEmptyNostrUser,
  getHex,
  getParsed3000xContent,
  getParsedAuthor,
} from "../../Helpers/Encryptions";
import { useNavigate, useParams, Link } from "react-router-dom";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import relaysOnPlatform from "../../Content/Relays";
import { nip19, SimplePool } from "nostr-tools";
import PostPreviewCardNOSTR from "../../Components/NOSTR/PostPreviewCardNOSTR";
import UserProfilePicNOSTR from "../../Components/NOSTR/UserProfilePicNOSTR";
import NavbarNOSTR from "../../Components/NOSTR/NavbarNOSTR";
import ZapTip from "../../Components/NOSTR/ZapTip";
import Follow from "../../Components/NOSTR/Follow";
import ShowPeople from "../../Components/NOSTR/ShowPeople";
import TopicElementNOSTR from "../../Components/NOSTR/TopicElementNOSTR";
import Helmet from "react-helmet";
import { Context } from "../../Context/Context";
import axiosInstance from "../../Helpers/HTTP_Client";
import axios from "axios";
import NumberShrink from "../../Components/NumberShrink";
import CheckNIP05 from "../../Components/CheckNIP05";
import ArrowUp from "../../Components/ArrowUp";
import { getImagePlaceholder } from "../../Content/NostrPPPlaceholder";
import UN from "../../Components/NOSTR/UN";
import ShowUsersList from "../../Components/NOSTR/ShowUsersList";
import SaveArticleAsBookmark from "../../Components/NOSTR/SaveArticleAsBookmark";
import {
  getAuthPubkeyFromNip05,
  getNoteTree,
  getVideoContent,
} from "../../Helpers/Helpers";
import Footer from "../../Components/Footer";
import VideosPreviewCards from "../../Components/NOSTR/VideosPreviewCards";
import LoadingDots from "../../Components/LoadingDots";
import ShareLink from "../../Components/ShareLink";

const pool = new SimplePool();
const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

export default function NostrUser() {
  const { user_id } = useParams();
  const {
    nostrUser,
    addNostrAuthors,
    nostrKeys,
    mutedList,
    isPublishing,
    setToast,
    setMutedList,
    setToPublish,
  } = useContext(Context);
  const [id, setID] = useState(false);
  const navigateTo = useNavigate();
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [curations, setCurations] = useState([]);
  const [flashNews, setFlashNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [contentType, setContentType] = useState("p");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowings] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showPeople, setShowPeople] = useState(false);
  const [showWritingImpact, setShowWritingImpact] = useState(false);
  const [showRatingImpact, setShowRatingImpact] = useState(false);
  const [satsSent, setSatsSent] = useState(0);
  const [satsRec, setSatsRec] = useState([]);
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  const [userImpact, setUserImpact] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  const isMuted = useMemo(() => {
    let checkProfile = () => {
      if (!Array.isArray(mutedList)) return false;
      let index = mutedList.findIndex((item) => item === user?.pubkey);
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [mutedList, user]);

  useEffect(() => {
    const dataFetching = async () => {
      try {
        setShowPeople(false);
        setCurations([]);
        setPosts([]);
        setSatsRec([]);
        setSatsSent(0);
        let isUser = false;
        let lastCreatedAtInUser = 0;
        let relaysToFetchFrom = nostrUser
          ? [
              ...filterRelays(relaysOnPlatform, nostrUser?.relays || []),
              "wss://nostr.wine",
            ]
          : [...relaysOnPlatform, "wss://nostr.wine"];
        setIsLoaded(false);
        getSatsStats();
        getFollowerAndFollowing();
        let sub = pool.subscribeMany(
          relaysToFetchFrom,
          [{ kinds: [30004, 0, 30023, 34235], authors: [id] }],
          {
            onevent(event) {
              if (event.kind === 30023)
                setPosts((_posts) => {
                  let d = event.tags.find((tag) => tag[0] === "d");
                  d = d ? d[1] : "";
                  let index = _posts.findIndex((item) => item.d === d);
                  let netP = Array.from(_posts);
                  if (index === -1) netP = [...netP, getPost(event)];
                  if (index !== -1) {
                    if (_posts[index].created_at < event.created_at) {
                      netP.splice(index, 1);
                      netP.push(getPost(event));
                    }
                  }
                  netP = netP.sort(
                    (el_1, el_2) => el_2.created_at - el_1.created_at
                  );
                  return netP;
                });
              if (event.kind === 30004) {
                let parsedContent = getParsed3000xContent(event.tags);
                if (parsedContent.items.length > 0) {
                  let identifier = event.tags.find((tag) => tag[0] === "d")[1];
                  let naddr = nip19.naddrEncode({
                    identifier: identifier,
                    pubkey: event.pubkey,
                    kind: event.kind,
                  });
                  let modified_date = new Date(
                    event.created_at * 1000
                  ).toISOString();
                  let added_date = new Date(
                    event.created_at * 1000
                  ).toISOString();
                  let published_at = event.created_at;
                  for (let tag of event.tags) {
                    if (tag[0] === "published_at") {
                      published_at = tag[1] || published_at;
                      added_date =
                        tag[1].length > 10
                          ? new Date(published_at).toISOString()
                          : new Date(published_at * 1000).toISOString();
                    }
                  }
                  setCurations((prev) => {
                    let index = prev.findIndex(
                      (item) => item.identifier === identifier
                    );
                    let newP = Array.from(prev);
                    if (index === -1)
                      newP = [
                        ...newP,
                        {
                          ...event,
                          naddr,
                          identifier,
                          naddr,
                          author: {
                            name: event.pubkey.substring(0, 10),
                            img: "",
                          },
                          added_date,
                          modified_date,
                          published_at,
                        },
                      ];
                    if (index !== -1) {
                      if (prev[index].created_at < event.created_at) {
                        newP.splice(index, 1);
                        newP.push({
                          ...event,
                          naddr,
                          identifier,
                          naddr,
                          author: {
                            name: event.pubkey.substring(0, 10),
                            img: "",
                          },
                          added_date,
                          modified_date,
                          published_at,
                        });
                      }
                    }

                    newP = newP.sort(
                      (item_1, item_2) => item_2.created_at - item_1.created_at
                    );

                    return newP;
                  });
                }
              }
              if (event.kind === 0) {
                isUser = true;
                if (lastCreatedAtInUser < event.created_at) {
                  lastCreatedAtInUser = event.created_at;
                  setUser(getParsedAuthor(event));
                  addNostrAuthors([event.pubkey]);
                  setIsLoaded(true);
                }
              }
              if (event.kind === 34235) {
                let parsedEvent = getVideoContent(event);
                // if (parsedEvent.minutes) {
                setVideos((prev) => {
                  return prev.find((video) => video.id === event.id)
                    ? prev
                    : [parsedEvent, ...prev].sort(
                        (video_1, video_2) =>
                          video_2.created_at - video_1.created_at
                      );
                });
                // }
              }
            },
            oneose() {
              if (!isUser) setUser(getEmptyNostrUser(id));

              setIsLoaded(true);
            },
          }
        );
      } catch (err) {
        console.log(err);
        navigateTo("/");
      }
    };
    if (id) {
      getFlashNews();
      dataFetching();
    }
  }, [id, timestamp]);

  useEffect(() => {
    const getID = async () => {
      try {
        if (user_id?.includes("@")) {
          let pubkey = await getAuthPubkeyFromNip05(user_id);
          setID(pubkey);
          return;
        }
        let pubkey = nip19.decode(user_id);
        setID(pubkey.data.pubkey);
      } catch (err) {
        console.log(err);
      }
    };
    getID();
  }, [user_id]);

  const getFlashNews = async () => {
    try {
      var data = await axios.get(API_BASE_URL + "/api/v1/flashnews", {
        params: { pubkey: id },
      });
      setFlashNews(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getFollowerAndFollowing = () => {
    try {
      setFollowings([]);

      let lastFollowingCreated = 0;
      let relaysToFetchFrom = nostrUser
        ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
        : relaysOnPlatform;
      let sub_2 = pool.subscribeMany(
        relaysToFetchFrom,
        [
          {
            kinds: [3],
            authors: [id],
          },
        ],
        {
          onevent(event) {
            let tempFollowing = event?.tags?.filter((item) => item[0] === "p");
            if (lastFollowingCreated < event.created_at) {
              lastFollowingCreated = event.created_at;
              setFollowings(tempFollowing);
            }
          },
        }
      );
    } catch (err) {
      console.log(err);
    }
  };

  const getSatsStats = async () => {
    try {
      let [SATS_STATS, USER_IMPACT] = await Promise.all([
        axios.get("https://api.nostr.band/v0/stats/profile/" + id),
        axios.get(API_BASE_URL + "/api/v1/user-impact", {
          params: { pubkey: id },
        }),
      ]);

      setSatsSent((SATS_STATS.data.stats[id]?.zaps_sent?.msats || 0) / 1000);
      setUserImpact(USER_IMPACT.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getPost = (post) => {
    let author_img = "";
    let author_name = getBech32("npub", post.pubkey).substring(0, 10);
    let author_pubkey = post.pubkey;
    let thumbnail = "";
    let title = "";
    let summary = "";
    let contentSensitive = false;
    let postTags = [];

    let d = "";
    let modified_date = new Date(post.created_at * 1000).toISOString();
    let added_date = new Date(post.created_at * 1000).toISOString();
    let published_at = post.created_at;

    for (let tag of post.tags) {
      if (tag[0] === "published_at") {
        published_at = tag[1] || post.created_at;

        added_date =
          published_at.length > 10
            ? new Date(parseInt(published_at)).toISOString()
            : new Date(parseInt(published_at) * 1000).toISOString();
      }
      if (tag[0] === "image") thumbnail = tag[1];
      if (tag[0] === "title") title = tag[1];
      if (tag[0] === "summary") summary = tag[1];
      if (tag[0] === "t") postTags.push(tag[1]);
      if (tag[0] === "L" && tag[1] === "content-warning")
        contentSensitive = true;
      if (tag[0] === "d") d = tag[1];
    }

    let naddr = nip19.naddrEncode({
      identifier: d,
      pubkey: author_pubkey,
      kind: 30023,
    });

    return {
      id: post.id,
      thumbnail: thumbnail || getImagePlaceholder(),
      summary,
      author_img,
      author_pubkey,
      author_name,
      title,
      added_date,
      created_at: post.created_at,
      modified_date,
      published_at,
      postTags,
      naddr,
      d,
      contentSensitive,
    };
  };

  const switchContentType = (type) => {
    setContentType(type);
  };

  useEffect(() => {
    const handleOffClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setShowOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(mutedList)) return;
      if (isPublishing) {
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        });
        return;
      }

      let tempTags = Array.from(mutedList.map((pubkey) => ["p", pubkey]));
      if (isMuted) {
        tempTags.splice(isMuted.index, 1);
      } else {
        tempTags.push(["p", user.pubkey]);
      }

      setToPublish({
        nostrKeys: nostrKeys,
        kind: 10000,
        content: "",
        tags: tempTags,
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  return (
    <>
      {showPeople === "following" && (
        <ShowPeople
          exit={() => setShowPeople(false)}
          list={following}
          type={showPeople}
        />
      )}
      {showWritingImpact && (
        <WritingImpact
          writingImpact={userImpact.writing_impact}
          exit={() => setShowWritingImpact(false)}
        />
      )}
      {showRatingImpact && (
        <RatingImpact
          ratingImpact={userImpact.rating_impact}
          exit={() => setShowRatingImpact(false)}
        />
      )}
      {/* <ShareUserImg user={{ ...user, followers, following }} /> */}
      <div>
        <Helmet>
          <title>Yakihonne | {user.name || "<Anonymous>"}</title>
          <meta name="description" content={user.about} />
          <meta property="og:description" content={user.about} />
          <meta property="og:image" content={user.picture} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta
            property="og:url"
            content={`https://yakihonne.com/user/${user_id}`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta
            property="og:title"
            content={`Yakihonne | ${user.name || "<Anonymous>"}`}
          />
          <meta
            property="twitter:title"
            content={`Yakihonne | ${user.name || "<Anonymous>"}`}
          />
          <meta property="twitter:description" content={user.about} />
          <meta property="twitter:image" content={user.picture} />
        </Helmet>
        <div className="fit-container fx-centered">
          <SidebarNOSTR />
          <main className="main-page-nostr-container">
            <ArrowUp />
            {/* <NavbarNOSTR /> */}
            <div className="fx-centered fit-container fx-start-h fx-start-v">
              <div
                style={{ width: "min(100%,720px)" }}
                className="box-pad-h-m box-pad-v-m"
              >
                <div
                  className="fit-container sc-s-18 fx-centered fx-end-h  fx-col bg-img cover-bg"
                  style={{
                    height: "20vh",
                    position: "relative",
                    backgroundImage: user.cover ? `url(${user.cover})` : "",
                    backgroundColor: "var(--very-dim-gray)",
                  }}
                ></div>
                <div className="fx-centered fit-container box-pad-v-m ">
                  <div
                    className="fx-centered fx-col fx-start-v"
                    style={{ width: "min(100%, 800px)" }}
                  >
                    <div className="fx-scattered fit-container">
                      <div
                        className="fx-centered"
                        style={{ columnGap: "16px" }}
                      >
                        <UserProfilePicNOSTR
                          size={64}
                          ring={false}
                          img={user.picture}
                          mainAccountUser={false}
                          allowClick={false}
                          user_id={user.pubkey}
                        />
                        <div className="fx-centered fx-col fx-start-v">
                          <div className="fx-centered fx-wrap fx-start-h">
                            <h4 className="p-caps">{user.name}</h4>
                            <ShortenKey id={user.pubkeyhashed} />
                          </div>
                          <CheckNIP05
                            address={user.nip05}
                            pubkey={user.pubkey}
                          />
                        </div>
                      </div>
                      <div className="fx-centered">
                        <ZapTip
                          recipientLNURL={checkForLUDS(user.lud06, user.lud16)}
                          // recipientLNURL={user.lud06 || user.lud16}
                          recipientPubkey={user.pubkey}
                          senderPubkey={nostrKeys.pub}
                          recipientInfo={{
                            name: user.name,
                            picture: user.picture,
                          }}
                        />
                        <Follow
                          toFollowKey={user.pubkey}
                          toFollowName={user.name}
                          setTimestamp={setTimestamp}
                          bulkList={[]}
                        />

                        <div style={{ position: "relative" }} ref={optionsRef}>
                          <div
                            className="round-icon round-icon-tooltip"
                            data-tooltip="Options"
                            onClick={() => {
                              setShowOptions(!showOptions);
                            }}
                          >
                            <div
                              className="fx-centered fx-col"
                              style={{ rowGap: 0 }}
                            >
                              <p
                                className="gray-c fx-centered"
                                style={{ height: "6px" }}
                              >
                                &#x2022;
                              </p>
                              <p
                                className="gray-c fx-centered"
                                style={{ height: "6px" }}
                              >
                                &#x2022;
                              </p>
                              <p
                                className="gray-c fx-centered"
                                style={{ height: "6px" }}
                              >
                                &#x2022;
                              </p>
                            </div>
                          </div>
                          {showOptions && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "110%",
                                backgroundColor: "var(--dim-gray)",
                                border: "none",
                                // transform: "translateY(100%)",
                                minWidth: "200px",
                                zIndex: 1000,
                                rowGap: "12px",
                              }}
                              className="box-pad-h box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v"
                            >
                              <div className="fit-container fx-centered fx-start-h pointer">
                                <ShareLink
                                  label={"Share profile"}
                                  path={`/users/${id}`}
                                  title={user.display_name || user.name}
                                  description={user.about || ""}
                                  kind={0}
                                  shareImgData={{
                                    post: { image: user.cover },
                                    author: user,
                                    followings: following.length,
                                  }}
                                />
                              </div>
                              {nostrKeys && nostrKeys.pub !== user.pubkey && (
                                <div
                                  className="fit-container fx-centered fx-start-h pointer"
                                  onClick={isPublishing ? null : muteUnmute}
                                >
                                  <p
                                    className="red-c"
                                    style={{ opacity: isPublishing ? 0.5 : 1 }}
                                  >
                                    {isMuted ? "Unmute" : "Mute"} profile
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="fx-centered fx-start-v "
                      style={{ columnGap: "24px" }}
                    >
                      <div className="box-pad-v-s fx-centered fx-start-v fx-col">
                        {user.about && (
                          <p
                            className="p-centered p-medium p-left"
                            style={{ maxWidth: "400px" }}
                          >
                            {user.about}
                          </p>
                        )}
                        <div className="fx-centered">
                          <div
                            className="fx-centered"
                            style={{ columnGap: "10px" }}
                          >
                            <div className="user"></div>
                            <div
                              className="pointer"
                              onClick={() =>
                                following.length !== 0
                                  ? setShowPeople("following")
                                  : null
                              }
                            >
                              <p className="p-medium">
                                {following.length}{" "}
                                <span className="gray-c">Following</span>
                              </p>
                            </div>
                            <UserFollowers id={id} />
                          </div>
                          <div
                            className="fx-centered"
                            style={{ columnGap: "10px" }}
                          >
                            <div className="bolt"></div>
                            <div>
                              <p className="p-medium">
                                <NumberShrink value={satsSent} />{" "}
                                <span className="gray-c">Sent</span>
                              </p>
                            </div>
                            <SatsReceived id={id} />
                          </div>
                        </div>
                      </div>
                    </div>
                    {userImpact && (
                      <div className="fx-centered fit-container">
                        <div
                          className="round-icon round-icon-tooltip"
                          data-tooltip="User impact"
                        >
                          <div className="medal-24"></div>
                        </div>
                        <div
                          className="fx-scattered fx option if pointer"
                          style={{
                            border: "none",
                            backgroundColor: "var(--very-dim-gray)",
                          }}
                          onClick={() => setShowWritingImpact(true)}
                        >
                          <div className="fx-centered">
                            <p>
                              <span className="p-bold">
                                {userImpact.writing_impact.writing_impact}{" "}
                              </span>
                              <span className="gray-c p-medium">
                                Writing impact
                              </span>
                            </p>
                          </div>
                          <div
                            className="arrow"
                            style={{ transform: "rotate(-90deg)" }}
                          ></div>
                        </div>
                        <div
                          className="fx-scattered fx option if pointer"
                          style={{
                            border: "none",
                            backgroundColor: "var(--very-dim-gray)",
                          }}
                          onClick={() => setShowRatingImpact(true)}
                        >
                          <div className="fx-centered">
                            <p>
                              <span className="p-bold">
                                {userImpact.rating_impact.rating_impact}{" "}
                              </span>
                              <span className="gray-c p-medium">
                                Rating impact
                              </span>
                            </p>
                          </div>
                          <div
                            className="arrow"
                            style={{ transform: "rotate(-90deg)" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="fx-centered box-pad-h-m"
                  style={{
                    marginTop: "1rem",
                  }}
                >
                  <div
                    className=" fx-col  fit-container"
                    style={{ width: "min(100%,800px)" }}
                  >
                    <div className="fit-container fx-centered fx-start-h">
                      <button
                        className={`btn  fx-centered fx-shrink ${
                          contentType === "p" ? "btn-normal-gray" : "btn-gst-nc"
                        }`}
                        onClick={() => switchContentType("p")}
                      >
                        Articles
                      </button>
                      <button
                        className={`btn  fx-centered fx-shrink ${
                          contentType === "c" ? "btn-normal-gray" : "btn-gst-nc"
                        }`}
                        onClick={() => switchContentType("c")}
                      >
                        Curations
                      </button>
                      <button
                        className={`btn  fx-centered fx-shrink ${
                          contentType === "f" ? "btn-normal-gray" : "btn-gst-nc"
                        }`}
                        onClick={() => switchContentType("f")}
                      >
                        Flash news
                      </button>
                      <button
                        className={`btn  fx-centered fx-shrink ${
                          contentType === "v" ? "btn-normal-gray" : "btn-gst-nc"
                        }`}
                        onClick={() => switchContentType("v")}
                      >
                        Videos
                      </button>
                    </div>

                    {contentType === "c" && curations.length > 0 && (
                      <div className="box-pad-v fx-centered fx-start-h fit-container">
                        <h4>{curations.length} Curations</h4>
                      </div>
                    )}
                    {contentType === "p" && posts.length > 0 && (
                      <div className="box-pad-v fx-centered fx-start-h fit-container">
                        <h4>{posts.length} Articles</h4>
                      </div>
                    )}
                    {contentType === "f" && flashNews.length > 0 && (
                      <div className="box-pad-v fx-centered fx-start-h fit-container">
                        <h4>{flashNews.length} Flash news</h4>
                      </div>
                    )}
                    {contentType === "v" && videos.length > 0 && (
                      <div className="box-pad-v fx-centered fx-start-h fit-container">
                        <h4>{videos.length} Videos</h4>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="box-pad-v fit-container fx-centered fx-col box-pad-h-m"
                  style={{ position: "relative" }}
                >
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      opacity: contentType === "c" ? 1 : 0,
                      height: contentType === "c" ? "auto" : "min(40vh)",
                      pointerEvents: contentType === "c" ? "auto" : "none",
                      overflow: contentType === "c" ? "auto" : "hidden",
                      paddingBottom: "3rem",
                    }}
                  >
                    {curations.length > 0 && (
                      <>
                        <div
                          style={{ width: "min(100%,800px)" }}
                          className="fx-around fx-wrap posts-cards"
                        >
                          {curations.map((item) => {
                            return (
                              <TopicElementNOSTR
                                key={item.id}
                                topic={item}
                                full={true}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                    {curations.length === 0 && (
                      <div
                        className="fx-centered fx-col box-pad-v"
                        style={{ height: "30vh" }}
                      >
                        <h4>Oops! Nothing to show here!</h4>
                        <p className="gray-c">{user.name} has no curations</p>
                        <div
                          className="curation-24"
                          style={{ width: "48px", height: "48px" }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      opacity: contentType === "f" ? 1 : 0,
                      height: contentType === "f" ? "auto" : "min(40vh)",
                      pointerEvents: contentType === "f" ? "auto" : "none",
                      overflow: contentType === "f" ? "auto" : "hidden",
                      paddingBottom: "3rem",
                    }}
                  >
                    {flashNews.length === 0 && (
                      <div
                        className="fx-centered fx-col box-pad-v"
                        style={{ height: "30vh" }}
                      >
                        <h4>Oops! Nothing to read here!</h4>
                        <p className="gray-c">
                          {user.name} hasn't written any flash news yet
                        </p>
                        <div
                          className="news"
                          style={{ width: "48px", height: "48px" }}
                        ></div>
                      </div>
                    )}
                    {flashNews.length > 0 && (
                      <>
                        <div
                          style={{ width: "min(100%,800px)" }}
                          className="fx-around fx-wrap posts-cards"
                        >
                          {flashNews.map((news) => {
                            return (
                              <Fragment key={news.id}>
                                <FlashNewsCard
                                  newsContent={news}
                                  self={false}
                                />
                                <hr style={{ margin: "1rem auto" }} />
                              </Fragment>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      opacity: contentType === "p" ? 1 : 0,
                      height: contentType === "p" ? "auto" : "min(40vh)",
                      pointerEvents: contentType === "p" ? "auto" : "none",
                      overflow: contentType === "p" ? "auto" : "hidden",
                      paddingBottom: "3rem",
                    }}
                  >
                    {posts.length === 0 && (
                      <div
                        className="fx-centered fx-col box-pad-v"
                        style={{ height: "30vh" }}
                      >
                        <h4>Oops! Nothing to read here!</h4>
                        <p className="gray-c">
                          {user.name} hasn't written any article yet
                        </p>
                        <div
                          className="posts"
                          style={{ width: "48px", height: "48px" }}
                        ></div>
                      </div>
                    )}
                    {posts.length > 0 && (
                      <>
                        <div
                          style={{ width: "min(100%,800px)" }}
                          className="fx-around fx-wrap posts-cards"
                        >
                          {posts.map((post) => {
                            let fullPost = {
                              ...post,
                              author_img: user.picture,
                            };
                            return (
                              <div
                                key={post.id}
                                // style={{ flex: "1 1 200px" }}
                                className="fx-centered fit-container"
                              >
                                <PostPreviewCardNOSTR item={fullPost} />
                              </div>
                            );
                          })}
                          {/* <Placeholder /> */}
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      opacity: contentType === "v" ? 1 : 0,
                      height: contentType === "v" ? "auto" : "min(40vh)",
                      pointerEvents: contentType === "v" ? "auto" : "none",
                      overflow: contentType === "v" ? "auto" : "hidden",
                      paddingBottom: "3rem",
                    }}
                  >
                    {videos.length === 0 && (
                      <div
                        className="fx-centered fx-col box-pad-v"
                        style={{ height: "30vh" }}
                      >
                        <h4>Oops! Nothing to read here!</h4>
                        <p className="gray-c">
                          {user.name} hasn't posted any videos yet
                        </p>
                        <div
                          className="play-24"
                          style={{ width: "48px", height: "48px" }}
                        ></div>
                      </div>
                    )}
                    {videos.length > 0 && (
                      <>
                        <div
                          style={{ width: "min(100%,800px)" }}
                          className="fx-around fx-wrap posts-cards"
                        >
                          {videos.map((video) => {
                            let fullPost = {
                              ...video,
                              author_img: user.picture,
                            };
                            return (
                              <div
                                key={video.id}
                                // style={{ flex: "1 1 200px" }}
                                className="fx-centered fit-container"
                              >
                                <VideosPreviewCards item={video} />
                              </div>
                            );
                          })}
                          {/* <Placeholder /> */}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* )} */}
              </div>
            </div>
            {/* <Footer /> */}
          </main>
        </div>
      </div>
    </>
  );

  // return (
  //   <>
  //     {showPeople === "following" && (
  //       <ShowPeople
  //         exit={() => setShowPeople(false)}
  //         list={following}
  //         type={showPeople}
  //       />
  //     )}
  //     <div>
  //       <Helmet>
  //         <title>Yakihonne | {user.name || "<Anonymous>"}</title>
  //         <meta name="description" content={user.about} />
  //         <meta property="og:description" content={user.about} />
  //         <meta property="og:image" content={user.picture} />
  //         <meta
  //           property="og:url"
  //           content={`https://yakihonne.com/user/${user_id}`}
  //         />
  //         <meta property="og:type" content="website" />
  //         <meta property="og:site_name" content="Yakihonne" />
  //         <meta
  //           property="og:title"
  //           content={`Yakihonne | ${user.name || "<Anonymous>"}`}
  //         />
  //         <meta
  //           property="twitter:title"
  //           content={`Yakihonne | ${user.name || "<Anonymous>"}`}
  //         />
  //         <meta property="twitter:description" content={user.about} />
  //         <meta property="twitter:image" content={user.picture} />
  //       </Helmet>
  //       <SidebarNOSTR />
  //       <main className="main-page-nostr-container">
  //         <ArrowUp />
  //         <NavbarNOSTR />
  //         <div className="fit-container">
  //           <div
  //             className="fit-container sc-s profile-cover fx-centered fx-end-h  fx-col bg-img cover-bg"
  //             style={{
  //               height: "40vh",
  //               position: "relative",
  //               backgroundImage: user.cover ? `url(${user.cover})` : "",
  //               backgroundColor: "var(--very-dim-gray)",
  //             }}
  //           ></div>
  //           <div
  //             className="fx-centered fx-start-v"
  //             style={{ columnGap: "24px" }}
  //           >
  //             <div
  //               style={{
  //                 border: "6px solid var(--white)",
  //                 borderRadius: "var(--border-r-50)",
  //               }}
  //             >
  //               <UserProfilePicNOSTR
  //                 size={100}
  //                 ring={false}
  //                 img={user.picture}
  //                 mainAccountUser={false}
  //                 allowClick={false}
  //                 user_id={user.pubkey}
  //               />
  //             </div>
  //             <div className="box-pad-v-s fx-centered fx-start-v fx-col">
  //               <p className="gray-c p-medium">
  //                 <Date_ toConvert={user.joining_date} />
  //               </p>
  //               <div className="fx-centered">
  //                 <h4 className="p-caps">{user.name}</h4>
  //                 <ShortenKey id={user.pubkeyhashed} />
  //               </div>
  //               <CheckNIP05 address={user.nip05} pubkey={user.pubkey} />
  //               {/* {user.nip05 && <p className="c1-c p-medium">{user.nip05}</p>} */}
  //               {user.about && (
  //                 <p
  //                   className="p-centered p-medium p-left"
  //                   style={{ maxWidth: "400px" }}
  //                 >
  //                   {user.about}
  //                 </p>
  //               )}
  //               <div className="fx-centered" style={{ columnGap: "16px" }}>
  //                 <div className="user"></div>
  //                 <div
  //                   className="pointer"
  //                   onClick={() =>
  //                     following.length !== 0 ? setShowPeople("following") : null
  //                   }
  //                 >
  //                   <p className="p-medium">
  //                     {following.length}{" "}
  //                     <span className="gray-c">Following</span>
  //                   </p>
  //                 </div>
  //                 <UserFollowers id={id} />
  //               </div>
  //               <div className="fx-centered" style={{ columnGap: "16px" }}>
  //                 <div className="bolt"></div>
  //                 <div>
  //                   <p className="p-medium">
  //                     <NumberShrink value={satsSent} />{" "}
  //                     <span className="gray-c">Sent</span>
  //                   </p>
  //                 </div>
  //                 <SatsReceived id={id} />
  //               </div>

  //               <div className="fx-centered">
  //                 <Follow
  //                   toFollowKey={user.pubkey}
  //                   toFollowName={user.name}
  //                   setTimestamp={setTimestamp}
  //                   bulkList={[]}
  //                 />
  //                 <ZapTip
  //                   recipientLNURL={checkForLUDS(user.lud06, user.lud16)}
  //                   // recipientLNURL={user.lud06 || user.lud16}
  //                   recipientPubkey={user.pubkey}
  //                   senderPubkey={nostrUser.pubkey}
  //                   recipientInfo={{ name: user.name, picture: user.picture }}
  //                 />
  //               </div>
  //             </div>
  //           </div>
  //           {(posts.length > 0 || curations.length > 0) && (
  //             <div
  //               className="fx-centered  fit-container box-pad-h"
  //               style={{
  //                 marginTop: "2rem",
  //               }}
  //             >
  //               <div
  //                 className="fx-scattered"
  //                 style={{ width: "min(100%,800px)" }}
  //               >
  //                 {contentType === "c" && (
  //                   <div className="box-pad-v fx-col fx-centered">
  //                     <h3>{curations.length} Curations</h3>
  //                   </div>
  //                 )}
  //                 {contentType === "p" && (
  //                   <div className="box-pad-v fx-col fx-centered">
  //                     <h3>{posts.length} Articles</h3>
  //                   </div>
  //                 )}
  //                 <div
  //                   className="fx-scattered sc-s pointer profile-switcher"
  //                   style={{
  //                     position: "relative",
  //                     width: "150px",
  //                     height: "45px",
  //                     border: "none",
  //                     backgroundColor: "var(--dim-gray)",
  //                     columnGap: 0,
  //                   }}
  //                   onClick={switchContentType}
  //                 >
  //                   <div
  //                     style={{
  //                       position: "absolute",
  //                       left: 0,
  //                       top: 0,
  //                       transform:
  //                         contentType !== "p" ? "translateX(100%)" : "",
  //                       transition: ".2s ease-in-out",
  //                       height: "100%",
  //                       width: "50%",
  //                       backgroundColor: "var(--c1)",
  //                       borderRadius: "var(--border-r-32)",
  //                     }}
  //                   ></div>
  //                   <p
  //                     className={`p-medium fx p-centered pointer ${
  //                       contentType !== "p" ? "" : "white-c"
  //                     }`}
  //                     style={{
  //                       position: "relative",
  //                       zIndex: 10,
  //                       transition: ".2s ease-in-out",
  //                     }}
  //                   >
  //                     Articles
  //                   </p>
  //                   <p
  //                     className={`p-medium fx p-centered pointer ${
  //                       contentType !== "p" ? "white-c" : ""
  //                     }`}
  //                     style={{
  //                       position: "relative",
  //                       zIndex: 10,
  //                       transition: ".2s ease-in-out",
  //                     }}
  //                   >
  //                     Curations
  //                   </p>
  //                 </div>
  //               </div>
  //             </div>
  //           )}

  //           <div
  //             className="box-pad-v fit-container fx-centered fx-col"
  //             style={{ position: "relative" }}
  //           >
  //             <div
  //               className="fit-container fx-centered fx-col"
  //               style={{
  //                 position: "absolute",
  //                 left: 0,
  //                 top: 0,
  //                 width: "100%",
  //                 opacity: contentType === "c" ? 1 : 0,
  //                 height: contentType === "c" ? "auto" : "0",
  //                 pointerEvents: contentType === "c" ? "auto" : "none",
  //                 overflow: contentType === "c" ? "auto" : "hidden",
  //               }}
  //             >
  //               {curations.length > 0 && (
  //                 <>
  //                   <div
  //                     style={{ width: "min(100%,800px)" }}
  //                     className="fx-around fx-wrap posts-cards"
  //                   >
  //                     {curations.map((item) => {
  //                       return (
  //                         <TopicElementNOSTR
  //                           key={item.id}
  //                           topic={item}
  //                           full={true}
  //                         />
  //                       );
  //                     })}
  //                   </div>
  //                 </>
  //               )}
  //               {curations.length === 0 && (
  //                 <div className="fx-centered fx-col box-pad-v">
  //                   <h4>Oops! Nothing to show here!</h4>
  //                   <p className="gray-c">{user.name} has no curations</p>
  //                   <div
  //                     className="posts"
  //                     style={{ width: "48px", height: "48px" }}
  //                   ></div>
  //                 </div>
  //               )}
  //             </div>
  //             {/* )} */}
  //             {/* {contentType === "p" && ( */}
  //             <div
  //               className="fit-container fx-centered fx-col"
  //               style={{
  //                 position: "absolute",
  //                 left: 0,
  //                 top: 0,
  //                 width: "100%",
  //                 opacity: contentType === "p" ? 1 : 0,
  //                 height: contentType === "p" ? "auto" : "0",
  //                 pointerEvents: contentType === "p" ? "auto" : "none",
  //                 overflow: contentType === "p" ? "auto" : "hidden",
  //               }}
  //             >
  //               {posts.length === 0 && (
  //                 <div className="fx-centered fx-col box-pad-v">
  //                   <h4>Oops! Nothing to read here!</h4>
  //                   <p className="gray-c">
  //                     {user.name} hasn't written any article yet
  //                   </p>
  //                   <div
  //                     className="posts"
  //                     style={{ width: "48px", height: "48px" }}
  //                   ></div>
  //                 </div>
  //               )}

  //               {posts.length > 0 && (
  //                 <>
  //                   <div
  //                     style={{ width: "min(100%,800px)" }}
  //                     className="fx-around fx-wrap posts-cards"
  //                   >
  //                     {posts.map((post) => {
  //                       let fullPost = { ...post, author_img: user.picture };
  //                       return (
  //                         <div
  //                           key={post.id}
  //                           // style={{ flex: "1 1 200px" }}
  //                           className="fx-centered fit-container"
  //                         >
  //                           <PostPreviewCardNOSTR
  //                             key={post.id}
  //                             item={fullPost}
  //                           />
  //                         </div>
  //                       );
  //                     })}
  //                     {/* <Placeholder /> */}
  //                   </div>
  //                 </>
  //               )}
  //             </div>
  //             {/* )} */}
  //           </div>
  //         </div>
  //       </main>
  //     </div>
  //   </>
  // );
}

const UserFollowers = ({ id }) => {
  const {tempChannel, setTempChannel} = useContext(Context)
  const [followers, setFollowers] = useState([]);
  const [showPeople, setShowPeople] = useState(false);
  useEffect(() => {
    let _followers = [];
    let sub = pool.subscribeMany(
      [...relaysOnPlatform, "wss://nos.lol", "wss://nostr-pub.wellorder.net"],
      [
        {
          kinds: [3],
          "#p": [id],
        },
      ],
      {
        onevent(event) {
          _followers.push(event);
          setFollowers((followersPrev) => {
            let newF = [event, ...followersPrev];
            let netF = newF.filter((item, index, newF) => {
              if (
                newF.findIndex((_item) => item.pubkey === _item.pubkey) ===
                index
              )
                return item;
            });
            setTempChannel(netF)
            return netF;
          });
        },
      }
    );
  }, []);

  return (
    <>
      {showPeople === "followers" && (
        <ShowPeople
          exit={() => setShowPeople(false)}
          list={followers}
          type={showPeople}
        />
      )}
      <div
        className="pointer"
        onClick={() =>
          followers.length !== 0 ? setShowPeople("followers") : null
        }
      >
        <p className="p-medium">
          {followers.length} <span className="gray-c">Followers</span>
        </p>
      </div>
    </>
  );
};

const SatsReceived = ({ id }) => {
  const [satsRec, setSatsRec] = useState([]);
  useEffect(() => {
    let sub_inv = pool.subscribeMany(
      [...relaysOnPlatform, "wss://nostr.wine"],
      [
        {
          kinds: [9735],
          "#p": [id],
        },
      ],
      {
        onevent(event) {
          let sats = decodeBolt11(getBolt11(event));
          let tempEv = {
            ...event,
            amount: sats,
          };
          setSatsRec((prev) => [...prev, tempEv]);
        },
      }
    );
  }, []);
  return (
    <div>
      <p className="p-medium">
        <NumberShrink
          value={satsRec.reduce((total, item) => (total += item.amount), 0)}
        />{" "}
        <span className="gray-c">Received</span>
      </p>
    </div>
  );
};

const WritingImpact = ({ writingImpact, exit }) => {
  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        className="sc-s-18"
        style={{ width: "min(100%,500px)", position: "relative" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <div className="box-pad-h-m box-pad-v-m fit-container">
          <h4>Uncensored notes stats</h4>
        </div>
        <hr />
        <div className="box-pad-h-m box-pad-v-m fit-container">
          <div className="fx-centered fit-container fx-start-h">
            <h3>{writingImpact.writing_impact}</h3>
            <p className="gray-c">Writing Impact</p>
          </div>
        </div>
        <hr />
        <div className="box-pad-h-m box-pad-v-m fit-container fx-centered fx-col">
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="green-c">
              +{writingImpact.positive_writing_impact}
            </h4>
            <p>Notes that earned the status of Helpful</p>
            <p className="gray-c p-medium">
              These notes are now showing to everyone who sees the post, adding
              context and helping keep people informed.
            </p>
          </div>
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="red-c">-{writingImpact.negative_writing_impact}</h4>
            <p>Notes that reached the status of Not Helpful</p>
            <p className="gray-c p-medium">
              These notes have been rated Not Helpful by enough contributors,
              including those who sometimes disagree in their past ratings.
            </p>
          </div>
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="gray-c">{writingImpact.ongoing_writing_impact}</h4>
            <p>Notes that need more ratings</p>
            <p className="gray-c p-medium">
              Notes that don’t yet have a status of Helpful or Not Helpful.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
const RatingImpact = ({ ratingImpact, exit }) => {
  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        className="sc-s-18"
        style={{ width: "min(100%,500px)", position: "relative" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <div className="box-pad-h-m box-pad-v-m fit-container">
          <h4>Uncensored notes stats</h4>
        </div>
        <hr />
        <div className="box-pad-h-m box-pad-v-m fit-container">
          <div className="fx-centered fit-container fx-start-h">
            <h3>{ratingImpact.rating_impact}</h3>
            <p className="gray-c">Rating Impact</p>
          </div>
        </div>
        <hr />
        <div className="box-pad-h-m box-pad-v-m fit-container fx-centered fx-col">
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="green-c">
              +{ratingImpact.positive_rating_impact_h}
            </h4>
            <p>Ratings that helped a note earn the status of Helpful</p>
            <p className="gray-c p-medium">
              These ratings identified Helpful notes that get shown as context
              on posts and help keep people informed.
            </p>
          </div>
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="green-c">
              +{ratingImpact.positive_rating_impact_nh}
            </h4>
            <p>Ratings that helped a note reach the status of Not Helpful</p>
            <p className="gray-c p-medium">
              These ratings improve Community Notes by giving feedback to note
              authors, and allowing contributors to focus on the most promising
              notes.
            </p>
          </div>
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="red-c">-{ratingImpact.negative_rating_impact_h}</h4>
            <p>
              Ratings of Not Helpful on notes that ended up with a status of
              Helpful
            </p>
            <p className="gray-c p-medium">
              These ratings are common and can lead to status changes if enough
              people agree that a "Helpful" note isn’t sufficiently helpful.
            </p>
          </div>
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="red-c fx-centered">
              -{ratingImpact.negative_rating_impact_nh}{" "}
              <span
                className="sticker sticker-normal sticker-red"
                style={{
                  padding: ".5rem",
                  height: ".75rem",
                  borderRadius: "8px",
                }}
              >
                x2
              </span>
            </h4>
            <p>
              Ratings of Helpful on notes that ended up with a status of Not
              Helpful
            </p>
            <p className="gray-c p-medium">
              These ratings are counted twice because they often indicate
              support for notes that others deemed low-quality.
            </p>
          </div>
          <div className="fx-centered fx-col fit-container fx-start-v">
            <h4 className="gray-c">{ratingImpact.ongoing_rating_impact}</h4>
            <p>Pending</p>
            <p className="gray-c p-medium">
              Ratings on notes that don’t currently have a status of Helpful or
              Not Helpful.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashNewsCard = ({ self, newsContent }) => {
  const { nostrKeys, nostrUser, isPublishing, setToast, setToPublish } =
    useContext(Context);
  const navigateTo = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [author, setAuthor] = useState(newsContent.author);
  const [usersList, setUsersList] = useState(false);
  const [content, setContent] = useState("");
  const isMisLeading = newsContent.sealed_note
    ? JSON.parse(newsContent.sealed_note.content).tags.find(
        (tag) => tag[0] === "type" && tag[1] === "-"
      )
    : false;
  const [upvoteReaction, setUpvoteReaction] = useState([]);
  const [downvoteReaction, setDownvoteReaction] = useState([]);
  const isVoted = useMemo(() => {
    return nostrKeys
      ? upvoteReaction
          .concat(downvoteReaction)
          .find((item) => item.pubkey === nostrKeys.pub)
      : false;
  }, [upvoteReaction, downvoteReaction, nostrKeys]);

  const pool_ = new SimplePool();
  useEffect(() => {
    const sub = pool_.subscribeMany(
      nostrUser
        ? filterRelays(nostrUser?.relays || [], relaysOnPlatform)
        : relaysOnPlatform,
      [
        {
          kinds: [7],
          "#e": [newsContent.id],
        },
      ],
      {
        onevent(event) {
          if (event.content === "+")
            setUpvoteReaction((upvoteArticle) => [...upvoteArticle, event]);
          if (event.content === "-")
            setDownvoteReaction((downvoteArticle) => [
              ...downvoteArticle,
              event,
            ]);
        },
      }
    );
  }, []);

  useEffect(() => {
    const parsedContent = async () => {
      let res = await getNoteTree(newsContent.content);
      setContent(res);
    };
    parsedContent();
  }, []);

  // const getNoteTree = (note) => {
  //   let tree = note.split(/\s/);
  //   let finalTree = tree.map((el, index) => {
  //     if (/(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg))/i.test(el))
  //       return (
  //         <img
  //           className="sc-s-18"
  //           style={{ margin: "1rem auto" }}
  //           // style={{ margin: "1rem auto", aspectRatio: "16/9", objectFit: "contain", border: "none", objectPosition: 'left'}}
  //           width={"100%"}
  //           src={el}
  //           alt="el"
  //           key={`${el}-${index}`}
  //         />
  //       );
  //     else if (el.includes("nostr:")) {
  //       let nip19add = el.split("nostr:")[1];
  //       let url = getLinkFromAddr(nip19add);
  //       return (
  //         <Link
  //           to={url}
  //           className="btn-text-gray"
  //           target={"_blank"}
  //           key={`${el}-${index}`}
  //           onClick={(e) => e.stopPropagation()}
  //         >
  //           @{nip19add.substring(0, 10)}
  //         </Link>
  //       );
  //     } else if (/(https?:\/\/)/i.test(el)) {
  //       return (
  //         <a
  //           style={{ wordBreak: "break-word" }}
  //           href={el}
  //           className="btn-text-gray"
  //           key={`${el}-${index}`}
  //           onClick={(e) => e.stopPropagation()}
  //         >
  //           {el}
  //         </a>
  //       );
  //     } else
  //       return (
  //         <span
  //           style={{
  //             wordBreak: "break-word",
  //             color: newsContent.is_important
  //               ? "var(--c1)"
  //               : "var(--dark-gray)",
  //           }}
  //           key={`${el}-${index}`}
  //         >
  //           {el}
  //         </span>
  //       );
  //   });
  //   return finalTree;
  // };
  // const getLinkFromAddr = (addr) => {
  //   try {
  //     if (addr.includes("naddr")) {
  //       let data = nip19.decode(addr);
  //       return data.data.kind === 30023
  //         ? `/article/${addr}`
  //         : `/curations/${addr}`;
  //     }
  //     if (addr.includes("nprofile")) {
  //       return `/users/${addr}`;
  //     }
  //     if (addr.includes("npub")) {
  //       let hex = getHex(addr);
  //       return `/users/${nip19.nprofileEncode({ pubkey: hex })}`;
  //     }
  //     return addr;
  //   } catch (err) {
  //     return addr;
  //   }
  // };

  const upvoteArticle = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    try {
      if (!nostrKeys) {
        // setToLogin(true);
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        setToPublish({
          nostrKeys: nostrKeys,
          kind: 5,
          content: "This vote will be deleted!",
          tags: [["e", isVoted.id]],
          allRelays: nostrUser
            ? [
                ...filterRelays(relaysOnPlatform, nostrUser.relays),
                "wss://nostr.wine",
              ]
            : [...relaysOnPlatform, "wss://nostr.wine"],
        });

        setIsLoading(false);

        if (isVoted.content === "+") {
          let tempArray = Array.from(upvoteReaction);
          let index = tempArray.findIndex((item) => item.id === isVoted.id);
          tempArray.splice(index, 1);
          setUpvoteReaction(tempArray);
          return false;
        }
        let tempArray = Array.from(downvoteReaction);
        let index = tempArray.findIndex((item) => item.id === isVoted.id);
        tempArray.splice(index, 1);
        setDownvoteReaction(tempArray);
      }

      setIsLoading(true);
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 7,
        content: "+",
        tags: [["e", newsContent.id]],
        allRelays: nostrUser
          ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
          : relaysOnPlatform,
      });

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  const downvoteArticle = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    try {
      if (!nostrKeys) {
        // setToLogin(true);
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        setToPublish({
          nostrKeys: nostrKeys,
          kind: 5,
          content: "This vote will be deleted!",
          tags: [["e", isVoted.id]],
          allRelays: nostrUser
            ? [
                ...filterRelays(relaysOnPlatform, nostrUser.relays),
                "wss://nostr.wine",
              ]
            : [...relaysOnPlatform, "wss://nostr.wine"],
        });
        setIsLoading(false);
        if (isVoted.content === "-") {
          let tempArray = Array.from(downvoteReaction);
          let index = tempArray.findIndex((item) => item.id === isVoted.id);
          tempArray.splice(index, 1);
          setDownvoteReaction(tempArray);
          return false;
        }
        let tempArray = Array.from(upvoteReaction);
        let index = tempArray.findIndex((item) => item.id === isVoted.id);
        tempArray.splice(index, 1);
        setUpvoteReaction(tempArray);
      }
      setIsLoading(true);
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 7,
        content: "-",
        tags: [["e", newsContent.id]],
        allRelays: nostrUser
          ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
          : relaysOnPlatform,
      });

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  return (
    <>
      {usersList && (
        <ShowUsersList
          exit={() => setUsersList(false)}
          title={usersList.title}
          list={usersList.list}
          extras={usersList.extras}
        />
      )}

      <div
        className="fx-centered fx-col fx-start-v note-card fit-container"
        onClick={(e) => {
          e.stopPropagation();
          navigateTo(`/flash-news/${newsContent.nEvent}`);
        }}
      >
        {!self && (
          <div className="fx-centered fit-container fx-start-h">
            <UserProfilePicNOSTR
              img={newsContent.author[0].picture}
              size={20}
              user_id={newsContent.author[0].pubkey}
              ring={false}
            />
            <p className="p-medium gray-c">
              by <span className="c1-c">{newsContent.author[0].name}</span>
            </p>
            <span className="gray-c">&#x2022;</span>
            <p className="p-medium gray-c">
              <Date_
                toConvert={new Date(newsContent.created_at * 1000)}
                time={true}
              />
            </p>
          </div>
        )}
        {(newsContent.is_important || newsContent.keywords.length > 0) && (
          <div
            className="fx-centered fx-start-h fx-wrap"
            style={{ rowGap: 0, columnGap: "4px" }}
          >
            {newsContent.is_important && (
              <div className="sticker sticker-small sticker-c1-pale">
                <svg
                  viewBox="0 0 13 12"
                  xmlns="http://www.w3.org/2000/svg"
                  className="hot"
                >
                  <path d="M10.0632 3.02755C8.69826 3.43868 8.44835 4.60408 8.5364 5.34427C7.56265 4.13548 7.60264 2.74493 7.60264 0.741577C4.47967 1.98517 5.20595 5.57072 5.11255 6.65955C4.32705 5.98056 4.17862 4.35822 4.17862 4.35822C3.3494 4.80884 2.93359 6.01229 2.93359 6.98846C2.93359 9.34905 4.7453 11.2626 6.98011 11.2626C9.21492 11.2626 11.0266 9.34905 11.0266 6.98846C11.0266 5.58561 10.0514 4.93848 10.0632 3.02755Z"></path>
                </svg>
                Important
              </div>
            )}
            {newsContent.keywords.map((keyword) => {
              return (
                <div
                  key={keyword}
                  className="sticker sticker-small sticker-gray-black"
                >
                  {keyword}
                </div>
              );
            })}
          </div>
        )}
        {/* <div
          className="fx-centered fx-start-h fx-wrap"
          style={{ rowGap: 0, columnGap: "4px" }}
        > */}
        <div className="fit-container">{content}</div>
        <div className="fit-container fx-scattered box-pad-v-s">
          <div className="fx-centered">
            {/* <div className="bolt-24"></div>
          <div className="comment-24"></div> */}
            <div
              className={`fx-centered pointer ${isLoading ? "flash" : ""}`}
              style={{ columnGap: "8px" }}
            >
              <div
                className={
                  isVoted?.content === "+"
                    ? "arrow-up-bold icon-tooltip"
                    : "arrow-up icon-tooltip"
                }
                style={{ opacity: isVoted?.content === "-" ? ".2" : 1 }}
                data-tooltip="Upvote"
                onClick={upvoteArticle}
              ></div>
              <div
                className="icon-tooltip"
                data-tooltip="Upvoters"
                onClick={(e) => {
                  e.stopPropagation();
                  upvoteReaction.length > 0 &&
                    setUsersList({
                      title: "Upvoters",
                      list: upvoteReaction.map((item) => item.pubkey),
                      extras: [],
                    });
                }}
              >
                <NumberShrink value={upvoteReaction.length} />
              </div>
            </div>
            <div
              className={`fx-centered pointer ${isLoading ? "flash" : ""}`}
              style={{ columnGap: "8px" }}
            >
              <div
                className="icon-tooltip"
                data-tooltip="Downvote"
                onClick={downvoteArticle}
              >
                <div
                  className={
                    isVoted?.content === "-" ? "arrow-up-bold" : "arrow-up"
                  }
                  style={{
                    transform: "rotate(180deg)",
                    opacity: isVoted?.content === "+" ? ".2" : 1,
                  }}
                ></div>
              </div>
              <div
                className="icon-tooltip"
                data-tooltip="Downvoters"
                onClick={(e) => {
                  e.stopPropagation();
                  downvoteReaction.length > 0 &&
                    setUsersList({
                      title: "Downvoters",
                      list: downvoteReaction.map((item) => item.pubkey),
                      extras: [],
                    });
                }}
              >
                <NumberShrink value={downvoteReaction.length} />
              </div>
            </div>
          </div>
          <div className="fx-centered">
            {newsContent.source && (
              <a
                target={"_blank"}
                href={newsContent.source}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="round-icon round-icon-tooltip"
                  data-tooltip="source"
                >
                  <div className="globe-24"></div>
                </div>
              </a>
            )}
            <div
              className="round-icon round-icon-tooltip"
              data-tooltip="Bookmark flash news"
              onClick={(e) => e.stopPropagation()}
            >
              <SaveArticleAsBookmark
                pubkey={newsContent.id}
                itemType="e"
                kind="1"
              />
            </div>
          </div>
        </div>
        {newsContent.sealed_note && isMisLeading && (
          <UN
            data={JSON.parse(newsContent.sealed_note.content)}
            state="sealed"
            setTimestamp={() => null}
            flashNewsAuthor={newsContent.author.pubkey}
            sealedCauses={newsContent.sealed_note.tags
              .filter((tag) => tag[0] === "cause")
              .map((cause) => cause[1])}
          />
        )}
      </div>
    </>
  );
};
