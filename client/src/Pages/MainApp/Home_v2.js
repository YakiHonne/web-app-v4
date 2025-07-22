import React, {
  useEffect,
  useRef,
  useState,
  useReducer,
  Fragment,
  useCallback,
  useMemo,
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

const notesInitialState = {
  widgets: [],
  recent: [],
  recent_with_replies: [],
  paid: [],
  dvms: [],
  algo: [],
  global: [],
};

function deduplicateAndSortNotes(notesArr) {
  const seen = new Set();
  const result = [];
  for (let note of notesArr) {
    if (!seen.has(note.id)) {
      seen.add(note.id);
      result.push(note);
    }
  }
  return result.sort((a, b) => b.created_at - a.created_at);
}

function notesReducer(notes, action) {
  switch (action.type) {
    case "set": {
      const nextState = { ...notes };
      nextState[action.feedType] = deduplicateAndSortNotes(action.notes);
      return nextState;
    }
    case "clear": {
      return notesInitialState;
    }
    default:
      return notes;
  }
}

export default function Home_v2() {
  const [selectedFilter, setSelectedFilter] = useState(getDefaultFilter(2));
  const [selectedCategory, setSelectedCategory] = useState(false);

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
                      <PostNote />
                      {selectedCategory !== SUGGESTED_TAGS_VALUE && (
                        <HomeFeedV2
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
            </main>
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

const HomeFeedV2 = ({ selectedCategory, selectedFilter }) => {
  const { t } = useTranslation();
  const userMutedList = useSelector((state) => state.userMutedList);
  const userInterestList = useSelector((state) => state.userInterestList);
  const userKeys = useSelector((state) => state.userKeys);
  const [userFollowings, setUserFollowings] = useState(false);
  const [notes, dispatchNotes] = useReducer(notesReducer, notesInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const [notesContentFrom, setNotesContentFrom] = useState(
    selectedCategory ? getContentFromValue(selectedCategory) : "recent"
  );
  const [selectedCategoryValue, setSelectedCategoryValue] = useState(
    selectedCategory ? selectedCategory.value : ""
  );
  const [notesLastEventTime, setNotesLastEventTime] = useState(undefined);
  const [rerenderTimestamp, setRerenderTimestamp] = useState(undefined);
  const [articlesSuggestions, setArticlesSuggestions] = useState([]);

  // Debounce helpers
  const debounceRef = useRef();
  const debounce = useCallback((fn, delay) => {
    return (...args) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fn(...args), delay);
    };
  }, []);

  // Memoize filtered notes for rendering
  const visibleNotes = useMemo(() => {
    let arr = notes[notesContentFrom] || [];
    // Limit to latest 100 for performance
    return arr.slice(0, 100);
  }, [notes, notesContentFrom]);

  // Render notes using a flat map
  const renderNotes = useMemo(() => {
    return visibleNotes.map((note, index) => {
      if (![...userMutedList, ...bannedList].includes(note.pubkey)) {
        if (
          note.kind === 6 &&
          ![...userMutedList, ...bannedList].includes(note.relatedEvent.pubkey)
        )
          return (
            <div key={note.id}>
              <KindSix event={note} />
              {getContentCard(index)}
            </div>
          );
        if (note.kind !== 6)
          return (
            <div key={note.id}>
              <KindOne event={note} border={true} />
              {getContentCard(index)}
            </div>
          );
      }
      return null;
    });
  }, [visibleNotes, userMutedList]);

  // Debounced effect for category/filter changes
  useEffect(() => {
    debounce(() => {
      straightUp();
      dispatchNotes({ type: "clear" });
      setNotesContentFrom(getContentFromValue(selectedCategory));
      setSelectedCategoryValue(selectedCategory.value);
      setNotesLastEventTime(undefined);
    }, 200)();
    // eslint-disable-next-line
  }, [selectedCategory]);

  useEffect(() => {
    debounce(() => {
      straightUp();
      dispatchNotes({ type: "clear" });
      setNotesLastEventTime(undefined);
    }, 200)();
    // eslint-disable-next-line
  }, [selectedFilter]);

  // Infinite scroll handler (debounced)
  useEffect(() => {
    const handleScroll = debounce(() => {
      let container = document.querySelector(".main-page-nostr-container");
      if (!container && isLoading) return;
      if (
        container.scrollHeight - container.scrollTop - 400 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      setNotesLastEventTime(
        notes[notesContentFrom][notes[notesContentFrom].length - 1]
          ?.created_at || undefined
      );
    }, 250);
    const el = document.querySelector(".main-page-nostr-container");
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [isLoading, selectedCategory, notes, notesContentFrom]);

  // Data fetching (debounced)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      let eventsPubkeys = [];
      let events = [];
      let fallBackEvents = [];
      // Compose filter
      let until =
        selectedFilter.to && notesLastEventTime
          ? Math.min(selectedFilter.to, notesLastEventTime)
          : selectedFilter.to
          ? selectedFilter.to
          : notesLastEventTime;
      let since = selectedFilter.from || undefined;
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
                : [userKeys.pub, process.env.REACT_APP_YAKI_PUBKEY];
            setUserFollowings(tempUserFollowings);
          } else {
            tempUserFollowings = [process.env.REACT_APP_YAKI_PUBKEY];
            setUserFollowings(tempUserFollowings);
          }
        }
        let authors =
          selectedFilter.posted_by?.length > 0
            ? selectedFilter.posted_by
            : tempUserFollowings.length < 5
            ? [...tempUserFollowings, ...getBackupWOTList()]
            : tempUserFollowings;
        let filter = [{ authors, kinds: [1, 6], limit: 50, until, since }];
        const algoRelay =
          selectedCategory.group === "af" ? [selectedCategory.value] : [];
        let subscription = ndkInstance.subscribe(filter, {
          groupable: false,
          skipValidation: true,
          skipVerification: true,
          cacheUsage: "CACHE_FIRST",
          subId: "home-feed",
          relayUrls: algoRelay,
        });
        subscription.on("event", (event) => {
          eventsPubkeys.push(event.pubkey);
          let event_ = getParsedNote(event, true);
          if (event_) fallBackEvents.push(event_);
          if (event_) {
            if (notesContentFrom !== "recent_with_replies") {
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
          tempEvents = filterContent(
            selectedFilter,
            removeEventsDuplicants(tempEvents)
          );
          if (isMounted) {
            dispatchNotes({
              type: "set",
              feedType: notesContentFrom,
              notes: tempEvents,
            });
            saveUsers(eventsPubkeys);
            setIsLoading(false);
          }
        });
        let timer = setTimeout(() => {
          subscription.stop();
          clearTimeout(timer);
        }, 1000);
      } else if (
        notesContentFrom === "widgets" ||
        notesContentFrom === "paid"
      ) {
        let filter = [
          {
            kinds: [1],
            "#l": [
              notesContentFrom === "widgets" ? "smart-widget" : "FLASH NEWS",
            ],
            limit: 50,
            authors:
              selectedFilter.posted_by?.length > 0
                ? selectedFilter.posted_by
                : undefined,
            until,
            since,
          },
        ];
        const algoRelay =
          selectedCategory.group === "af" ? [selectedCategory.value] : [];
        let subscription = ndkInstance.subscribe(filter, {
          groupable: false,
          skipValidation: true,
          skipVerification: true,
          cacheUsage: "CACHE_FIRST",
          subId: "home-feed",
          relayUrls: algoRelay,
        });
        subscription.on("event",  (event) => {
          eventsPubkeys.push(event.pubkey);
          let event_ =  getParsedNote(event, true);
          if (event_) events.push(event_);
        });
        subscription.on("close", () => {
          let tempEvents = filterContent(
            selectedFilter,
            removeEventsDuplicants(events)
          );
          if (isMounted) {
            dispatchNotes({
              type: "set",
              feedType: notesContentFrom,
              notes: tempEvents,
            });
            saveUsers(eventsPubkeys);
            setIsLoading(false);
          }
        });
        let timer = setTimeout(() => {
          subscription.stop();
          clearTimeout(timer);
        }, 1000);
      } else if (notesContentFrom === "dvms" || notesContentFrom === "algo") {
        try {
          let eventId = await getDVMJobRequest(selectedCategory.value);
          if (!eventId) {
            setIsLoading(false);
            return;
          }
          let data = await getDVMJobResponse(eventId, selectedCategory.value);
          if (data.length > 0) {
            let events = [];
            let eventsPubkeys = [];
            let subscription = ndkInstance.subscribe([{ ids: data }], {
              groupable: false,
              skipValidation: true,
              skipVerification: true,
              cacheUsage: "CACHE_FIRST",
              subId: "home-feed",
            });
            subscription.on("event", async (event) => {
              if ([1, 6].includes(event.kind)) {
                let event_ = await getParsedNote(event, true);
                if (!event_.isComment) {
                  if (event.kind === 6) {
                    eventsPubkeys.push(event_.relatedEvent.pubkey);
                  }
                  events.push(event_);
                }
              }
            });
            subscription.on("close", () => {
              if (isMounted) {
                dispatchNotes({
                  type: "set",
                  feedType: notesContentFrom,
                  notes: filterContent(
                    selectedFilter,
                    removeEventsDuplicants(events)
                  ),
                });
                saveUsers(eventsPubkeys);
                setIsLoading(false);
              }
            });
            let timer = setTimeout(() => {
              subscription.stop();
              clearTimeout(timer);
            }, 1000);
          }
        } catch (err) {
          console.log(err);
          setIsLoading(false);
        }
      }
    };
    debounce(fetchData, 200)();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line
  }, [
    notesLastEventTime,
    selectedCategoryValue,
    rerenderTimestamp,
    selectedFilter,
  ]);

  function getContentCard(index) {
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
    return null;
  }

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
      {/* Flat render for up to 100 notes (no virtualization) */}
      {visibleNotes.map((note, index) => {
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
        return null;
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
