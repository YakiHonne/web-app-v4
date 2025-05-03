import React, {
  useEffect,
  useRef,
  useState,
  useReducer,
  Fragment,
} from "react";
import { useSelector } from "react-redux";
import Sidebar from "../../Components/Main/Sidebar";
import {
  getParsedNote,
  getParsedRepEvent,
  removeEventsDuplicants,
  sortEvents,
} from "../../Helpers/Encryptions";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import YakiIntro from "../../Components/YakiIntro";

import KindSix from "../../Components/Main/KindSix";
import { getFollowings, saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getSubData } from "../../Helpers/Controlers";
import Slider from "../../Components/Slider";
import SmallButtonDropDown from "../../Components/Main/SmallButtonDropDown";
import HomeCarouselContentSuggestions from "../../Components/Main/HomeCarouselContentSuggestions";
import { getHighlights, getTrending } from "../../Helpers/WSInstance";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import InterestSuggestionsCards from "../../Components/SuggestionsCards/InterestSuggestionsCards";
import InterestSuggestions from "../../Content/InterestSuggestions";

import {
  getCustomSettings,
  getDefaultSettings,
  getKeys,
  getLinkPreview,
  straightUp,
} from "../../Helpers/Helpers";
import LoadingLogo from "../../Components/LoadingLogo";
import KindOne from "../../Components/Main/KindOne";
import UserToFollowSuggestionsCards from "../../Components/SuggestionsCards/UserToFollowSuggestionsCards";
import ContentSuggestionsCards from "../../Components/SuggestionsCards/ContentSuggestionCards";
import DonationBoxSuggestionCards from "../../Components/SuggestionsCards/DonationBoxSuggestionCards";
import ProfileShareSuggestionCards from "../../Components/SuggestionsCards/ProfileShareSuggestionCards";
import PostAsNote from "../../Components/Main/PostAsNote";
import { useTranslation } from "react-i18next";
import bannedList from "../../Content/BannedList";
const SUGGESTED_TAGS_VALUE = "_sggtedtags_";

const getContentList = () => {
  let list = getCustomSettings();
  list = list.contentList
    .filter((item) => !item.isHidden)
    .map((item) => item.tab);
  if (list.length > 0) return list;
  else getDefaultSettings().contentList.map((item) => item.tab);
};

