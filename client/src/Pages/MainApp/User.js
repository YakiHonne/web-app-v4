import React, { useState, useEffect, useMemo, useRef, useReducer } from "react";
import Date_ from "../../Components/Date_";
import {
  checkForLUDS,
  decodeBolt11,
  getBech32,
  getBolt11,
  getEmptyuserMetadata,
  getParsedAuthor,
  getParsedNote,
  getParsedRepEvent,
  getuserMetadata,
  shortenKey,
} from "../../Helpers/Encryptions";
import { useNavigate, useParams } from "react-router-dom";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { nip19 } from "nostr-tools";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import ZapTip from "../../Components/Main/ZapTip";
import Follow from "../../Components/Main/Follow";
import ShowPeople from "../../Components/Main/ShowPeople";
import Helmet from "react-helmet";
import axios from "axios";
import NumberShrink from "../../Components/NumberShrink";
import CheckNIP05 from "../../Components/CheckNIP05";
import ArrowUp from "../../Components/ArrowUp";
import UN from "../../Components/Main/UN";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import {
  getAuthPubkeyFromNip05,
  getNoteTree,
  straightUp,
} from "../../Helpers/Helpers";
import Footer from "../../Components/Footer";
import LoadingDots from "../../Components/LoadingDots";
import ShareLink from "../../Components/ShareLink";
import InitiConvo from "../../Components/Main/InitConvo";
import KindOne from "../../Components/Main/KindOne";
import KindSix from "../../Components/Main/KindSix";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import TrendingUsers from "../../Components/Main/TrendingUsers";
import QRCode from "react-qr-code";
import Avatar from "boring-avatars";
import { useDispatch, useSelector } from "react-redux";
import { setFollowersCountSL } from "../../Store/Slides/Extras";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { saveFetchedUsers, saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import { getUser } from "../../Helpers/Controlers";
import { NDKUser } from "@nostr-dev-kit/ndk";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import { getUserFollowers, getUserStats } from "../../Helpers/WSInstance";

const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

const eventsReducer = (notes, action) => {
  switch (action.type) {
    case "notes": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "articles": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "curations": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "videos": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }

    case "flashnews": {
      let nextState = { ...notes };
      nextState[action.type] = action.note;
      return nextState;
    }

    case "empty-followings": {
      let nextState = { ...notes };
      nextState["followings"] = [];
      return nextState;
    }
    case "remove-events": {
      return eventsInitialState;
    }
    default: {
      console.log("wrong action type");
    }
  }
};

const eventsInitialState = {
  notes: [],
  articles: [],
  flashnews: [],
  curations: [],
  videos: [],
};

const decodeURL = (url) => {
  try {
    let pubkey = nip19.decode(url);
    if (pubkey) return pubkey.data.pubkey;
    return false;
  } catch (err) {
    return false;
  }
};

