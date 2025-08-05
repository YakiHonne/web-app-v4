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
  filterContent,
  getBackupWOTList,
  getParsedNote,
  getParsedRepEvent,
  removeEventsDuplicants,
} from "../../Helpers/Encryptions";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import YakiIntro from "../../Components/YakiIntro";
import KindSix from "../../Components/Main/KindSix";
import { getFollowings, saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import {
  getDefaultFilter,
  getDVMJobRequest,
  getDVMJobResponse,
  getSubData,
} from "../../Helpers/Controlers";
import HomeCarouselContentSuggestions from "../../Components/Main/HomeCarouselContentSuggestions";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import InterestSuggestionsCards from "../../Components/SuggestionsCards/InterestSuggestionsCards";

import {
  getCustomSettings,
  getDefaultSettings,
  getKeys,
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
import ContentSource from "../../Components/ContentSettings/ContentSource";
import ContentFilter from "../../Components/ContentSettings/ContentFilter";

const SUGGESTED_TAGS_VALUE = "_sggtedtags_";

const getContentFromValue = (contentSource) => {
  if (contentSource.group === "cf") return contentSource.value;
  if (contentSource.group === "mf") return "dvms";
  if (contentSource.group === "af") return "algo";
};

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
    case "global": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (
            tempArr.findIndex(
              (_) =>
                _.id === note.id ||
                (note.kind === 6 &&
                  (note.relatedEvent.id === _.id ||
                    note.relatedEvent.id === _.relatedEvent?.id)) ||
                (_.kind === 6 &&
                  (_.relatedEvent.id === note.id ||
                    _.relatedEvent.id === note.relatedEvent?.id))
            ) === index
          )
            return note;
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
          if (
            tempArr.findIndex(
              (_) =>
                _.id === note.id ||
                (note.kind === 6 &&
                  (note.relatedEvent.id === _.id ||
                    note.relatedEvent.id === _.relatedEvent?.id)) ||
                (_.kind === 6 &&
                  (_.relatedEvent.id === note.id ||
                    _.relatedEvent.id === note.relatedEvent?.id))
            ) === index
          )
            return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "recent_with_replies": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (
            tempArr.findIndex(
              (_) =>
                _.id === note.id ||
                (note.kind === 6 &&
                  (note.relatedEvent.id === _.id ||
                    note.relatedEvent.id === _.relatedEvent?.id)) ||
                (_.kind === 6 &&
                  (_.relatedEvent.id === note.id ||
                    _.relatedEvent.id === note.relatedEvent?.id))
            ) === index
          )
            return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "dvms": {
      let nextState = { ...notes };
      let tempArr = [...nextState["dvms"], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState["dvms"] = sortedNotes;
      return nextState;
    }
    case "algo": {
      let nextState = { ...notes };
      let tempArr = [...nextState["algo"], ...action.note];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState["algo"] = sortedNotes;
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
  widgets: [],
  recent: [],
  recent_with_replies: [],
  paid: [],
  dvms: [],
  algo: [],
  global: [],
};

export default function Home() {
  const [selectedFilter, setSelectedFilter] = useState(getDefaultFilter(2));
  const [selectedCategory, setSelectedCategory] = useState(false);

  return (
    <>
      <div style={{ overflow: "auto" }}>
        <Helmet>
          <title>Yakihonne | Home</title>
          <meta
            property="og:description"
            content="A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
          />
          <meta
            property="og:image"
            content="https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png"
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta property="og:url" content="https://yakihonne.com" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="YakiHonne" />
          <meta property="og:title" content="YakiHonne" />
          <meta property="twitter:title" content="YakiHonne" />
          <meta
            property="twitter:description"
            content="A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
          />
          <meta
            property="twitter:image"
            content="https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png"
          />
        </Helmet>
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
                className="fit-container sticky fx-centered box-pad-h "
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--very-dim-gray)",
                }}
              >
                <div className="main-middle fx-scattered">
                  <ContentSource
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    type={2}
                  />
                  <ContentFilter
                    selectedFilter={selectedFilter}
                    setSelectedFilter={setSelectedFilter}
                    type={2}
                  />
                </div>
              </div>
              <HomeCarouselContentSuggestions />
              <div className="main-middle">
                {/* {userKeys && !showWriteNote && (
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
                      )} */}
                <PostNote />
                {selectedCategory !== SUGGESTED_TAGS_VALUE && (
                  <HomeFeed
                    selectedCategory={selectedCategory}
                    selectedFilter={selectedFilter}
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
      </div>
    </>
  );
}

const PostNote = () => {
  const { t } = useTranslation();
  const userKeys = useSelector((state) => state.userKeys);
  const [showWriteNote, setShowWriteNote] = useState(false);
  return (
    <>
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
        <PostAsNote content={""} exit={() => setShowWriteNote(false)} />
      )}
    </>
  );
};