const notesReducer = (notes, action) => {
  switch (action.type) {
    case "highlights": {
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
    case "trending": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];

      nextState[action.type] = tempArr;
      return nextState;
    }
    case "widgets": {
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
    case "paid": {
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
    case "recent": {
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
    case "recent-with-replies": {
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
    case "tags": {
      let nextState = { ...notes };
      let tempArr = [...nextState["tags"], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState["tags"] = sortedNotes;
      return nextState;
    }

    case "empty-recent": {
      let nextState = { ...notes };
      nextState["recent"] = [];
      return nextState;
    }
    case "remove-events": {
      return notesInitialState;
    }
    default: {
      console.log("wrong action type");
    }
  }
};

const notesInitialState = {
  highlights: [],
  widgets: [],
  recent: [],
  "recent-with-replies": [],
  paid: [],
  trending: [],
  tags: [],
};

export default function Home() {
  const { t } = useTranslation();
  const [smallButtonDropDownOptions, setSmallButtonDropDownOptions] = useState(
    getContentList()
  );
  const userKeys = useSelector((state) => state.userKeys);
  const userInterestList = useSelector((state) => state.userInterestList);
  const [showWriteNote, setShowWriteNote] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    smallButtonDropDownOptions[0]
  );
  const [contentSuggestions, setContentSuggestions] = useState([]);
  const extrasRef = useRef(null);

  useEffect(() => {
    if (!extrasRef.current) return;

    const handleResize = () => {
      const extrasHeight = extrasRef.current?.getBoundingClientRect().height;
      const windowHeight = window.innerHeight;
      const topValue =
        extrasHeight >= windowHeight ? `calc(95vh - ${extrasHeight}px)` : 0;
      extrasRef.current.style.top = topValue;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(extrasRef.current);
    handleResize();
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let checkHiddenSuggestions = localStorage.getItem("hsuggest");
    const fetchContentSuggestions = async () => {
      let tags = InterestSuggestions.sort(() => 0.5 - Math.random()).slice(
        0,
        3
      );
      tags = tags.map((_) => [_.main_tag, ..._.sub_tags]).flat();
      let content = await getSubData(
        [{ kinds: [30023], limit: 20, "#t": tags }],
        400
      );
      if (content.data.length > 0) {
        let data = content.data
          .map((event) => getParsedRepEvent(event))
          .filter((event) => {
            if (event.title) return event;
          });
        setContentSuggestions(data);
        saveUsers(content.pubkeys);
      }
    };
    if (!checkHiddenSuggestions) fetchContentSuggestions();
  }, []);

  useEffect(() => {
    userInterestList.length > 0 &&
      setSelectedCategory(smallButtonDropDownOptions[0]);
  }, [userInterestList]);

  useEffect(() => {
    if (userKeys) {
      setSmallButtonDropDownOptions(getContentList());
    } else {
      setSmallButtonDropDownOptions([
        "trending",
        "highlights",
        "paid",
        "widgets",
      ]);
      setSelectedCategory("trending");
    }
  }, [userKeys]);

  return (
    <>
      <div style={{ overflow: "auto" }}>
        <Helmet>
          <title>Yakihonne | Home</title>
          <meta
            name="description"
            content={
              "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
            }
          />
          <meta
            property="og:description"
            content={
              "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
            }
          />
          <meta property="og:url" content={`https://yakihonne.com`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | Home" />
          <meta property="twitter:title" content="Yakihonne | Home" />
          <meta
            property="twitter:description"
            content={
              "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
            }
          />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <Sidebar />
            <main
              className="main-page-nostr-container"
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{ padding: 0 }}
            >
              <YakiIntro />
              <ArrowUp />
              <div className="fit-container fx-centered fx-start-h fx-start-v">
                <div
                  className="fit-container fx-centered fx-start-v fx-start-h"
                  style={{ gap: 0 }}
                >
                  <div
                    style={{ gap: 0 }}
                    className={`fx-centered  fx-wrap fit-container`}
                  >
                    <div
                      className="fit-container sticky fx-centered box-pad-h fx-col"
                      style={{
                        padding: "1rem",
                        borderBottom: "1px solid var(--very-dim-gray)",
                      }}
                    >
                      <div className="fit-container fx-scattered">
                        <Slider
                          smallButtonDropDown={
                            <SmallButtonDropDown
                              options={smallButtonDropDownOptions}
                              selectedCategory={selectedCategory}
                              setSelectedCategory={setSelectedCategory}
                              showSettings={userKeys}
                            />
                          }
                          items={[
                            userInterestList.length === 0 && userKeys && (
                              <div
                                className={
                                  "btn sticker-gray-black p-caps fx-centered"
                                }
                                style={{
                                  backgroundColor:
                                    selectedCategory === SUGGESTED_TAGS_VALUE
                                      ? ""
                                      : "transparent",
                                  color:
                                    selectedCategory === SUGGESTED_TAGS_VALUE
                                      ? ""
                                      : "var(--gray)",
                                }}
                                onClick={() =>
                                  setSelectedCategory(SUGGESTED_TAGS_VALUE)
                                }
                              >
                                {t("A7zJDS6")}{" "}
                                {selectedCategory === SUGGESTED_TAGS_VALUE && (
                                  <div className="plus-sign"></div>
                                )}
                              </div>
                            ),
                            ...userInterestList.map((tag, index) => {
                              return (
                                <div
                                  className={
                                    "btn sticker-gray-black p-caps fx-centered"
                                  }
                                  style={{
                                    backgroundColor:
                                      selectedCategory === tag
                                        ? ""
                                        : "transparent",
                                    color:
                                      selectedCategory === tag
                                        ? ""
                                        : "var(--gray)",
                                  }}
                                  key={index}
                                  onClick={() => setSelectedCategory(tag)}
                                >
                                  {tag}
                                </div>
                              );
                            }),
                          ]}
                          slideBy={100}
                          noGap={true}
                        />
                      </div>
                    </div>
                    <HomeCarouselContentSuggestions
                      content={contentSuggestions}
                    />
                    <div className="main-middle">
                      {userKeys && !showWriteNote && (
                        <div
                          className="fit-container fx-centered fx-start-h  box-pad-h-m box-pad-v-m pointer"
                          style={{
                            overflow: "visible",
                          }}
                          onClick={() => setShowWriteNote(true)}
                        >
                          <UserProfilePic size={40} mainAccountUser={true} />
                          <div className="sc-s-18 box-pad-h-s box-pad-v-s fit-container">
                            <p className="gray-c p-big">{t("AGAXMQ3")}</p>
                          </div>
                        </div>
                      )}

                      {userKeys && showWriteNote && (
                        <PostAsNote
                          content={""}
                          exit={() => setShowWriteNote(false)}
                        />
                        // <WriteNote
                        //   content={""}
                        //   border={false}
                        //   borderBottom={true}
                        //   exit={() => setShowWriteNote(false)}
                        // />
                      )}
                      {selectedCategory !== SUGGESTED_TAGS_VALUE && (
                        <HomeFeed
                          from={selectedCategory}
                          smallButtonDropDownOptions={
                            smallButtonDropDownOptions
                          }
                        />
                      )}
                      {selectedCategory === SUGGESTED_TAGS_VALUE && (
                        <InterestSuggestionsCards
                          list={[]}
                          update={true}
                          addItemToList={() => null}
                          expand={true}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const HomeFeed = ({ from, smallButtonDropDownOptions }) => {
  const userMutedList = useSelector((state) => state.userMutedList);
  const userInterestList = useSelector((state) => state.userInterestList);
  const userKeys = useSelector((state) => state.userKeys);
  const [userFollowings, setUserFollowings] = useState([]);
  const [notes, dispatchNotes] = useReducer(notesReducer, notesInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const [notesContentFrom, setNotesContentFrom] = useState(from);
  const [notesLastEventTime, setNotesLastEventTime] = useState(undefined);
  const [rerenderTimestamp, setRerenderTimestamp] = useState(undefined);
  const [articlesSuggestions, setArticlesSuggestions] = useState([]);
  const trendingLastScore = useRef(null);

  useEffect(() => {
    if (from !== notesContentFrom) {
      straightUp();
      dispatchNotes({ type: "remove-events" });
      setNotesContentFrom(from);
      setNotesLastEventTime(undefined);

      trendingLastScore.current = undefined;
    }
  }, [from]);

  useEffect(() => {
    straightUp();
    dispatchNotes({ type: "remove-events" });
    setNotesLastEventTime(undefined);
    setUserFollowings([]);
    if (notesLastEventTime === undefined) setRerenderTimestamp(Date.now());
  }, [userKeys]);

  const getNotesFilter = async () => {
    let filter;
    let tempUserFollowings = Array.from(userFollowings);
    if (["recent", "recent-with-replies"].includes(notesContentFrom)) {
      if (tempUserFollowings.length === 0) {
        let userKeys = getKeys();
        if (userKeys) {
          let followings = await getFollowings(userKeys.pub);
          tempUserFollowings =
            followings.followings.length > 0
              ? [userKeys.pub, ...Array.from(followings.followings)]
              : [userKeys.pub, process.env.REACT_APP_YAKI_PUBKEY];
          setUserFollowings(tempUserFollowings);
        } else {
          tempUserFollowings = [process.env.REACT_APP_YAKI_PUBKEY];
          setUserFollowings(tempUserFollowings);
        }
      }

      let authors = tempUserFollowings;
      filter = [
        { authors, kinds: [1, 6], limit: 50, until: notesLastEventTime },
      ];
      return {
        filter,
      };
    }
    if (notesContentFrom === "widgets") {
      filter = [
        {
          kinds: [1],
          "#l": ["smart-widget"],
          limit: 50,
          until: notesLastEventTime,
        },
      ];
      return {
        filter,
      };
    }
    if (notesContentFrom === "paid") {
      filter = [
        {
          kinds: [1],
          "#l": ["FLASH NEWS"],
          limit: 50,
          until: notesLastEventTime,
        },
      ];
      return {
        filter,
      };
    }
    if (!smallButtonDropDownOptions.includes(notesContentFrom)) {
      filter = [
        {
          kinds: [1],
          "#t": [notesContentFrom],
          limit: 50,
          until: notesLastEventTime,
        },
      ];
      return {
        filter,
      };
    }

    return {
      filter,
    };
  };

  const getTrendingNotes = async () => {
    try {
      setIsLoading(true);
      let notes_ = await getTrending(20, trendingLastScore.current);
      trendingLastScore.current = notes_.score;
      notes_ = removeEventsDuplicants(notes_.data);
      let pubkeys = [...new Set(notes_.map((event) => event.pubkey))];
      saveUsers(pubkeys);
      notes_ = await Promise.all(
        notes_.map(async (event) => await getParsedNote(event, true))
      );
      dispatchNotes({ type: "trending", note: notes_ });
      setIsLoading(false);
      if (notesContentFrom === "trending") setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  const getHighlightsNotes = async () => {
    try {
      setIsLoading(true);
      let notes_ = await getHighlights(30, notesLastEventTime);
      notes_ = sortEvents(removeEventsDuplicants(notes_));
      let pubkeys = [...new Set(notes_.map((event) => event.pubkey))];
      saveUsers(pubkeys);
      notes_ = await Promise.all(
        notes_.map(async (event) => await getParsedNote(event, true))
      );
      dispatchNotes({ type: "highlights", note: notes_ });
      setIsLoading(false);
      if (notesContentFrom === "highlights") setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      let container = document.querySelector(".main-page-nostr-container");
      if (!container && isLoading) return;
      if (
        container.scrollHeight - container.scrollTop - 400 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      let notesContentFrom_ = smallButtonDropDownOptions.includes(from)
        ? from
        : "tags";

      if (notesContentFrom !== "trending") {
        setNotesLastEventTime(
          notes[notesContentFrom_][notes[notesContentFrom_].length - 1]
            ?.created_at || undefined
        );
      } else setNotesLastEventTime(trendingLastScore.current);
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading, from]);

  useEffect(() => {
    if (notesContentFrom === "trending") {
      getTrendingNotes();
      return;
    }
    if (notesContentFrom === "highlights") {
      getHighlightsNotes();
      return;
    }
    if (!(Array.isArray(userFollowings) && notesContentFrom !== "trending"))
      return;

    const fetchData = async () => {
      setIsLoading(true);
      let eventsPubkeys = [];
      let events = [];
      let fallBackEvents = [];
      let { filter } = await getNotesFilter();
      let dateChecker = notesLastEventTime
        ? notesLastEventTime - 86400
        : Math.floor(Date.now() / 1000) - 86400;
      let subscription = ndkInstance.subscribe(filter, {
        groupable: false,
        skipValidation: true,
        skipVerification: true,
        cacheUsage: "CACHE_FIRST",
        subId: "home-feed",
      });

      subscription.on("event", async (event) => {
        console.log(event.rawEvent())
        eventsPubkeys.push(event.pubkey);
        let event_ = await getParsedNote(event, true);
        if (event_) fallBackEvents.push(event_);
        if (event_ && event.created_at > dateChecker) {
          if (notesContentFrom !== "recent-with-replies") {
            if (!event_.isComment) {
              if (event.kind === 6) {
                eventsPubkeys.push(event_.relatedEvent.pubkey);
              }
              events.push(event_);
            }
          } else {
            if (event.kind === 6) {
              eventsPubkeys.push(event_.relatedEvent.pubkey);
            }
            events.push(event_);
          }
        }
      });

      subscription.on("close", () => {
        let tempEvents =
          events.length > 0 ? Array.from(events) : Array.from(fallBackEvents);
          tempEvents = removeEventsDuplicants(tempEvents)
        // events = [];
        // fallBackEvents = [];
        if (smallButtonDropDownOptions.includes(notesContentFrom))
          dispatchNotes({ type: notesContentFrom, note: tempEvents });
        else dispatchNotes({ type: "tags", note: tempEvents });
        saveUsers(eventsPubkeys);
        setIsLoading(false);
      });

      let timer = setTimeout(() => {
        subscription.stop();
        clearTimeout(timer);
      }, 1000);
    };

    fetchData();
  }, [notesLastEventTime, notesContentFrom, rerenderTimestamp]);

  useEffect(() => {
    let checkHiddenSuggestions = localStorage.getItem("hsuggest2");
    const fetchContentSuggestions = async () => {
      let tags = InterestSuggestions.sort(() => 0.5 - Math.random()).slice(
        0,
        3
      );
      tags = tags.map((_) => [_.main_tag, ..._.sub_tags]).flat();

      let content = await getSubData(
        [
          {
            kinds: [30023],
            limit: 10,
            "#t": !smallButtonDropDownOptions.includes(from) ? [from] : tags,
          },
        ],
        200
      );
      if (content.data.length > 0) {
        let data = content.data
          .map((event) => getParsedRepEvent(event))
          .filter((event) => {
            if (event.title && event.image) return event;
          });
        if (data.length >= 3) {
          setArticlesSuggestions(data.slice(0, 5));
          saveUsers(content.pubkeys);
        }
      }
    };
    if (!checkHiddenSuggestions) fetchContentSuggestions();
  }, [from]);

  const getContentCard = (index) => {
    if (index === 10)
      return (
        <ContentSuggestionsCards
          tag={!smallButtonDropDownOptions.includes(from) ? from : false}
          content={articlesSuggestions}
          kind="articles"
        />
      );
    if (index === 20) return <UserToFollowSuggestionsCards />;
    if (index === 30)
      return (
        <InterestSuggestionsCards
          limit={5}
          list={userInterestList}
          update={true}
          expand={true}
        />
      );
    if (index === 40) return <DonationBoxSuggestionCards />;
    if (index === 50) return <ProfileShareSuggestionCards />;
  };

  return (
    <div className="fx-centered  fx-wrap fit-container" style={{ gap: 0 }}>
      {notes[smallButtonDropDownOptions.includes(from) ? from : "tags"].map(
        (note, index) => {
          if (![...userMutedList, ...bannedList].includes(note.pubkey)) {
            if (
              note.kind === 6 &&
              ![...userMutedList, ...bannedList].includes(
                note.relatedEvent.pubkey
              )
            )
              return (
                <Fragment key={note.id}>
                  <KindSix event={note} />
                  {getContentCard(index)}
                </Fragment>
              );
            if (note.kind !== 6)
              return (
                <Fragment key={note.id}>
                  <KindOne event={note} border={true} />
                  {getContentCard(index)}
                </Fragment>
              );
          }
        }
      )}

      <div className="box-pad-v"></div>
      {isLoading && (
        <div
          className="fit-container box-pad-v fx-centered fx-col"
          style={{ height: "60vh" }}
        >
          <LoadingLogo size={64} />
        </div>
      )}
    </div>
  );
};