export default function User() {
  const { user_id } = useParams();
  const [id, setID] = useState(false);
  const [user, setUser] = useState({});
  const extrasRef = useRef(null);

  return (
    <>
      <div>
        <Helmet>
          <title>Yakihonne | {user?.name || "<Anonymous>"}</title>
          <meta name="description" content={user?.about} />
          <meta property="og:description" content={user?.about} />
          <meta property="og:image" content={user?.picture} />
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
            content={`Yakihonne | ${user?.name || "<Anonymous>"}`}
          />
          <meta
            property="twitter:title"
            content={`Yakihonne | ${user?.name || "<Anonymous>"}`}
          />
          <meta property="twitter:description" content={user?.about} />
          <meta property="twitter:image" content={user?.picture} />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main className="main-page-nostr-container">
              <ArrowUp />
              <div
                className="fx-centered fit-container  fx-start-v"
                style={{ gap: 0 }}
              >
                <div
                  style={{
                    zIndex: "11",
                    position: "relative",
                  }}
                  className="main-middle"
                >
                  <UserMetadata />
                  <div
                    className="it-container fx-centered fx-col"
                    style={{ position: "relative" }}
                  >
                    <UserFeed pubkey={id} user={user} />
                  </div>
                </div>
                {/* <div
                  className=" fx-centered fx-col fx-start-v extras-homepage"
                  style={{
                    position: "sticky",
                    top:
                      extrasRef.current?.getBoundingClientRect().height >=
                      window.innerHeight
                        ? `calc(95vh - ${
                            extrasRef.current?.getBoundingClientRect().height ||
                            0
                          }px)`
                        : 0,
                    zIndex: "10",
                    flex: 1,
                  }}
                  ref={extrasRef}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>
                  <ImportantFlashNews />
                  <TrendingUsers />
                  <Footer />
                </div> */}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const UserMetadata = () => {
  const navigateTo = useNavigate();
  const { user_id } = useParams();
  const dispatch = useDispatch();
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const userMutedList = useSelector((state) => state.userMutedList);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [user, setUser] = useState({});
  const [showPeople, setShowPeople] = useState(false);
  const [showWritingImpact, setShowWritingImpact] = useState(false);
  const [showRatingImpact, setShowRatingImpact] = useState(false);
  const [satsSent, setSatsSent] = useState(0);
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  const [id, setID] = useState(false);
  const [following, setFollowings] = useState([]);
  const [userStats, setUserStats] = useState({ followings: 0, followers: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [userImpact, setUserImpact] = useState(false);
  const [showUserImpact, setShowUserImpact] = useState(false);
  const [initConv, setInitConv] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isMuted = useMemo(() => {
    let checkProfile = () => {
      if (!Array.isArray(userMutedList)) return false;
      let index = userMutedList.findIndex((item) => item === user?.pubkey);
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [userMutedList, user]);

  useEffect(() => {
    const dataFetching = async () => {
      try {
        setIsLoaded(false);
        setShowPeople(false);
        setUserStats({ followings: 0, followers: 0 });
        setFollowings(0);
        getMetadata();
      } catch (err) {
        console.log(err);
        navigateTo("/");
      }
    };
    if (id) {
      dataFetching();
    }
  }, [id, timestamp]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const USER_IMPACT = await axios.get(
          API_BASE_URL + "/api/v1/user-impact",
          {
            params: { pubkey: id },
          }
        );

        setUserImpact(USER_IMPACT.data);
      } catch (err) {
        console.log(err);
      }
    };
    if (id) fetchData();
  }, [id]);

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

  const getMetadata = async () => {
    try {
      setFollowings([]);

      let cachedUser = getUser(id);

      if (cachedUser) {
        setUser(cachedUser);
        setIsLoaded(true);
      }
      let stats = await getUserStats(id);
      if (stats) {
        let userProfile = stats.find((_) => _.kind === 0);
        let userStats_ = stats.find((_) => _.kind === 10000105);
        userStats_ = userStats_ ? JSON.parse(userStats_.content) : false;

        setUser(getuserMetadata(userProfile));
        if (userStats_)
          setUserStats({
            followings: userStats_.follows_count,
            followers: userStats_.followers_count,
          });
        dispatch(setFollowersCountSL(userStats_.followers_count));
        setIsLoaded(true);
      }
      let p = new NDKUser({ pubkey: id });
      p.ndk = ndkInstance;
      if (!stats) {
        let profile = await p.fetchProfile();
        if (profile) {
          let parsedProfile = getParsedAuthor(JSON.parse(profile.profileEvent));
          setUser(parsedProfile);
          saveFetchedUsers([parsedProfile]);
          setIsLoaded(true);
        }
      }
      let follows = await p.follows(undefined, true);

      let tempFollowing = [...follows].map((_) => _.pubkey);
      setFollowings(tempFollowing);
    } catch (err) {
      console.log(err);
    }
  };

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(userMutedList)) return;
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }

      let tempTags = Array.from(userMutedList.map((pubkey) => ["p", pubkey]));
      if (isMuted) {
        tempTags.splice(isMuted.index, 1);
      } else {
        tempTags.push(["p", user?.pubkey]);
      }
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10000,
          content: "",
          tags: tempTags,
          allRelays: userRelays,
        })
      );
    } catch (err) {
      console.log(err);
    }
  };

  const copyID = (e, pubkey) => {
    e.stopPropagation();
    navigator?.clipboard?.writeText(getBech32("npub", pubkey));
    dispatch(
      setToast({
        type: 1,
        desc: `Pubkey was copied! 👏`,
      })
    );
  };

  const handleInitConvo = () => {
    if (userKeys && (userKeys.sec || userKeys.ext)) {
      setInitConv(true);
    }
  };

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
      {initConv && <InitiConvo exit={() => setInitConv(false)} receiver={id} />}
      {showQR && <QRSharing user={user} exit={() => setShowQR(false)} />}
      {showUserImpact && (
        <UserImpact
          user={user}
          exit={() => setShowUserImpact(false)}
          userImpact={userImpact}
        />
      )}
      <div className="fit-container">
        <div
          className="fit-container fx-centered fx-start-h fx-end-v fx-start-v box-pad-h-s box-pad-v-s bg-img cover-bg"
          style={{
            position: "relative",
            height: "250px",
          }}
        >
          <div
            className="fit-container sc-s bg-img cover-bg"
            style={{
              height: "calc(100% - 90px)",
              position: "absolute",
              left: 0,
              top: 0,
              backgroundImage: user?.banner ? `url(${user?.banner})` : "",
              backgroundColor: "var(--very-dim-gray)",
              overflow: "visible",
              zIndex: 0,
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
            }}
          ></div>
          <div
            className="fx-centered fx-col fx-start-v fit-container"
            style={{ position: "relative", zIndex: 200 }}
          >
            {isLoaded && (
              <div
                className="fx-centered fx-end-v fit-container"
                style={{ columnGap: "16px" }}
              >
                <UserPP size={128} src={user?.picture} user_id={user?.pubkey} />
                <div className="fit-container fx-scattered">
                  <div
                    className="fx-centered fx-col fx-start-v box-pad-v-m"
                    style={{ gap: "6px" }}
                  >
                    <h4 className="p-caps">
                      {user?.display_name || user?.name}
                    </h4>
                    <div
                      className="fx-centered pointer"
                      onClick={() => setShowQR(true)}
                    >
                      <p className="p-caps orange-c">
                        {shortenKey(getBech32("npub", user.pubkey), 4)}
                      </p>
                      <div>
                        <div className="qrcode"></div>
                      </div>
                    </div>
                  </div>
                  <div className="fx-centered">
                    {user.pubkey === userKeys.pub && (
                      <button
                        className="btn btn-gray"
                        onClick={() => navigateTo("/settings/profile")}
                      >
                        Edit profile
                      </button>
                    )}
                    {user.pubkey !== userKeys.pub && (
                      <div className="fx-centered">
                        <Follow
                          toFollowKey={user?.pubkey}
                          toFollowName={user?.name}
                          setTimestamp={setTimestamp}
                          bulkList={[]}
                        />
                        <ZapTip
                          recipientLNURL={checkForLUDS(
                            user?.lud06,
                            user?.lud16
                          )}
                          recipientPubkey={user?.pubkey}
                          senderPubkey={userKeys.pub}
                          recipientInfo={{
                            name: user?.name,
                            picture: user?.picture,
                          }}
                        />
                        <div
                          className="round-icon round-icon-tooltip"
                          data-tooltip={
                            userKeys && (userKeys.sec || userKeys.ext)
                              ? `Message ${user?.name || "this profile"}`
                              : `Login to message ${
                                  user?.name || "this profile"
                                }`
                          }
                          onClick={handleInitConvo}
                        >
                          <div className="env-edit-24"></div>
                        </div>
                      </div>
                    )}
                    <OptionsDropdown
                      border={true}
                      options={[
                        <div
                          className="fit-container fx-centered fx-start-h pointer"
                          onClick={(e) => copyID(e, user?.pubkey)}
                        >
                          <p className="fx-centered">Copy user pubkey</p>
                        </div>,
                        <div
                          className="fit-container fx-centered fx-start-h pointer"
                          onClick={() => setShowUserImpact(true)}
                        >
                          <p className="fx-centered">User impact</p>
                        </div>,
                        <div className="fit-container fx-centered fx-start-h pointer">
                          <ShareLink
                            label={"Share profile"}
                            path={`/users/${user_id}`}
                            title={user?.display_name || user?.name}
                            description={user?.about || ""}
                            kind={0}
                            shareImgData={{
                              post: { image: user?.cover },
                              author: user,
                              followings: following.length,
                            }}
                          />
                        </div>,
                        userKeys && userKeys.pub !== user?.pubkey && (
                          <div
                            className="fit-container fx-scattered  pointer"
                            onClick={isPublishing ? null : muteUnmute}
                          >
                            <p
                              className="red-c"
                              style={{
                                opacity: isPublishing ? 0.5 : 1,
                              }}
                            >
                              {isMuted ? "Unmute" : "Mute"} profile
                            </p>
                            {isMuted ? (
                              <div className="unmute-24"></div>
                            ) : (
                              <div className="mute-24"></div>
                            )}
                          </div>
                        ),
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}
            {!isLoaded && (
              <div className="box-pad-h box-pad-v fit-container fx-centered">
                <LoadingDots />
              </div>
            )}
          </div>
        </div>
        <div className="fx-centered fit-container box-pad-v-m box-pad-h-m">
          <div
            className="fx-centered fx-col fx-start-v"
            style={{ width: "min(100%, 800px)" }}
          >
            <div className="fx-centered">
              <div className="nip05-24"></div>{" "}
              {user?.nip05 && (
                <CheckNIP05
                  address={user?.nip05}
                  pubkey={user?.pubkey}
                  smallSize={false}
                />
              )}
              {!user?.nip05 && <p>N/A</p>}
            </div>

            <div className="fx-centered fx-start-h">
              <div className="link-24"></div>

              {!user?.website && <p>N/A</p>}
              {user?.website && (
                <a
                  href={
                    user?.website.toLowerCase().includes("http")
                      ? user?.website
                      : `https://${user?.website}`
                  }
                  target="_blank"
                >
                  {user?.website || "N/A"}
                </a>
              )}
            </div>
            <div
              className="fx-centered fx-start-v "
              style={{ columnGap: "24px" }}
            >
              <div className="box-pad-v-s fx-centered fx-start-v fx-col">
                {user?.about && (
                  <p
                    className="p-centered  p-left"
                    // style={{ maxWidth: "400px" }}
                  >
                    {user?.about}
                  </p>
                )}
                <div className="fx-centered">
                  <div className="fx-centered" style={{ columnGap: "10px" }}>
                    <div className="user"></div>
                    <div
                      className="pointer"
                      onClick={() =>
                        following.length !== 0
                          ? setShowPeople("following")
                          : null
                      }
                    >
                      <p>
                        <NumberShrink value={userStats.followings} />{" "}
                        <span className="gray-c">Following</span>
                      </p>
                    </div>
                    <UserFollowers
                      id={id}
                      followersCount={userStats.followers}
                    />
                    {userKeys && following.includes(userKeys?.pub) && (
                      <div className="sticker sticker-gray-black">
                        Follows you
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const UserFeed = ({ user }) => {
  const { user_id } = useParams();
  const [pubkey, setPubkey] = useState(decodeURL(user_id));
  const [events, dispatchEvents] = useReducer(
    eventsReducer,
    eventsInitialState
  );
  const [isLoading, setIsLoading] = useState(false);
  const [contentFrom, setContentFrom] = useState("notes");
  const [lastEventTime, setLastEventTime] = useState(undefined);
  const [notesSub, setNotesSub] = useState(false);

  useEffect(() => {
    const getID = async () => {
      try {
        if (user_id?.includes("@")) {
          let pubkey = await getAuthPubkeyFromNip05(user_id);
          setPubkey(pubkey);
          return;
        }
        let pubkey = nip19.decode(user_id);
        setPubkey(pubkey.data.pubkey);
      } catch (err) {
        console.log(err);
      }
    };
    getID();
    straightUp();
    setLastEventTime(undefined);
    dispatchEvents({ type: "remove-events" });
  }, [user_id]);

  const getNotesFilter = () => {
    let kinds = {
      notes: [1, 6],
      flashnews: [1],
      articles: [30023],
      videos: [34235],
      curations: [30004],
    };
    if (contentFrom === "flashnews")
      return [
        {
          kinds: kinds[contentFrom],
          authors: [pubkey],
          "#l": ["FLASH_NEWS"],
          limit: 10,
          until: lastEventTime,
        },
      ];
    return [
      {
        kinds: kinds[contentFrom],
        authors: [pubkey],
        limit: 10,
        until: lastEventTime,
      },
    ];
  };

  useEffect(() => {
    const handleScroll = () => {
      // if (notesContentFrom === "trending") return;
      let container = document.querySelector(".main-page-nostr-container");

      if (!container) return;
      if (
        container.scrollHeight - container.scrollTop - 60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      setLastEventTime(
        events[contentFrom][events[contentFrom].length - 1]?.created_at ||
          undefined
      );
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  useEffect(() => {
    if (!pubkey) return;
    setIsLoading(true);
    let eventsPubkeys = [];
    let events_ = [];
    let filter = getNotesFilter();

    let subscription = ndkInstance.subscribe(filter, {
      closeOnEose: true,
      skipValidation: true,
      groupable: false,
      skipVerification: true,
      cacheUsage: "ONLY_RELAY",
    });

    subscription.on("event", async (event) => {
      if ([1, 6].includes(event.kind)) {
        let event_ = await getParsedNote(event);
        if (event_ && !event_.isFlashNews) {
          if (event.kind === 6) {
            eventsPubkeys.push(event_.relatedEvent.pubkey);
          }
          events_.push(event_);
        }
      }
      if ([30023, 30004].includes(event.kind)) {
        let event_ = getParsedRepEvent(event);
        events_.push(event_);
      }
      if ([34235].includes(event.kind)) {
        let event_ = getParsedRepEvent(event);
        events_.push(event_);
      }
    });

    subscription.on("close", () => {
      dispatchEvents({ type: contentFrom, note: events_ });
      saveUsers(eventsPubkeys);
      setIsLoading(false);
    });

    setNotesSub(subscription);

    let timer = setTimeout(() => subscription.stop(), 2000);

    return () => {
      if (subscription) subscription.stop();
      clearTimeout(timer);
    };
  }, [lastEventTime, contentFrom, pubkey]);

  const switchContentType = (type) => {
    if (notesSub) notesSub.stop();
    straightUp();
    setIsLoading(true);
    dispatchEvents({ type: "remove-events" });
    setLastEventTime(undefined);
    setContentFrom(type);
  };

  return (
    <div className="fx-centered  fx-wrap fit-container" style={{ gap: 0 }}>
      <div
        className="fit-container fx-even sticky box-pad-h"
        style={{
          top: "-1px",
          // padding: "1rem",
          paddingTop: 0,
          paddingBottom: 0,
          columnGap: 0,
          borderBottom: "1px solid var(--very-dim-gray)",
          borderTop: "1px solid var(--very-dim-gray)",
        }}
      >
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "notes" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("notes")}
        >
          Notes
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "articles" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("articles")}
        >
          Articles
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "curations" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("curations")}
        >
          Curations
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "videos" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("videos")}
        >
          Videos
        </div>
      </div>

      {/* <div
        className="fit-container sticky fx-centered box-pad-h fx-col"
        style={{
          top:"-1px",
          padding: "1rem",
          borderBottom: "1px solid var(--very-dim-gray)",
          borderTop: "1px solid var(--very-dim-gray)",
        }}
      >
        <div className="fit-container fx-scattered">
          <h3>Feed</h3>
          <Select
            options={feedOptions}
            value={contentFrom}
            setSelectedValue={(data) => setContentFrom(data)}
          />
        </div>
      </div> */}
      {contentFrom === "notes" && (
        <div className="fit-container fx-centered fx-col">
          {events[contentFrom].length > 0 && (
            <>
              <div
                style={{ width: "min(100%,800px)", gap: 0 }}
                className="fx-around fx-wrap"
              >
                {events[contentFrom].map((note) => {
                  if (note.kind === 6)
                    return <KindSix event={note} key={note.id} />;
                  if (note.kind === 1 && note.isComment)
                    return (
                      <KindOneComments
                        event={note}
                        key={note.id}
                        author={user}
                      />
                    );
                  return <KindOne event={note} key={note.id} border={true} />;
                })}
              </div>
            </>
          )}
          {events[contentFrom].length === 0 && !isLoading && (
            <div
              className="fx-centered fx-col box-pad-v"
              style={{ height: "30vh" }}
            >
              <h4>Oops! Nothing to show here!</h4>
              <p className="gray-c">
                {user?.name} hasn't written any notes or replies
              </p>
              <div
                className="note-2-24"
                style={{ width: "48px", height: "48px" }}
              ></div>
            </div>
          )}
        </div>
      )}
      {contentFrom === "curations" && (
        <div className="fit-container fx-centered fx-col">
          {events[contentFrom].length > 0 && (
            <>
              <div
                style={{ width: "min(100%,800px)" }}
                className="fx-around fx-wrap posts-cards"
              >
                {events[contentFrom].map((item) => {
                  return <RepEventPreviewCard key={item.id} item={item} />;
                })}
              </div>
            </>
          )}
          {events[contentFrom].length === 0 && !isLoading && (
            <div
              className="fx-centered fx-col box-pad-v"
              style={{ height: "30vh" }}
            >
              <h4>Oops! Nothing to show here!</h4>
              <p className="gray-c">{user?.name} has no curations</p>
              <div
                className="curation-24"
                style={{ width: "48px", height: "48px" }}
              ></div>
            </div>
          )}
        </div>
      )}

      {contentFrom === "articles" && (
        <div className="fit-container fx-centered fx-col">
          {events[contentFrom].length === 0 && !isLoading && (
            <div
              className="fx-centered fx-col box-pad-v"
              style={{ height: "30vh" }}
            >
              <h4>Oops! Nothing to read here!</h4>
              <p className="gray-c">
                {user?.name} hasn't written any article yet
              </p>
              <div
                className="posts"
                style={{ width: "48px", height: "48px" }}
              ></div>
            </div>
          )}
          {events[contentFrom].length > 0 && (
            <>
              <div
                style={{ width: "min(100%,800px)", gap: 0 }}
                className="fx-around fx-wrap posts-cards"
              >
                {events[contentFrom].map((post) => {
                  let fullPost = {
                    ...post,
                    author_img: user?.picture,
                  };
                  return (
                    <div key={post.id} className="fx-centered fit-container">
                      <RepEventPreviewCard item={fullPost} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
      {contentFrom === "videos" && (
        <div className="fit-container fx-centered fx-col">
          {events[contentFrom].length === 0 && !isLoading && (
            <div
              className="fx-centered fx-col box-pad-v"
              style={{ height: "30vh" }}
            >
              <h4>Oops! Nothing to read here!</h4>
              <p className="gray-c">
                {user?.name} hasn't posted any videos yet
              </p>
              <div
                className="play-24"
                style={{ width: "48px", height: "48px" }}
              ></div>
            </div>
          )}
          {events[contentFrom].length > 0 && (
            <>
              <div
                style={{ width: "min(100%,800px)" }}
                className="fx-around fx-wrap posts-cards"
              >
                {events[contentFrom].map((video) => {
                  return (
                    <div key={video.id} className="fx-centered fit-container">
                      <RepEventPreviewCard item={video} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
      {isLoading && (
        <div
          className="fit-container box-pad-v fx-centered fx-col"
          style={{ height: "30vh" }}
        >
          <p className="gray-c">Loading</p>
          <LoadingDots />
        </div>
      )}
    </div>
  );
};

const UserFollowers = ({ id, followersCount }) => {
  const dispatch = useDispatch();
  const [followers, setFollowers] = useState([]);
  const [showPeople, setShowPeople] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      if (!isLoading) setIsLoading(true);
      let userFollowers = await getUserFollowers(id);
      userFollowers = userFollowers
        .filter((_) => _.kind === 0)
        .map((_) => {
          return getuserMetadata(_);
        });
      setFollowers(userFollowers);
    };
    if (showPeople) fetchData();
  }, [showPeople]);

  return (
    <>
      {showPeople === "followers" && (
        <ShowPeople
          exit={() => setShowPeople(false)}
          list={followers}
          type={showPeople}
        />
      )}
      <div className="pointer" onClick={() => setShowPeople("followers")}>
        <p>
          <NumberShrink value={followersCount} />{" "}
          <span className="gray-c">Followers</span>
        </p>
      </div>
    </>
  );
};

const SatsReceived = ({ id }) => {
  const [satsRec, setSatsRec] = useState([]);
  useEffect(() => {
    if (!id) return;
    if (satsRec.length > 0) setSatsRec([]);
    let sub = ndkInstance.subscribe(
      [
        {
          kinds: [9735],
          "#p": [id],
        },
      ],
      { cacheUsage: "CACHE_FIRST" }
    );

    sub.on("event", (event) => {
      let sats = decodeBolt11(getBolt11(event));
      let tempEv = {
        ...event,
        amount: sats,
      };
      setSatsRec((prev) => [...prev, tempEv]);
    });
    return () => {
      sub.stop();
    };
  }, [id]);

  return (
    <div>
      <p>
        <NumberShrink
          value={satsRec.reduce((total, item) => (total += item.amount), 0)}
        />{" "}
        <span className="gray-c">Received</span>
      </p>
    </div>
  );
};

const WritingImpact = ({ writingImpact }) => {
  return (
    <div className="fit-container fx-centered fx-col">
      <div className="fx-centered fx-col fit-container fx-start-v">
        <h4 className="green-c">+{writingImpact.positive_writing_impact}</h4>
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
  );
};

const RatingImpact = ({ ratingImpact }) => {
  return (
    <div className="fit-container fx-centered fx-col">
      <div className="fx-centered fx-col fit-container fx-start-v">
        <h4 className="green-c">+{ratingImpact.positive_rating_impact_h}</h4>
        <p>Ratings that helped a note earn the status of Helpful</p>
        <p className="gray-c p-medium">
          These ratings identified Helpful notes that get shown as context on
          posts and help keep people informed.
        </p>
      </div>
      <div className="fx-centered fx-col fit-container fx-start-v">
        <h4 className="green-c">+{ratingImpact.positive_rating_impact_nh}</h4>
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
          Ratings of Not Helpful on notes that ended up with a status of Helpful
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
          Ratings of Helpful on notes that ended up with a status of Not Helpful
        </p>
        <p className="gray-c p-medium">
          These ratings are counted twice because they often indicate support
          for notes that others deemed low-quality.
        </p>
      </div>
      <div className="fx-centered fx-col fit-container fx-start-v">
        <h4 className="gray-c">{ratingImpact.ongoing_rating_impact}</h4>
        <p>Pending</p>
        <p className="gray-c p-medium">
          Ratings on notes that don’t currently have a status of Helpful or Not
          Helpful.
        </p>
      </div>
    </div>
  );
};

const FlashNewsCard = ({ self, newsContent }) => {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const isPublishing = useSelector((state) => state.isPublishing);
  const userRelays = useSelector((state) => state.userRelays);
  const navigateTo = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
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
    return userKeys
      ? upvoteReaction
          .concat(downvoteReaction)
          .find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [upvoteReaction, downvoteReaction, userKeys]);

  useEffect(() => {
    const sub = ndkInstance.subscribe(
      [
        {
          kinds: [7],
          "#e": [newsContent.id],
        },
      ],
      { cacheUsage: "CACHE_FIRST" }
    );

    sub.on("event", (event) => {
      if (event.content === "+")
        setUpvoteReaction((upvoteArticle) => [...upvoteArticle, event]);
      if (event.content === "-")
        setDownvoteReaction((downvoteArticle) => [...downvoteArticle, event]);
    });
  }, []);

  useEffect(() => {
    const parsedContent = async () => {
      let res = await getNoteTree(newsContent.content);
      setContent(res);
    };
    parsedContent();
  }, []);

  const upvoteArticle = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isPublishing) {
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    try {
      if (!userKeys) {
        // setToLogin(true);
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        dispatch(
          setToPublish({
            userKeys: userKeys,
            kind: 5,
            content: "This vote will be deleted!",
            tags: [["e", isVoted.id]],
            allRelays: userRelays,
          })
        );

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
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 7,
          content: "+",
          tags: [["e", newsContent.id]],
          allRelays: userRelays,
        })
      );

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
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    try {
      if (!userKeys) {
        // setToLogin(true);
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        dispatch(
          setToPublish({
            userKeys: userKeys,
            kind: 5,
            content: "This vote will be deleted!",
            tags: [["e", isVoted.id]],
            allRelays: userRelays,
          })
        );
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
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 7,
          content: "-",
          tags: [["e", newsContent.id]],
          allRelays: userRelays,
        })
      );

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
              <BookmarkEvent pubkey={newsContent.id} itemType="e" kind="1" />
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

const KindOneComments = ({ event }) => {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  const [relatedEvent, setRelatedEvent] = useState(false);
  const [isRelatedEventLoaded, setIsRelatedEventLoaded] = useState(false);

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        let auth = await getUser(event.pubkey);
        setUser(auth);
      } catch (err) {
        console.log(err);
      }
    };
    fetchAuthor();
  }, [nostrAuthors]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let event_ = await ndkInstance.fetchEvent(
          [{ kinds: [1], ids: [event.isComment] }],
          { groupable: false, cacheUsage: "ONLY_RELAY" }
          // { cacheUsage: "CACHE_FIRST" }
        );
        if (event_) setRelatedEvent(await getParsedNote(event_));
        setIsRelatedEventLoaded(true);
      } catch (err) {
        setIsRelatedEventLoaded(true);
      }
    };
    if (!relatedEvent) {
      fetchData();
      // let sub = ndkInstance.subscribe(
      //   [{ kinds: [1], ids: [event.isComment] }]
      //   // { cacheUsage: "CACHE_FIRST" }
      // );
      // console.log(event.isComment);
      // sub.on("event", async (event_) => {
      //   console.log(event_);
      //   setRelatedEvent(await getParsedNote(event_));
      // });
      // sub.on("close", () => {
      //   setIsRelatedEventLoaded(true);
      // });
    }
  }, []);

  return (
    <div
      className="fx-centered fx-col fx-start-v fit-container"
      style={{
        // backgroundColor: "var(--c1-side)",
        gap: 0,
        overflow: "visible",
        borderBottom: "1px solid var(--very-dim-gray)",
      }}
    >
      <div
        className="fx-centered  box-pad-h-s box-pad-v-s fx-start-h sc-s-18 round-icon-tooltip pointer box-pad-h-m"
        style={{ overflow: "visible", marginLeft: ".5rem", marginTop: ".5rem" }}
        data-tooltip={`commented on ${new Date(
          event.created_at * 1000
        ).toLocaleDateString()}`}
      >
        <UserProfilePicNOSTR
          size={20}
          mainAccountUser={false}
          ring={false}
          user_id={user?.pubkey}
          img={user?.picture}
        />
        <div>
          <p className="p-medium">
            {user?.display_name || user?.name}{" "}
            <span className="orange-c">Commented on this</span>
          </p>
        </div>
      </div>
      {relatedEvent && (
        <div className="fit-container">
          <KindOne event={relatedEvent} />
        </div>
      )}
      {!isRelatedEventLoaded && !relatedEvent && (
        <div
          style={{
            backgroundColor: "var(--c1-side)",
            width: "95%",
            margin: ".5rem auto",
          }}
          className="fit-container box-pad-h box-pad-v sc-s-18 fx-centered"
        >
          <p className="p-medium gray-c">Loading note</p>
          <LoadingDots />
        </div>
      )}

      {isRelatedEventLoaded && !relatedEvent && (
        <div
          style={{
            backgroundColor: "var(--c1-side)",
            width: "95%",
            margin: ".5rem auto",
          }}
          className="fit-container box-pad-h-m box-pad-v-m sc-s-18 fx-centered"
        >
          <p className="p-medium orange-c p-italic">
            The note does not seem to be found
          </p>
        </div>
      )}
      <div className="fit-container fx-centered fx-end-h box-marg-s box-pad-h-m">
        <div
          className="fx-centered fx-start-v fx-start-h box-pad-h-m box-pad-v-m sc-s-18"
          style={{ backgroundColor: "var(--c1-side)", width: "95%" }}
        >
          <UserProfilePicNOSTR
            size={20}
            mainAccountUser={false}
            ring={false}
            user_id={user?.pubkey}
            img={user?.picture}
          />
          <div className="fit-container p-medium">{event.note_tree}</div>
        </div>
      </div>
    </div>
  );
};

const QRSharing = ({ user, exit }) => {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState("pk");
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
    <div className="fixed-container box-pad-h fx-centered" onClick={exit}>
      <div
        className="sc-s box-pad-h box-pad-v"
        style={{
          width: "min(100%,400px)",
          position: "relative",
          // background:
          //   "linear-gradient(180deg, rgba(156,39,176,1) 0%, rgba(41,121,255,1) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <div className="fx-centered fx-col">
          <UserProfilePicNOSTR
            user_id={user?.pubkey}
            mainAccountUser={false}
            size={100}
            ring={false}
            img={user?.picture}
          />
          <h4 className="p-centered">{user?.display_name || user?.name}</h4>
          <p className="gray-c">@{user?.name || user?.display_name}</p>
        </div>
        <div className="fx-centered box-pad-v-m">
          <div
            className={`list-item ${
              selectedTab === "pk" ? "selected-list-item" : ""
            }`}
            onClick={() => setSelectedTab("pk")}
          >
            Pubkey
          </div>
          {user?.lud16 && (
            <div
              className={`list-item ${
                selectedTab === "ln" ? "selected-list-item" : ""
              }`}
              onClick={() => setSelectedTab("ln")}
            >
              Lightning address
            </div>
          )}
        </div>
        <div className="fx-centered fit-container box-marg-s">
          <div
            className="box-pad-v-m box-pad-h-m sc-s-18"
            style={{ backgroundColor: "white" }}
          >
            {selectedTab === "pk" && (
              <QRCode size={200} value={getBech32("npub", user?.pubkey)} />
            )}
            {selectedTab === "ln" && <QRCode size={200} value={user?.lud16} />}
          </div>
        </div>
        <div className="fit-container fx-col fx-centered">
          <div
            className={"fx-scattered if pointer fit-container dashed-onH"}
            style={{ borderStyle: "dashed" }}
            onClick={() =>
              copyKey("The pubkey", getBech32("npub", user?.pubkey))
            }
          >
            <div className="key-icon-24"></div>
            <p>{shortenKey(getBech32("npub", user?.pubkey))}</p>
            <div className="copy-24"></div>
          </div>
          {user?.lud16 && (
            <div
              className={"fx-scattered if pointer fit-container dashed-onH"}
              style={{ borderStyle: "dashed" }}
              onClick={() => copyKey("The lightning address", user?.lud16)}
            >
              <div className="bolt-24"></div>
              <p>{user?.lud16}</p>
              <div className="copy-24"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserImpact = ({ user, exit, userImpact }) => {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState("write");
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
    <div
      className="fixed-container box-pad-h box-pad-v fx-start-v fx-centered"
      style={{ paddingTop: "6rem" }}
      onClick={exit}
    >
      <div
        className="sc-s box-pad-h box-pad-v"
        style={{
          width: "min(100%,500px)",
          position: "relative",

          // background:
          //   "linear-gradient(180deg, rgba(156,39,176,1) 0%, rgba(41,121,255,1) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <div className="fx-centered fx-col">
          <UserProfilePicNOSTR
            user_id={user?.pubkey}
            mainAccountUser={false}
            size={100}
            ring={false}
            img={user?.picture}
          />
          <h4 className="p-centered">{user?.display_name || user?.name}</h4>
        </div>
        <div className="fx-centered box-pad-v-m fit-container">
          <div
            className={`fx fx-centered list-item-b ${
              selectedTab === "write" ? "selected-list-item-b" : ""
            }`}
            onClick={() => setSelectedTab("write")}
          >
            <h4>{userImpact.writing_impact.writing_impact}</h4>
            <p className="gray-c">Writing impact</p>
          </div>

          <div
            className={`fx fx-centered list-item-b ${
              selectedTab === "rate" ? "selected-list-item-b" : ""
            }`}
            onClick={() => setSelectedTab("rate")}
          >
            <h4>{userImpact.rating_impact.rating_impact}</h4>
            <p className="gray-c">Rating impact</p>
          </div>
        </div>
        <div className="fx-centered fit-container ">
          {selectedTab === "write" && (
            <WritingImpact writingImpact={userImpact.writing_impact} />
          )}
          {selectedTab === "rate" && (
            <RatingImpact ratingImpact={userImpact.rating_impact} />
          )}
        </div>
      </div>
    </div>
  );
};

const UserPP = ({ src, size, user_id }) => {
  const [resize, setResize] = useState(false);
  if (!src) {
    return (
      <div
        style={{
          border: "6px solid var(--white)",
          borderRadius: "var(--border-r-50)",
          position: "relative",
          overflow: "hidden",
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
        className="settings-profile-pic"
      >
        <Avatar
          size={size}
          name={user_id}
          variant="beam"
          colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
        />
      </div>
    );
  }
  return (
    <>
      {resize && (
        <div
          className="fixed-container box-pad-h box-pad-v fx-centered "
          onClick={(e) => {
            e.stopPropagation();
            setResize(false);
          }}
          style={{ zIndex: 2000 }}
        >
          <div
            style={{
              position: "relative",
              // maxWidth: "800px",
              // maxHeight: "80vh",
              width: "min(100%, 600px)",
            }}
          >
            <div
              className="close"
              onClick={(e) => {
                e.stopPropagation();
                setResize(false);
              }}
            >
              <div></div>
            </div>
            <img
              className="sc-s-18"
              width={"100%"}
              style={{
                objectFit: "contain",
                maxHeight: "60vh",
                backgroundColor: "transparent",
              }}
              src={src}
              alt="el"
              loading="lazy"
            />
          </div>
        </div>
      )}
      <img
        onClick={(e) => {
          e.stopPropagation();
          setResize(true);
        }}
        className="sc-s-18 settings-profile-pic"
        style={{
          cursor: "zoom-in",
          aspectRatio: "1/1",
          objectFit: "cover",
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
          border: "6px solid var(--white)",
          borderRadius: "var(--border-r-50)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--border-r-50)",
        }}
        width={"100%"}
        src={src}
        alt="el"
        loading="lazy"
      />
    </>
  );
};
