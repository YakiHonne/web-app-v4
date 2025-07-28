import React, { useState, useEffect, useMemo, useRef, useReducer } from "react";
import {
  checkForLUDS,
  getBech32,
  getEmptyuserMetadata,
  getParsedAuthor,
  getParsedNote,
  getParsedRepEvent,
  getParsedSW,
  getuserMetadata,
  shortenKey,
} from "../../Helpers/Encryptions";
import { useLocation, useParams } from "react-router-dom";
import Sidebar from "../../Components/Main/Sidebar";
import { nip19 } from "nostr-tools";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import ZapTip from "../../Components/Main/ZapTip";
import Follow from "../../Components/Main/Follow";
import ShowPeople from "../../Components/Main/ShowPeople";
import Helmet from "react-helmet";
import axios from "axios";
import NumberShrink from "../../Components/NumberShrink";
import ArrowUp from "../../Components/ArrowUp";
import {
  getAuthPubkeyFromNip05,
  getNoteTree,
  straightUp,
} from "../../Helpers/Helpers";
import LoadingDots from "../../Components/LoadingDots";
import ShareLink from "../../Components/ShareLink";
import InitiConvo from "../../Components/Main/InitConvo";
import KindOne from "../../Components/Main/KindOne";
import KindSix from "../../Components/Main/KindSix";
import Avatar from "boring-avatars";
import { useDispatch, useSelector } from "react-redux";
import { setFollowersCountSL } from "../../Store/Slides/Extras";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { saveFetchedUsers, saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getSubData, getUser } from "../../Helpers/Controlers";
import { NDKUser } from "@nostr-dev-kit/ndk";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import { getUserFollowers, getUserStats } from "../../Helpers/WSInstance";
import { customHistory } from "../../Helpers/History";
import LoadingLogo from "../../Components/LoadingLogo";
import QRSharing from "./QRSharing";
import WidgetCard from "../../Components/Main/WidgetCardV2";
import { useTranslation } from "react-i18next";
import Carousel from "../../Components/Main/Carousel";
import PagePlaceholder from "../../Components/PagePlaceholder";
import bannedList from "../../Content/BannedList";
import NotesFromPeopleYouFollow from "../../Components/Main/NotesFromPeopleYouFollow";
import UserFollowers from "./UserFollowers";
import WidgetCardV2 from "../../Components/Main/WidgetCardV2";
import useUserProfile from "../../Hooks/useUsersProfile";

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
    case "replies": {
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
    case "smart-widget": {
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
  replies: [],
  articles: [],
  flashnews: [],
  curations: [],
  videos: [],
  "smart-widget": [],
};

const decodeURL = (url) => {
  try {
    let pubkey = nip19.decode(url);
    if (pubkey) return pubkey.data.pubkey || pubkey.data;
    return false;
  } catch (err) {
    return false;
  }
};

export default function User() {
  const { user_id } = useParams();
  const [id, setID] = useState(false);
  const [user, setUser] = useState({});

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
        {/* <div className="fit-container fx-centered">
          <div className="main-container">
            <Sidebar />
            <main className="main-page-nostr-container"> */}
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
                  <UserMetadata refreshUser={setUser} />
                  <div
                    className="it-container fx-centered fx-col"
                    style={{ position: "relative" }}
                  >
                    <UserFeed pubkey={id} user={user} />
                  </div>
                </div>
              </div>
            {/* </main>
          </div>
        </div> */}
      </div>
    </>
  );
}

