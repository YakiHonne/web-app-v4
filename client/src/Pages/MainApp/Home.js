import React, { useEffect, useRef, useState, lazy, useReducer } from "react";
import { useSelector } from "react-redux";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import {
  getParsedNote,
  getParsedRepEvent,
  removeEventsDuplicants,
  sortEvents,
} from "../../Helpers/Encryptions";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import YakiIntro from "../../Components/YakiIntro";
import Footer from "../../Components/Footer";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import KindSix from "../../Components/Main/KindSix";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import TrendingUsers from "../../Components/Main/TrendingUsers";
import RecentTags from "../../Components/Main/RecentTags";
import { getSubData } from "../../Helpers/Controlers";
import Slider from "../../Components/Slider";
import SmallButtonDropDown from "../../Components/Main/SmallButtonDropDown";
import HomeCarouselContentSuggestions from "../../Components/Main/HomeCarouselContentSuggestions";
import { getHighlights, getTrending } from "../../Helpers/WSInstance";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import PostAsNote from "../../Components/Main/PostAsNote";
import InterestSuggestionsCards from "../../Components/SuggestionsCards/InterestSuggestionsCards";
import InterestSuggestions from "../../Content/InterestSuggestions";
import WriteNote from "../../Components/Main/WriteNote";
const KindOne = lazy(() => import("../../Components/Main/KindOne"));

const SUGGESTED_TAGS_VALUE = "_sggtedtags_";
const homeOptions = [
  {
    value: "universal",
    display_name: "Universal",
  },
  {
    value: "smart-widget",
    display_name: "Notes with Widgets",
  },
  {
    value: "trending",
    display_name: "Trending notes",
  },
  {
    value: "followings",
    display_name: "Followings",
  },
];