const HomeFeed = ({ selectedCategory, selectedFilter }) => {
  const { t } = useTranslation();
  const userMutedList = useSelector((state) => state.userMutedList);
  const userInterestList = useSelector((state) => state.userInterestList);
  const userKeys = useSelector((state) => state.userKeys);
  const [userFollowings, setUserFollowings] = useState(false);
  const [notes, dispatchNotes] = useReducer(notesReducer, notesInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const [notesContentFrom, setNotesContentFrom] = useState(
    getContentFromValue(selectedCategory)
  );
  const [selectedCategoryValue, setSelectedCategoryValue] = useState(
    selectedCategory.value
  );
  const [notesLastEventTime, setNotesLastEventTime] = useState(undefined);
  const [rerenderTimestamp, setRerenderTimestamp] = useState(undefined);
  const [articlesSuggestions, setArticlesSuggestions] = useState([]);

  useEffect(() => {
    let contentFromValue = getContentFromValue(selectedCategory);
    if (selectedCategoryValue !== selectedCategory.value) {
      straightUp();
      dispatchNotes({ type: "remove-events" });
      setNotesContentFrom(contentFromValue);
      setSelectedCategoryValue(selectedCategory.value);
      setNotesLastEventTime(undefined);
    }
  }, [selectedCategory]);

  useEffect(() => {
    straightUp();
    dispatchNotes({ type: "remove-events" });
    setNotesLastEventTime(undefined);
  }, [selectedFilter]);

  useEffect(() => {
    straightUp();
    dispatchNotes({ type: "remove-events" });
    setNotesLastEventTime(undefined);
    setUserFollowings(false);
    if (notesLastEventTime === undefined) setRerenderTimestamp(Date.now());
  }, [userKeys]);

  const getNotesFilter = async () => {
    let filter;
    let until =
      selectedFilter.to && notesLastEventTime
        ? Math.min(selectedFilter.to, notesLastEventTime)
        : selectedFilter.to
        ? selectedFilter.to
        : notesLastEventTime;
    let towDaysPeriod = (2 * 24 * 60 * 60 * 1000) / 1000;
    let twoDaysPrior = Math.floor(
      (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000
    );
    twoDaysPrior = notesLastEventTime
      ? notesLastEventTime - towDaysPeriod
      : twoDaysPrior;
    let since =
      selectedFilter.from ||
      (["paid", "widgets"].includes(notesContentFrom)
        ? undefined
        : twoDaysPrior);

    let tempUserFollowings = Array.isArray(userFollowings)
      ? Array.from(userFollowings)
      : [];
    if (["recent", "recent_with_replies"].includes(notesContentFrom)) {
      if (tempUserFollowings.length === 0) {
        let userKeys = getKeys();
        if (userKeys) {
          let followings = await getFollowings(userKeys.pub);
          tempUserFollowings =
            followings?.followings?.length > 0
              ? [userKeys.pub, ...Array.from(followings.followings)]
              : [userKeys.pub, import.meta.env.VITE_YAKI_PUBKEY];
          setUserFollowings(tempUserFollowings);
        } else {
          tempUserFollowings = [import.meta.env.VITE_YAKI_PUBKEY];
          setUserFollowings(tempUserFollowings);
        }
      }

      let authors =
        selectedFilter.posted_by?.length > 0
          ? selectedFilter.posted_by
          : tempUserFollowings.length < 5
          ? [...tempUserFollowings, ...getBackupWOTList()]
          : tempUserFollowings;
      filter = [{ authors, kinds: [1, 6], until, since, limit: 20 }];
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
          authors:
            selectedFilter.posted_by?.length > 0
              ? selectedFilter.posted_by
              : undefined,
          until,
          since,
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
          authors:
            selectedFilter.posted_by?.length > 0
              ? selectedFilter.posted_by
              : undefined,
          until,
          since,
        },
      ];
      return {
        filter,
      };
    }

    return {
      filter: [
        {
          kinds: [1, 6],
          limit: 20,
          authors:
            selectedFilter.posted_by?.length > 0
              ? selectedFilter.posted_by
              : undefined,
          until,
          since,
        },
      ],
    };
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
      if (notes[notesContentFrom]?.length > 0)
        setNotesLastEventTime(
          notes[notesContentFrom][notes[notesContentFrom]?.length - 1]
            ?.created_at || undefined
        );
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading, selectedCategory]);

  useEffect(() => {
    if (
      !isLoading &&
      notes[notesContentFrom]?.length > 0 &&
      notes[notesContentFrom].length < 7
    ) {
      setNotesLastEventTime(
        notes[notesContentFrom][notes[notesContentFrom].length - 1]
          ?.created_at || undefined
      );
    }
  }, [isLoading, notes[notesContentFrom]]);

  useEffect(() => {
    const contentFromRelays = async () => {
      setIsLoading(true);
      let eventsPubkeys = [];
      let events = [];
      let fallBackEvents = [];
      let { filter } = await getNotesFilter();

      const algoRelay =
        selectedCategory.group === "af" ? [selectedCategory.value] : [];

      const filterSpeed = selectedCategory.group === "af" ? 1000 : 120;

      const data = await getSubData(
        filter,
        filterSpeed,
        algoRelay,
        undefined,
        200
      );
      events = data.data
        .splice(0, 50)
        .map((event) => {
          eventsPubkeys.push(event.pubkey);
          let event_ = getParsedNote(event, true);
          if (event_) fallBackEvents.push(event_);
          if (event_) {
            if (notesContentFrom !== "recent_with_replies") {
              if (!event_.isComment) {
                if (event.kind === 6) {
                  eventsPubkeys.push(event_.relatedEvent.pubkey);
                }
                return event_;
              }
            } else {
              if (event.kind === 6) {
                eventsPubkeys.push(event_.relatedEvent.pubkey);
              }
              return event_;
            }
          }
        })
        .filter((_) => _);

      let tempEvents =
        events.length > 0 ? Array.from(events) : Array.from(fallBackEvents);
      tempEvents = filterContent(selectedFilter, tempEvents);
      dispatchNotes({ type: notesContentFrom, note: tempEvents });
      saveUsers(eventsPubkeys);
      setIsLoading(false);
    };
    const contentFromDVM = async () => {
      try {
        setIsLoading(true);
        let eventId = await getDVMJobRequest(selectedCategory.value);
        if (!eventId) {
          setIsLoading(false);
          return;
        }
        let data = await getDVMJobResponse(eventId, selectedCategory.value);
        if (data.length > 0) {
          let events = [];
          let eventsPubkeys = [];

          const res = await getSubData([{ ids: data }], 200);

          events = res.data
            .map((event) => {
              eventsPubkeys.push(event.pubkey);
              let event_ = getParsedNote(event, true);
              if (event_) {
                if (notesContentFrom !== "recent_with_replies") {
                  if (!event_.isComment) {
                    if (event.kind === 6) {
                      eventsPubkeys.push(event_.relatedEvent.pubkey);
                    }
                    return event_;
                  }
                } else {
                  if (event.kind === 6) {
                    eventsPubkeys.push(event_.relatedEvent.pubkey);
                  }
                  return event_;
                }
              }
            })
            .filter((_) => _);

          dispatchNotes({ type: notesContentFrom, note: events });
          saveUsers(eventsPubkeys);
          setIsLoading(false);
        }
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    if (notesContentFrom && ["cf", "af"].includes(selectedCategory?.group))
      contentFromRelays();
    if (notesContentFrom && ["mf"].includes(selectedCategory?.group))
      contentFromDVM();
  }, [
    notesLastEventTime,
    selectedCategoryValue,
    rerenderTimestamp,
    selectedFilter,
  ]);

  const getContentCard = (index) => {
    if (index === 10)
      return (
        <ContentSuggestionsCards
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
      {["recent", "recent_with_replies"].includes(notesContentFrom) &&
        userFollowings &&
        userFollowings?.length < 5 &&
        notes[notesContentFrom]?.length > 0 && (
          <div className="fit-container box-pad-h">
            <hr />
            <div className="fit-container fx-centered fx-start-h fx-start-v box-pad-h box-pad-v-m">
              <div>
                <div className="eye-opened-24"></div>
              </div>
              <div>
                <p>{t("AZKoEWL")}</p>
                <p className="gray-c">{t("AstvJYT")}</p>
              </div>
            </div>

            {/* <p className="gray-c p-centered box-pad-h box-pad-v-m">
              Your current feed is based on someone else's following list, start
              following people to tailor your feed on your preference
            </p> */}
            <hr />
            <hr />
          </div>
        )}
      {!selectedFilter.default &&
        notes[notesContentFrom]?.length === 0 &&
        !isLoading && (
          <div
            className="fit-container fx-centered fx-col"
            style={{ height: "40vh" }}
          >
            <div
              className="yaki-logomark"
              style={{ minWidth: "48px", minHeight: "48px", opacity: 0.5 }}
            ></div>
            <h4>{t("A5BPCrj")}</h4>
            <p className="p-centered gray-c" style={{ maxWidth: "330px" }}>
              {t("AgEkYer")}
            </p>
          </div>
        )}
      {selectedFilter.default &&
        notes[notesContentFrom]?.length === 0 &&
        !isLoading && (
          <div
            className="fit-container fx-centered fx-col"
            style={{ height: "40vh" }}
          >
            <div
              className="yaki-logomark"
              style={{ minWidth: "48px", minHeight: "48px", opacity: 0.5 }}
            ></div>
            <h4>{t("A5BPCrj")}</h4>
            <p className="p-centered gray-c" style={{ maxWidth: "330px" }}>
              {t("ASpI7pT")}
            </p>
          </div>
        )}
      {notesContentFrom &&
        notes[notesContentFrom].map((note, index) => {
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
        })}

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