const UserMetadata = ({ refreshUser }) => {
  const { user_id } = useParams();
  const dispatch = useDispatch();
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const userMutedList = useSelector((state) => state.userMutedList);
  const isPublishing = useSelector((state) => state.isPublishing);

  const { t } = useTranslation();
  const [user, setUser] = useState({});
  const [showPeople, setShowPeople] = useState(false);
  const [showWritingImpact, setShowWritingImpact] = useState(false);
  const [showRatingImpact, setShowRatingImpact] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  const [id, setID] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const [following, setFollowings] = useState([]);
  const [userStats, setUserStats] = useState({ followings: 0, followers: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [userImpact, setUserImpact] = useState(false);
  const [showUserImpact, setShowUserImpact] = useState(false);
  const [initConv, setInitConv] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showMetadataCarousel, setShowMetadataCarousel] = useState(false);
  const [selectedItemInCarousel, setSelectedItemInCarousel] = useState(0);

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
        customHistory.push("/");
      }
    };
    if (id) {
      dataFetching();
    }
  }, [id, timestamp]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const USER_IMPACT = await axios.get(
  //         API_BASE_URL + "/api/v1/user-impact",
  //         {
  //           params: { pubkey: id },
  //         }
  //       );

  //       setUserImpact(USER_IMPACT.data);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   if (id) fetchData();
  // }, [id]);

  useEffect(() => {
    const getID = async () => {
      try {
        if (user_id?.includes("@")) {
          let pubkey = await getAuthPubkeyFromNip05(user_id);
          setID(pubkey);
          return;
        }
        let id = user_id.replaceAll(",", "").replaceAll(":", "");
        let pubkey = nip19.decode(id);
        setID(pubkey.data.pubkey || pubkey.data);
        setIsNip05Verified(false);
      } catch (err) {
        console.log(err);
      }
    };

    getID();
    setShowPeople(false);
  }, [user_id]);

  const getMetadata = async () => {
    try {
      setFollowings([]);
      if (bannedList.includes(id)) customHistory.push("/");
      let cachedUser = getUser(id);
      if (cachedUser) {
        setUser(cachedUser);
        refreshUser(cachedUser);
        setIsLoaded(true);
      }
      let stats = await getUserStats(id);
      if (stats) {
        let userProfile = stats.find((_) => _.kind === 0);
        let userStats_ = stats.find((_) => _.kind === 10000105);
        userStats_ = userStats_ ? JSON.parse(userStats_.content) : false;
        let parsedProfile = userProfile
          ? getuserMetadata(userProfile)
          : getEmptyuserMetadata(id);
        setUser(parsedProfile);
        refreshUser(parsedProfile);
        saveFetchedUsers([parsedProfile]);
        if (userStats_)
          setUserStats({
            followings: userStats_.follows_count,
            followers: userStats_.followers_count,
          });

        if (userStats_.followers_count === 0) {
          try {
            let fCount = await axios.get(
              "https://api.nostr.band/v0/stats/profile/" + id
            );
            fCount = fCount.data.stats[id].followers_pubkey_count;
            setUserStats({
              followings: userStats_.follows_count,
              followers: fCount,
            });
            dispatch(setFollowersCountSL(fCount));
          } catch (err) {
            dispatch(setFollowersCountSL(0));
          }
        } else dispatch(setFollowersCountSL(userStats_.followers_count));
        setIsLoaded(true);
      }
      let p = new NDKUser({ pubkey: id });
      p.ndk = ndkInstance;
      if (!stats) {
        let profile = await p.fetchProfile();

        if (profile) {
          let parsedProfile = getParsedAuthor(JSON.parse(profile.profileEvent));
          setUser(parsedProfile);
          refreshUser(parsedProfile);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          let ndkUser = new NDKUser({ pubkey: user.pubkey });
          ndkUser.ndk = ndkInstance;
          let checknip05 = user.nip05
            ? await ndkUser.validateNip05(user.nip05)
            : false;
          if (checknip05) setIsNip05Verified(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [user]);

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(userMutedList)) return;
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
        desc: `${t("AzSXXQm")} 👏`,
      })
    );
  };

  const handleInitConvo = () => {
    if (userKeys && (userKeys.sec || userKeys.ext)) {
      setInitConv(true);
    }
  };

  const handleCarouselItems = (index) => {
    if (!isLoaded) return;
    let temArray = [];
    if (user.banner) temArray.push(user.banner);
    if (user.picture) temArray.push(user.picture);

    if (index === 1 && temArray.length < 2) {
      setSelectedItemInCarousel(0);
      setShowMetadataCarousel(temArray);
      return;
    }
    setShowMetadataCarousel(temArray);
    setSelectedItemInCarousel(index);
  };

  if (isMuted)
    return <PagePlaceholder page={"muted-user"} onClick={muteUnmute} />;
  return (
    <>
      {showPeople === "following" && (
        <ShowPeople
          exit={() => setShowPeople(false)}
          list={following}
          type={showPeople}
        />
      )}

      {initConv && <InitiConvo exit={() => setInitConv(false)} receiver={id} />}
      {showQR && (
        <QRSharing
          user={user}
          exit={() => setShowQR(false)}
          isVerified={isNip05Verified}
        />
      )}
      {showMetadataCarousel && (
        <Carousel
          selectedImage={selectedItemInCarousel}
          imgs={showMetadataCarousel}
          back={() => {
            setSelectedItemInCarousel(0);
            setShowMetadataCarousel(false);
          }}
        />
      )}
      <div className="fit-container">
        <div
          className="fit-container fx-centered fx-start-h fx-end-v fx-start-v box-pad-h-s box-pad-v-s bg-img cover-bg"
          style={{
            position: "relative",
            height: user?.banner ? "250px" : "150px",
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
              cursor: user?.banner ? "zoom-in" : "default",
            }}
            onClick={() => handleCarouselItems(0)}
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
                <UserPP
                  size={128}
                  src={user?.picture}
                  user_id={user?.pubkey}
                  setSelectedItemInCarousel={handleCarouselItems}
                />
                <div className="fit-container fx-scattered fx-end-h box-marg-s">
                  <div className="fx-centered">
                    <div>
                      {user.pubkey !== userKeys.pub && (
                        <Follow
                          toFollowKey={user?.pubkey}
                          toFollowName={user?.name}
                          setTimestamp={setTimestamp}
                          bulkList={[]}
                          icon={false}
                        />
                      )}
                    </div>
                    {user.pubkey === userKeys.pub && (
                      <button
                        className="btn btn-gray"
                        onClick={() => customHistory.push("/settings/profile")}
                      >
                        {t("AfxwB6z")}
                      </button>
                    )}
                    {user.pubkey !== userKeys.pub && (
                      <div className="fx-centered">
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
                          setReceivedEvent={() => null}
                        />
                        <div
                          className={`round-icon round-icon-tooltip ${
                            !userKeys || userKeys.bunker ? "if-disabled" : ""
                          }`}
                          data-tooltip={
                            userKeys && (userKeys.sec || userKeys.ext)
                              ? t("AEby39n", { name: user?.name || "" })
                              : t("AlNe9hu")
                          }
                          style={{
                            cursor:
                              userKeys && (userKeys.sec || userKeys.ext)
                                ? "pointer"
                                : "not-allowed",
                          }}
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
                          <p className="fx-centered">{t("AHrJpSX")}</p>
                        </div>,
                        // <div
                        //   className="fit-container fx-centered fx-start-h pointer"
                        //   onClick={() => setShowUserImpact(true)}
                        // >
                        //   <p className="fx-centered">{t("AP8YaBk")}</p>
                        // </div>,
                        <div className="fit-container fx-centered fx-start-h pointer">
                          <ShareLink
                            label={t("AawXy2A")}
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
                              {isMuted && t("AKELUbQ")}
                              {!isMuted && t("AGMxuQ0")}
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
            {isLoaded && (
              <div className="fx-centered" style={{ gap: "6px" }}>
                <h3 className="p-caps">{user?.display_name || user?.name}</h3>
                {isNip05Verified && <div className="checkmark-c1-24"></div>}
                <div
                  className="fx-centered pointer"
                  onClick={() => setShowQR(true)}
                >
                  <div>
                    <div className="qrcode"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="fx-centered">
              <div className="fx-centered">
                <div className="nip05-24"></div>{" "}
                {user?.nip05 && (
                  <p className="p-one-line" style={{ minWidth: "max-content" }}>
                    {user?.nip05?.length < 50
                      ? user?.nip05
                      : shortenKey(user?.nip05, 15)}
                  </p>
                )}
                {!user?.nip05 && <p>N/A</p>}
              </div>

              {user?.website && (
                <div className="fx-centered fx-start-h">
                  <div className="link-24"></div>

                  <a
                    href={
                      user?.website.toLowerCase().includes("http")
                        ? user?.website
                        : `https://${user?.website}`
                    }
                    target="_blank"
                    className="p-one-line"
                    style={{ textDecoration: user?.website ? "underline" : "" }}
                  >
                    {user?.website || "N/A"}
                  </a>
                </div>
              )}
            </div>
            <div
              className="fx-centered fx-start-v "
              style={{ columnGap: "24px" }}
            >
              <div className="box-pad-v-s fx-centered fx-start-v fx-col">
                {user?.about && (
                  <div>{getNoteTree(user?.about)}</div>
                  // <p className="p-centered  p-left">{user?.about}</p>
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
                        <span className="gray-c">{t("A9TqNxQ")}</span>
                      </p>
                    </div>
                    <UserFollowers
                      id={id}
                      followersCount={userStats.followers}
                    />
                    {userKeys && following.includes(userKeys?.pub) && (
                      <div className="sticker sticker-gray-black">
                        {t("AjfORVL")}
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
  const { state } = useLocation();
  const { user_id } = useParams();
  const [pubkey, setPubkey] = useState(decodeURL(user_id));

  const { t } = useTranslation();
  const [events, dispatchEvents] = useReducer(
    eventsReducer,
    eventsInitialState
  );
  const [isLoading, setIsLoading] = useState(true);
  const [contentFrom, setContentFrom] = useState(
    state ? state.contentType : "notes"
  );
  const [lastEventTime, setLastEventTime] = useState(undefined);
  const [notesSub, setNotesSub] = useState(false);
  const userMutedList = useSelector((state) => state.userMutedList);

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
    const getID = async () => {
      try {
        if (user_id?.includes("@")) {
          let pubkey = await getAuthPubkeyFromNip05(user_id);
          setPubkey(pubkey);
          setLastEventTime(undefined);
          setContentFrom("notes");
          return;
        }
        let pubkey = nip19.decode(user_id);
        setPubkey(pubkey.data.pubkey || pubkey.data);
        setLastEventTime(undefined);
        setContentFrom("notes");
      } catch (err) {
        console.log(err);
      }
    };
    getID();
    straightUp();
    setIsLoading(true);
    dispatchEvents({ type: "remove-events" });
  }, [user_id]);

  const getNotesFilter = () => {
    let kinds = {
      notes: [1, 6],
      replies: [1],
      flashnews: [1],
      articles: [30023],
      videos: [34235, 34236],
      curations: [30004],
      "smart-widget": [30033],
    };
    return [
      {
        kinds: kinds[contentFrom],
        authors: [pubkey],
        limit: 50,
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
          document.documentElement.offsetHeight &&
        events[contentFrom].length > 4
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
    const fetchData = async () => {
      try {
        let filter = getNotesFilter();
        const res = await getSubData(filter, 200);
        let data = res.data.slice(0, 100);
        let pubkeys = res.pubkeys;
        let ev = [];
        if (data.length > 0) {
          ev = data.map((event) => {
            if ([1, 6].includes(event.kind)) {
              let event_ = getParsedNote(event, true);
              if (event_) {
                if (
                  contentFrom === "replies" &&
                  event_.isComment &&
                  event_.isQuote === ""
                ) {
                  return event_;
                } else if (contentFrom === "notes" && !event_.isComment) {
                  if (event.kind === 6) {
                    pubkeys.push(event_.relatedEvent.pubkey);
                  }
                  return event_;
                }
              }
            }
            if ([30023, 30004].includes(event.kind)) {
              let event_ = getParsedRepEvent(event);
              return event_;
            }
            if ([30033].includes(event.kind) && event.id) {
              let event_ = getParsedSW(event);
              try {
                return {
                  ...event_,
                  metadata: event_,
                  author: getEmptyuserMetadata(event.pubkey),
                };
              } catch (err) {
                console.log(err);
              }
            }
            if ([34235, 34236].includes(event.kind)) {
              let event_ = getParsedRepEvent(event);
              return event_;
            }
          });
          ev = ev.filter((_) => _);
          if (ev.length > 0) {
            saveUsers(pubkeys);
          }
          dispatchEvents({ type: contentFrom, note: ev });
        }
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (!pubkey) return;
    setIsLoading(true);
    fetchData();
    // subscription.on("event", async (event) => {});

    // subscription.on("close", () => {
    //   dispatchEvents({ type: contentFrom, note: events_ });
    //   saveUsers(eventsPubkeys);
    //   setIsLoading(false);
    // });

    // setNotesSub(subscription);

    // let timer = setTimeout(() => subscription.stop(), 2000);

    // return () => {
    //   if (subscription) subscription.stop();
    //   clearTimeout(timer);
    // };
  }, [lastEventTime, contentFrom, pubkey]);

  const switchContentType = (type) => {
    if (notesSub) notesSub.stop();
    straightUp();
    setIsLoading(true);
    dispatchEvents({ type: "remove-events" });
    setLastEventTime(undefined);
    setContentFrom(type);
  };

  if (isMuted) return;
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
          {t("AYIXG83")}
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "replies" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("replies")}
        >
          {t("AENEcn9")}
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "articles" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("articles")}
        >
          {t("AesMg52")}
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "smart-widget" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("smart-widget")}
        >
          {t("A2mdxcf")}
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "curations" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("curations")}
        >
          {t("AVysZ1s")}
        </div>
        <div
          className={`list-item-b fx-centered fx-shrink ${
            contentFrom === "videos" ? "selected-list-item-b" : ""
          }`}
          onClick={() => switchContentType("videos")}
        >
          {t("AStkKfQ")}
        </div>
      </div>
      {/* <NotesFromPeopleYouFollow /> */}
      {["notes", "replies"].includes(contentFrom) && (
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
              <h4>{t("Aezm5AZ")}</h4>
              <p className="gray-c">{t("AmK41uU", { name: user?.name })}</p>
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
              <h4>{t("Aezm5AZ")}</h4>
              <p className="gray-c">{t("A8pbTGs", { name: user?.name })}</p>
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
              <h4>{t("AUBYIOq")}</h4>
              <p className="gray-c">{t("AkqCrW5", { name: user?.name })}</p>
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
              <h4>{t("A3QrgxE")}</h4>
              <p className="gray-c">{t("A70xEba", { name: user?.name })}</p>
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
      {contentFrom === "smart-widget" && (
        <div className="fit-container fx-centered fx-col">
          {events[contentFrom].length === 0 && !isLoading && (
            <div
              className="fx-centered fx-col box-pad-v"
              style={{ height: "30vh" }}
            >
              <h4>{t("Aezm5AZ")}</h4>
              <p className="gray-c">{t("A1MlrcU", { name: user?.name })}</p>
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
                className="fx-around fx-wrap box-pad-v-s"
              >
                {events[contentFrom].map((widget) => {
                  return (
                    <div key={widget.id} className="fx-centered fit-container">
                      <WidgetCardV2
                        widget={widget}
                        key={widget.id}
                        deleteWidget={() => null}
                      />
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
          style={{ height: "40vh" }}
        >
          <LoadingLogo />
        </div>
      )}
    </div>
  );
};

const UserPP = ({ src, size, user_id, setSelectedItemInCarousel }) => {
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
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
        }}
        className="settings-profile-pic"
      >
        <Avatar
          size={size}
          name={user_id}
          variant="marble"
          square
          colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
        />
      </div>
    );
  }
  return (
    <img
      onClick={(e) => {
        e.stopPropagation();
        setSelectedItemInCarousel(1);
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
  );
};