const smallButtonDropDownOptions = [
  "highlights",
  "trending",
  "paid",
  "followings",
  "widgets",
];

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

      // let nextState = { ...notes };
      // let existed = nextState[action.type].find(
      //   (note) => note.id === action.note.id
      // );
      // if (existed) return nextState;
      // else
      //   nextState[action.type] = [...nextState[action.type], action.note].sort(
      //     (note_1, note_2) => note_2.created_at - note_1.created_at
      //   );
      // return nextState;
    }
    case "trending": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];

      nextState[action.type] = tempArr;
      return nextState;

      // let nextState = { ...notes };
      // let existed = nextState[action.type].find(
      //   (note) => note.id === action.note.id
      // );
      // if (existed) return nextState;
      // else
      //   nextState[action.type] = [...nextState[action.type], action.note].sort(
      //     (note_1, note_2) => note_2.created_at - note_1.created_at
      //   );
      // return nextState;
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

      // let nextState = { ...notes };
      // let existed = nextState[action.type].find(
      //   (note) => note.id === action.note.id
      // );
      // if (existed) return nextState;
      // else
      //   nextState[action.type] = [...nextState[action.type], action.note].sort(
      //     (note_1, note_2) => note_2.created_at - note_1.created_at
      //   );
      // return nextState;
    }
    case "paid": {
      // let nextState = { ...notes };
      // let existed = nextState[action.type].find(
      //   (note) => note.id === action.note.id
      // );
      // if (existed) return nextState;
      // else
      //   nextState[action.type] = [...nextState[action.type], action.note].sort(
      //     (note_1, note_2) => note_2.created_at - note_1.created_at
      //   );
      // return nextState;

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
    case "followings": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;

      // let nextState = { ...notes };
      // let existed = nextState[action.type].find(
      //   (note) => note.id === action.note.id
      // );
      // if (existed) return nextState;
      // else
      //   nextState[action.type] = [...nextState[action.type], action.note].sort(
      //     (note_1, note_2) => note_2.created_at - note_1.created_at
      //   );
      // return nextState;
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

    case "empty-followings": {
      let nextState = { ...notes };
      nextState["followings"] = [];
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
  followings: [],
  paid: [],
  trending: [],
  tags: [],
};

export default function Home() {
  const userKeys = useSelector((state) => state.userKeys);
  const userInterestList = useSelector((state) => state.userInterestList);
  const [showWriteNote, setShowWriteNote] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("highlights");
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
    const fetchContentSuggestions = async () => {
      let tags = InterestSuggestions.sort(() => 0.5 - Math.random()).slice(
        0,
        3
      );
      tags = tags.map((_) => [_.main_tag, ..._.sub_tags]).flat();

      let content = await getSubData(
        [{ kinds: [30023], limit: 10, "#t": tags }],
        200
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
    fetchContentSuggestions();
  }, []);

  useEffect(() => {
    userInterestList.length > 0 && setSelectedCategory("highlights");
  }, [userInterestList]);

  return (
    <>
      {/* {showWriteNote && <PostAsNote exit={() => setShowWriteNote(false)} />} */}
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
            <SidebarNOSTR />
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
                            />
                          }
                          items={[
                            userInterestList.length === 0 && (
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
                                Suggested interets{" "}
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
                            // border: "1px solid var(--very-dim-gray)",
                          }}
                          onClick={() => setShowWriteNote(true)}
                        >
                          <UserProfilePicNOSTR
                            size={40}
                            mainAccountUser={true}
                            allowClick={false}
                            ring={false}
                          />
                          <div className="sc-s-18 box-pad-h-s box-pad-v-s fit-container">
                            <p className="gray-c p-big">
                              {" "}
                              What's on your mind?
                            </p>
                          </div>
                        </div>
                      )}
                      {userKeys && showWriteNote && <WriteNote content={""} exit={() => setShowWriteNote(false)}/>}
                      {selectedCategory !== SUGGESTED_TAGS_VALUE && (
                        <HomeFeed from={selectedCategory} />
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
                  {/* <div
                    className=" fx-centered fx-col fx-start-v extras-homepage"
                    style={{
                      position: "sticky",
                      zIndex: "100",
                      flex: 1,
                    }}
                    ref={extrasRef}
                  >
                    <div className="sticky fit-container">
                      <SearchbarNOSTR />
                    </div>
                    <ImportantFlashNews />
                    <TrendingUsers />
                    <RecentTags />
                    <Footer />
                  </div> */}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const HomeFeed = ({ from }) => {
  const userFollowings = useSelector((state) => state.userFollowings);
  const [notes, dispatchNotes] = useReducer(notesReducer, notesInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const [notesContentFrom, setNotesContentFrom] = useState(from);
  const [notesLastEventTime, setNotesLastEventTime] = useState(undefined);
  const [notesSub, setNotesSub] = useState(false);
  const trendingLastScore = useRef(null);

  useEffect(() => {
    if (from !== notesContentFrom) {
      const straightUp = () => {
        let el = document.querySelector(".main-page-nostr-container");
        if (!el) return;
        el.scrollTop = 0;
      };
      if (notesSub) notesSub.stop();
      straightUp();
      dispatchNotes({ type: "remove-events" });
      setNotesLastEventTime(undefined);
      setNotesContentFrom(from);
      trendingLastScore.current = undefined;
    }
  }, [from]);

  const getNotesFilter = () => {
    let filter;
    if (notesContentFrom === "followings") {
      let authors =
        userFollowings.length > 0
          ? Array.from(userFollowings)
          : [process.env.REACT_APP_YAKI_PUBKEY];
      filter = [
        { authors, kinds: [1, 6], limit: 20, until: notesLastEventTime },
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
          limit: 20,
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
          limit: 20,
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
          limit: 20,
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
        notes_.map(async (event) => await getParsedNote(event))
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
        notes_.map(async (event) => await getParsedNote(event))
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

      if (!container) return;
      if (
        container.scrollHeight - container.scrollTop - 400 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      let notesContentFrom_ = smallButtonDropDownOptions.includes(
        notesContentFrom
      )
        ? notesContentFrom
        : "tags";

      if (notesContentFrom !== "trending")
        setNotesLastEventTime(
          notes[notesContentFrom_][notes[notesContentFrom_].length - 1]
            ?.created_at || undefined
        );
      else setNotesLastEventTime(trendingLastScore.current);
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
    setIsLoading(true);
    let eventsPubkeys = [];
    let events = [];
    let { filter } = getNotesFilter();
    let subscription = ndkInstance.subscribe(filter, {
      groupable: false,
      skipValidation: true,
      skipVerification: true,
      cacheUsage: "CACHE_FIRST",
      subId: "home-feed",
    });

    subscription.on("event", async (event) => {
      eventsPubkeys.push(event.pubkey);
      let event_ = await getParsedNote(event);
      if (event_ && !event_.isComment) {
        if (event.kind === 6) {
          eventsPubkeys.push(event_.relatedEvent.pubkey);
        }
        events.push(event_);
      }
    });

    subscription.on("close", () => {
      if (smallButtonDropDownOptions.includes(notesContentFrom))
        dispatchNotes({ type: notesContentFrom, note: events });
      else dispatchNotes({ type: "tags", note: events });
      saveUsers(eventsPubkeys);
      setIsLoading(false);
    });

    let timer = setTimeout(() => subscription.stop(), 1000);

    return () => {
      if (subscription) subscription.stop();
      clearTimeout(timer);
    };
  }, [notesLastEventTime, notesContentFrom]);

  useEffect(() => {
    dispatchNotes({ type: "empty-followings" });
    setNotesLastEventTime(undefined);
  }, [userFollowings]);

  return (
    <div className="fx-centered  fx-wrap fit-container" style={{ gap: 0 }}>
      {notes[smallButtonDropDownOptions.includes(from) ? from : "tags"].map(
        (note) => {
          if (note.kind === 6)
            return <KindSix event={note} key={note.id} border={true} />;
          return <KindOne event={note} key={note.id} border={true} />;
        }
      )}

      <div className="box-pad-v"></div>
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
