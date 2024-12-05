import React, { useEffect, useMemo, useReducer, useState } from "react";
import { Helmet } from "react-helmet";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { SelectTabs } from "../../Components/Main/SelectTabs";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import { useDispatch, useSelector } from "react-redux";
import Date_ from "../../Components/Date_";
import { getPopularNotes, getUserStats } from "../../Helpers/WSInstance";
import LoadingDots from "../../Components/LoadingDots";
import NumberShrink from "../../Components/NumberShrink";
import axios from "axios";
import { getSubData } from "../../Helpers/Controlers";
import { getParsedRepEvent, sortEvents } from "../../Helpers/Encryptions";
import useNoteStats from "../../Hooks/useNoteStats";
import {
  compactContent,
  getArticleDraft,
  getLinkFromAddr,
  getNoteDraft,
  sleepTimer,
  straightUp,
} from "../../Helpers/Helpers";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import ShareLink from "../../Components/ShareLink";
import { nip19 } from "nostr-tools";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { useLocation, useNavigate } from "react-router-dom";
import useRepEventStats from "../../Hooks/useRepEventStats";
import { eventKinds } from "../../Content/Extra";
import Select from "../../Components/Main/Select";
import AddCurationNOSTR from "../../Components/Main/AddCurationNOSTR";
import { Link } from "react-router-dom";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import AddBookmark from "../../Components/Main/AddBookMark";
import { saveBookmarks } from "../../Helpers/DB";
import ToDeleteGeneral from "../../Components/Main/ToDeleteGeneral";
import PostAsNote from "../../Components/Main/PostAsNote";
import AddVideo from "../../Components/Main/AddVideo";
import InterestSuggestions from "../../Content/InterestSuggestions";
import InterestSuggestionsCards from "../../Components/SuggestionsCards/InterestSuggestionsCards";
import { ndkInstance } from "../../Helpers/NDKInstance";
import AddArticlesToCuration from "../../Components/Main/AddArticlesToCuration";
import { customHistory } from "../../Helpers/History";
import LoadingLogo from "../../Components/LoadingLogo";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

const tabs = ["Home", "Content", "Bookmarks", "Interests"];
const bookmarkFilterOptions = [
  {
    display_name: "All content",
    value: 0,
  },
  {
    display_name: "Articles",
    value: 30023,
  },
  {
    display_name: "Articles curations",
    value: 30004,
  },
  {
    display_name: "Video curations",
    value: 30005,
  },
  {
    display_name: "Notes",
    value: 1,
  },
  {
    display_name: "Paid notes",
    value: 11,
  },
  {
    display_name: "Videos",
    value: 34235,
  },
];
const eventsReducer = (notes, action) => {
  switch (action.type) {
    case "notes": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.events];
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
      let tempArr = [...nextState[action.type], ...action.events];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "drafts": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.events];
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
      let tempArr = [...nextState[action.type], ...action.events];
      let sortedNotes = tempArr
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at)
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.d === note.d) === index) return note;
        });
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "videos": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.events];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "widgets": {
      let nextState = { ...notes };
      let tempArr = [...nextState[action.type], ...action.events];
      let sortedNotes = tempArr
        .filter((note, index, tempArr) => {
          if (tempArr.findIndex((_) => _.id === note.id) === index) return note;
        })
        .sort((note_1, note_2) => note_2.created_at - note_1.created_at);
      nextState[action.type] = sortedNotes;
      return nextState;
    }
    case "remove-event": {
      let nextState = { ...notes };
      let tempArr = [...action.events];
      nextState[action.toRemoveType] = tempArr;
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
  drafts: [],
  curations: [],
  videos: [],
  widgets: [],
};
const getLocalDrafts = () => {
  try {
    const artDraft = getArticleDraft();
    const noteDraft = getNoteDraft("root");
    let smartWidgetDraft = localStorage.getItem("sw-current-workspace");
    try {
      smartWidgetDraft = smartWidgetDraft
        ? JSON.parse(smartWidgetDraft)
        : false;
    } catch (err) {
      smartWidgetDraft = false;
    }

    let localDraft = {
      noteDraft: noteDraft
        ? { kind: 11, content: noteDraft, created_at: false }
        : false,
      smartWidgetDraft: smartWidgetDraft
        ? {
            kind: 300311,
            content: smartWidgetDraft,
            created_at: smartWidgetDraft.last_updated,
          }
        : false,
      artDraft: artDraft.default
        ? false
        : {
            created_at: artDraft.created_at || Math.floor(Date.now() / 1000),
            kind: 30024,
            title: artDraft.title || "Untitled",
            content: artDraft.content || "Untitled",
            local: true,
          },
    };
    return localDraft.artDraft ||
      localDraft.smartWidgetDraft ||
      localDraft.noteDraft
      ? localDraft
      : false;
  } catch (err) {
    return false;
  }
};
const getInterestList = (list) => {
  let tempList = [];
  for (let item of list) {
    let icon = InterestSuggestions.find(
      (_) =>
        _.main_tag.toLowerCase() === item.toLowerCase() ||
        _.sub_tags.find(($) => $.toLowerCase() === item.toLowerCase())
    );
    tempList.push({
      icon: icon?.icon || "",
      item,
      toDelete: false,
    });
  }
  return tempList;
};

export default function Dashboard() {
  const { state } = useLocation();
  const userKeys = useSelector((state) => state.userKeys);
  const [selectedTab, setSelectedTab] = useState(state?.tabNumber || 0);
  const [userPreview, setUserPreview] = useState(false);
  const [contentFilter, setContentFilter] = useState(
    state?.filter || "articles"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [postToNote, setPostToNote] = useState(
    state?.filter === "notes" && state?.init ? "" : false
  );

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        let [userProfile, sats, popularNotes, userContent] = await Promise.all([
          getUserStats(userKeys.pub),
          Promise.race([
            axios.get(
              `https://api.nostr.band/v0/stats/profile/${userKeys.pub}`
            ),
            sleepTimer(),
          ]),
          getPopularNotes(userKeys.pub),
          getSubData([
            {
              kinds: [30023, 30004, 30005, 34235],
              limit: 5,
              authors: [userKeys.pub],
            },
            { kinds: [30024], limit: 5, authors: [userKeys.pub] },
          ]),
        ]);
        userProfile = JSON.parse(
          userProfile.find((event) => event.kind === 10000105).content
        );

        let zaps_sent = sats
          ? sats.data.stats[userKeys.pub].zaps_sent
          : { count: 0, msats: 0 };
        let drafts = userContent.data
          .filter((event) => event.kind === 30024)
          .map((event) => getParsedRepEvent(event));
        let latestPublished = userContent.data
          .filter((event) => event.kind !== 30024)
          .map((event) => getParsedRepEvent(event));

        let localDraft = getLocalDrafts();
        setUserPreview({
          userProfile: {
            ...userProfile,
            zaps_sent,
          },
          popularNotes: sortEvents(popularNotes.filter((_) => _.kind === 1)),
          drafts: sortEvents(drafts),
          latestPublished: sortEvents(latestPublished),
          localDraft,
        });
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (userKeys) fetchHomeData();
  }, [userKeys]);

  const handleUpdate = async () => {
    let userContent = await getSubData([
      {
        kinds: [30023, 30004, 30005, 34235],
        limit: 5,
        authors: [userKeys.pub],
      },
      { kinds: [30024], limit: 5, authors: [userKeys.pub] },
    ]);
    let latestPublished = userContent.data
      .filter((event) => event.kind !== 30024)
      .map((event) => getParsedRepEvent(event));

    setUserPreview((prev) => {
      return { ...prev, latestPublished: sortEvents(latestPublished) };
    });
  };

  return (
    <>
      {postToNote !== false && (
        <PostAsNote
          exit={() => setPostToNote(false)}
          content={typeof postToNote === "string" ? postToNote : ""}
          linkedEvent={typeof postToNote !== "string" ? postToNote : ""}
        />
      )}
      <div>
        <Helmet>
          <title>Yakihonne | Dashboard</title>
          <meta name="description" content={"Manage your content with ease"} />
          <meta
            property="og:description"
            content={"Manage your content with ease"}
          />

          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta property="og:url" content={`https://yakihonne.com/dashboard`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content={"Dashboard"} />
          <meta property="twitter:title" content={"Dashboard"} />
          <meta
            property="twitter:description"
            content={"Manage your content with ease"}
          />
        </Helmet>

        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main className="main-page-nostr-container">
              <div
                className="fx-centered fit-container fx-start-h fx-start-v"
                style={{ gap: 0 }}
              >
                <div className="dahsboard-section fit-container">
                  <div
                    className="fit-height fit-container feed-container"
                    style={{ overflow: "scroll" }}
                  >
                    {selectedTab === 0 && isLoading && (
                      <div
                        className="fit-container fx-centered"
                        style={{ height: "100vh" }}
                      >
                        <div className="fx-centered">
                          <LoadingLogo />
                        </div>
                      </div>
                    )}
                    {selectedTab === 0 && userPreview && !isLoading && (
                      <HomeTab
                        data={userPreview}
                        setPostToNote={setPostToNote}
                        setContentFilter={setContentFilter}
                        setSelectedTab={setSelectedTab}
                        handleUpdate={handleUpdate}
                      />
                    )}
                    {selectedTab === 1 && (
                      <Content
                        filter={contentFilter}
                        localDraft={userPreview.localDraft}
                        init={state?.init || false}
                        setPostToNote={setPostToNote}
                      />
                    )}
                    {selectedTab === 2 && <Bookmarks />}
                    {selectedTab === 3 && <Interests />}
                    <div style={{ padding: "3rem" }}></div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                    }}
                    className="fit-container fx-centered box-pad-v"
                  >
                    <SelectTabs
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                      tabs={tabs}
                    />
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

const Content = ({ filter, setPostToNote, localDraft, init }) => {
  const userKeys = useSelector((state) => state.userKeys);
  const [contentFrom, setContentFrom] = useState(filter);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEventTime, setLastEventTime] = useState(undefined);
  const [deleteEvent, setDeleteEvent] = useState(false);
  const [addArtsToCur, setAddArtsToCur] = useState(false);
  const [editEvent, setEditEvent] = useState(false);
  const [showCurationCreator, setShowCurationCreator] = useState(
    filter === "curations" && init ? true : false
  );
  const [showVideosCreator, setShowVideosCreator] = useState(
    filter === "videos" && init ? true : false
  );
  const [events, dispatchEvents] = useReducer(
    eventsReducer,
    eventsInitialState
  );

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        if (!isLoading) setIsLoading(true);
        let filter = getFilter();
        let data = await getSubData([filter]);
        let parsedEvents = data.data.map((event) => {
          if (event.kind === 1) {
            return event;
          }
          return getParsedRepEvent(event);
        });
        dispatchEvents({ type: contentFrom, events: parsedEvents });
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    if (userKeys) fetchHomeData();
  }, [userKeys, contentFrom, lastEventTime]);

  useEffect(() => {
    if (isLoading) return;
    let filter = getFilter();
    let since = Math.floor(Date.now() / 1000);
    let subscription = ndkInstance.subscribe([{ ...filter, since }]);
    subscription.on("event", (event) => {
      let tempEvent = { ...event.rawEvent() };
      if (![1, 6].includes(event.kind)) {
        tempEvent = getParsedRepEvent(event.rawEvent());
      }
      dispatchEvents({ type: contentFrom, events: [tempEvent] });
    });
    return () => {
      if (subscription) subscription.stop();
    };
  }, [isLoading]);

  useEffect(() => {
    dispatchEvents({ type: "remove-events" });
    setLastEventTime(undefined);
  }, [userKeys]);

  useEffect(() => {
    const handleScroll = () => {
      let container = document.querySelector(".feed-container");

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
      .querySelector(".feed-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".feed-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  const getFilter = () => {
    let filter = {
      limit: 20,
      authors: [userKeys.pub],
      until: lastEventTime,
    };
    if (contentFrom === "articles") filter.kinds = [30023];
    if (contentFrom === "drafts") filter.kinds = [30024];
    if (contentFrom === "curations") filter.kinds = [30004, 30005];
    if (contentFrom === "videos") filter.kinds = [34235];
    if (contentFrom === "widgets") filter.kinds = [30031];
    if (contentFrom === "notes") filter.kinds = [1, 6];
    return filter;
  };

  const switchContentType = (type) => {
    straightUp();
    setIsLoading(true);
    dispatchEvents({ type: "remove-events" });
    setLastEventTime(undefined);
    setContentFrom(type);
  };

  const handleEventDeletion = () => {
    let tempArray = structuredClone(events[contentFrom]);
    tempArray = tempArray.filter((event) => event.id !== deleteEvent.id);
    dispatchEvents({
      type: "remove-event",
      toRemoveType: contentFrom,
      events: tempArray,
    });
    setDeleteEvent(false);
  };

  const handleAddContent = () => {
    if (["articles", "drafts"].includes(contentFrom)) {
      customHistory.push("/write-article");
      return;
    }
    if (["widgets"].includes(contentFrom)) {
      customHistory.push("/smart-widget-builder");
      return;
    }
    if (["notes"].includes(contentFrom)) {
      setPostToNote("");
      return;
    }
    if (["curations"].includes(contentFrom)) {
      setShowCurationCreator(true);
      return;
    }
    if (["videos"].includes(contentFrom)) {
      setShowVideosCreator(true);
      return;
    }
  };
  const handleEditItem = (event) => {
    if ([30004, 30005].includes(event.kind)) {
      setShowCurationCreator(true);
    } else {
      setShowVideosCreator(true);
    }
    setEditEvent(event);
  };
  return (
    <>
      {deleteEvent && (
        <ToDeleteGeneral
          eventId={deleteEvent.id}
          title={deleteEvent.title}
          kind={contentFrom}
          refresh={handleEventDeletion}
          cancel={() => setDeleteEvent(false)}
          aTag={deleteEvent.aTag}
        />
      )}
      {showVideosCreator && (
        <AddVideo
          exit={() => {
            setShowVideosCreator(false);
          }}
        />
      )}
      {showCurationCreator && (
        <AddCurationNOSTR
          exit={() => {
            setShowCurationCreator(false);
            setEditEvent(false);
          }}
          curation={editEvent ? editEvent : null}
          tags={editEvent.tags}
          relaysToPublish={[]}
        />
      )}
      {addArtsToCur && (
        <AddArticlesToCuration
          curation={addArtsToCur}
          tags={addArtsToCur.tags}
          relaysToPublish={[]}
          curationKind={addArtsToCur.kind}
          postKind={addArtsToCur.kind === 30004 ? 30023 : 34235}
          exit={() => {
            setAddArtsToCur(false);
          }}
          exitAndRefresh={() => {
            setAddArtsToCur(false);
          }}
        />
      )}
      <div className="fit-container">
        <div
          className="fit-container fx-even sticky box-pad-h"
          style={{
            top: "-1px",
            // padding: "1rem",
            paddingTop: 0,
            paddingBottom: 0,
            columnGap: 0,
            borderBottom: "1px solid var(--very-dim-gray)",
          }}
        >
          <div
            className={`list-item-b fx-centered fx-shrink ${
              ["articles", "drafts"].includes(contentFrom)
                ? "selected-list-item-b"
                : ""
            }`}
            onClick={() => switchContentType("articles")}
          >
            Articles
          </div>
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
          <div
            className={`list-item-b fx-centered fx-shrink ${
              contentFrom === "widgets" ? "selected-list-item-b" : ""
            }`}
            onClick={() => switchContentType("widgets")}
          >
            Smart widgets
          </div>
        </div>
        <div className="fit-container fx-scattered  box-pad-v box-pad-h">
          <h3 className="p-caps">
            {contentFrom === "drafts" ? "articles" : contentFrom}
          </h3>
          <div className="fx-centered">
            {["articles", "drafts"].includes(contentFrom) && (
              <Select
                options={[
                  { display_name: "Published", value: "articles" },
                  { display_name: "Drafts", value: "drafts" },
                ]}
                value={contentFrom}
                setSelectedValue={switchContentType}
              />
            )}
            <button className="btn btn-normal" onClick={handleAddContent}>
              <div className="plus-sign"></div>
            </button>
          </div>
        </div>
        <div className="fit-container fx-centered fx-col fx-start-v box-pad-h">
          {contentFrom === "drafts" && localDraft?.artDraft && (
            <div className="fit-container fx-centered fx-start-v fx-col">
              <div className="fit-container fx-centered fx-col fx-start-v">
                {localDraft?.artDraft && (
                  <>
                    <p className="c1-c">Ongoing</p>
                    <ContentCard event={localDraft?.artDraft} />
                  </>
                )}
              </div>
              {events[contentFrom].length > 0 && <p>Saved</p>}
            </div>
          )}
          {contentFrom === "notes" && localDraft?.noteDraft && (
            <div className="fit-container fx-centered fx-start-v fx-col">
              <div className="fit-container fx-centered fx-col fx-start-v">
                {localDraft?.noteDraft && (
                  <>
                    <p className="c1-c">Ongoing</p>
                    <ContentCard
                      event={localDraft?.noteDraft}
                      setPostToNote={setPostToNote}
                    />
                  </>
                )}
              </div>
              {events[contentFrom].length > 0 && <p>Saved</p>}
            </div>
          )}
          {contentFrom === "widgets" && localDraft?.smartWidgetDraft && (
            <div className="fit-container fx-centered fx-start-v fx-col">
              <div className="fit-container fx-centered fx-col fx-start-v">
                {localDraft?.smartWidgetDraft && (
                  <>
                    <p className="c1-c">Ongoing</p>
                    <ContentCard event={localDraft?.smartWidgetDraft} />
                  </>
                )}
              </div>
              {events[contentFrom].length > 0 && <p>Saved</p>}
            </div>
          )}
          {events[contentFrom].map((event) => {
            return (
              <ContentCard
                event={event}
                key={event.id}
                setDeleteEvent={setDeleteEvent}
                setPostToNote={setPostToNote}
                setEditItem={handleEditItem}
                setAddArtsToCur={setAddArtsToCur}
              />
            );
          })}
          {!isLoading && events[contentFrom].length === 0 && (
            <div
              className="fit-container fx-centered fx-col"
              style={{ height: "40vh" }}
            >
              <h4>No {contentFrom} was found</h4>
              <p className="gray-c">
                All your published content will be managed here
              </p>
            </div>
          )}
          {isLoading && (
            <div
              className="fit-container fx-centered"
              style={{ height: "40vh" }}
            >
              <div className="fx-centered">
                <LoadingLogo />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
const Bookmarks = () => {
  const userKeys = useSelector((state) => state.userKeys);
  const userBookmarks = useSelector((state) => state.userBookmarks);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [editBookmark, setEditBookmark] = useState(false);
  const [deleteBookmark, setDeleteBookmark] = useState(false);

  useEffect(() => {
    if (userKeys) setShowDetails(false);
  }, [userKeys]);

  const handleBookmarkDeletion = () => {
    let tempArr = Array.from(userBookmarks);
    let index = tempArr.findIndex(
      (bookmark) => bookmark.id === deleteBookmark.id
    );
    tempArr.splice(index, 1);
    saveBookmarks(tempArr, userKeys.pub);
    setDeleteBookmark(false);
  };

  return (
    <>
      {showAddBookmark && (
        <AddBookmark exit={() => setShowAddBookmark(false)} />
      )}
      {editBookmark && (
        <AddBookmark
          bookmark={editBookmark}
          tags={editBookmark.tags}
          exit={() => setEditBookmark(false)}
        />
      )}
      {deleteBookmark && (
        <ToDeleteGeneral
          eventId={deleteBookmark.id}
          title={deleteBookmark.title}
          kind="bookmark"
          refresh={handleBookmarkDeletion}
          cancel={() => setDeleteBookmark(false)}
          aTag={deleteBookmark.aTag}
        />
      )}
      <div className="fit-container">
        <div className="fit-container fx-scattered  box-pad-v box-pad-h">
          <h3 className="p-caps">Bookmarks</h3>
          <button
            className="btn btn-normal"
            onClick={() => setShowAddBookmark(true)}
          >
            <div className="plus-sign"></div>
          </button>
        </div>
        <div className="fit-container fx-centered fx-col fx-start-v box-pad-h">
          {!showDetails &&
            userBookmarks.map((event) => {
              return (
                <BookmarkCard
                  event={event}
                  key={event.id}
                  showDetails={setShowDetails}
                  deleteEvent={setDeleteBookmark}
                  editEvent={setEditBookmark}
                />
              );
            })}
          {showDetails && (
            <BookmarkContent
              bookmark={showDetails}
              exit={() => setShowDetails(false)}
              setToDeleteBoormark={() => null}
              setToEditBookmark={() => null}
            />
          )}
        </div>
      </div>
    </>
  );
};
const Interests = () => {
  const userInterestList = useSelector((state) => state.userInterestList);
  const interests = useMemo(() => {
    return getInterestList(userInterestList);
  }, [userInterestList]);

  const [isManage, setIsManage] = useState(false);
  return (
    <div className="fit-container">
      <div className="fit-container fx-scattered  box-pad-v box-pad-h">
        <h3 className="p-caps">Interests</h3>
        {userInterestList.length > 0 && !isManage && (
          <button className="btn btn-normal" onClick={() => setIsManage(true)}>
            Manage your interests
          </button>
        )}
      </div>
      {userInterestList.length === 0 && !isManage && (
        <div className="fit-container fx-centered" style={{ padding: "3rem" }}>
          <div
            className="sc-s-18 fit-container  fx-centered fx-col"
            style={{ backgroundColor: "transparent", padding: "3rem" }}
          >
            <h4>Get started now</h4>
            <p
              className="p-centered gray-c box-pad-v-m"
              style={{ maxWidth: "500px" }}
            >
              Expand your world by adding what fascinates you. Select your
              interests and let the journey begin.
            </p>
            <button
              className="btn btn-normal fx-centered"
              onClick={() => setIsManage(true)}
            >
              <div className="plus-sign"></div>
              Add interests
            </button>
          </div>
        </div>
      )}
      {!isManage && (
        <div className="fx-centered fx-col box-pad-h">
          {interests.map((item, index) => {
            return (
              <div
                className="fx-centered fx-start-h sc-s-18 box-pad-h-m box-pad-v-m fit-container"
                style={{ backgroundColor: "transparent" }}
                key={index}
              >
                <div
                  style={{
                    minWidth: `38px`,
                    aspectRatio: "1/1",
                    position: "relative",
                  }}
                  className="sc-s-18 fx-centered"
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      zIndex: 2,
                      backgroundImage: `url(${item.icon})`,
                    }}
                    className="bg-img cover-bg  fit-container fit-height"
                  ></div>
                  <p
                    className={"p-bold p-caps p-big"}
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    {item.item.charAt(0)}
                  </p>
                </div>
                <p className="p-caps">{item.item}</p>
              </div>
            );
          })}
        </div>
      )}
      {isManage && <ManageInterest exit={() => setIsManage(false)} />}
    </div>
  );
};
const HomeTab = ({
  data,
  setPostToNote,
  setSelectedTab,
  setContentFilter,
  handleUpdate,
}) => {
  const userMetadata = useSelector((state) => state.userMetadata);
  const [deleteEvent, setDeleteEvent] = useState(false);
  const [addArtsToCur, setAddArtsToCur] = useState(false);
  const [editEvent, setEditEvent] = useState(false);
  const [showCurationCreator, setShowCurationCreator] = useState(false);

  const handleEditItem = (event) => {
    if ([30004, 30005].includes(event.kind)) {
      setShowCurationCreator(true);
    }
    setEditEvent(event);
  };

  const handleUpdateEvent = () => {
    let timer = setTimeout(() => {
      setShowCurationCreator(false);
      setEditEvent(false);
      setDeleteEvent(false)
      handleUpdate();
      clearTimeout(timer)
    }, [1000])
  }

  return (
    <>
      {addArtsToCur && (
        <AddArticlesToCuration
          curation={addArtsToCur}
          tags={addArtsToCur.tags}
          relaysToPublish={[]}
          curationKind={addArtsToCur.kind}
          postKind={addArtsToCur.kind === 30004 ? 30023 : 34235}
          exit={() => {
            setAddArtsToCur(false);
          }}
          exitAndRefresh={() => {
            setAddArtsToCur(false);
          }}
        />
      )}
      {deleteEvent && (
        <ToDeleteGeneral
          eventId={deleteEvent.id}
          title={deleteEvent.title}
          refresh={handleUpdateEvent}
          cancel={() => setDeleteEvent(false)}
          aTag={deleteEvent.aTag}
        />
      )}
      {showCurationCreator && (
        <AddCurationNOSTR
          exit={handleUpdateEvent}
          curation={editEvent ? editEvent : null}
          tags={editEvent.tags}
          relaysToPublish={[]}
        />
      )}
      <div className="fit-container box-pad-v box-pad-h">
        <div className="fit-container fx-scattered">
          <h3>Home</h3>
          {/* <div style={{ width: "150px" }}>
          <WriteNew exit={() => null} />
        </div> */}
        </div>
        <div className="fit-container fx-centered fx-col box-pad-v">
          <div className="fit-container fx-centered fx-stretch fx-wrap">
            <div
              className="sc-s-18 box-pad-v fx"
              style={{ position: "relative", flex: "1 1 400px" }}
            >
              <div
                style={{
                  backgroundImage: `url(${userMetadata.banner})`,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  zIndex: 0,
                  height: "40%",
                  width: "100%",
                }}
                className="bg-img cover-bg"
              ></div>
              <div
                className="box-pad-h fx fx-centered fx-col fx-start-h"
                style={{ position: "relative", zIndex: 1 }}
              >
                <div
                  style={{
                    border: "6px solid var(--c1-side)",
                    borderRadius: "22px",
                  }}
                >
                  <UserProfilePicNOSTR mainAccountUser={true} size={110} />
                </div>
                <div className="fx-centered fx-col">
                  <h4>{userMetadata.display_name || userMetadata.name}</h4>
                  <p className="gray-c">
                    Joined date{" "}
                    <Date_
                      toConvert={new Date(data.userProfile.time_joined * 1000)}
                    />
                  </p>
                </div>
                <Link to={`/yaki-points`}>
                  <button className="btn btn-normal fx-centered">
                    <div className="cup"></div> Yaki points
                  </button>
                </Link>
              </div>
            </div>
            <div
              className="fx-centered fx-col fx fx-stretch"
              style={{ flex: "1 1 400px" }}
            >
              <div className="fit-container fx-centered fx">
                <div
                  className="sc-s-18 fx fx-centered fx-col fx-start-h fx-start-v box-pad-h box-pad-v fit-height"
                  style={{ backgroundColor: "transparent", gap: "16px" }}
                >
                  <div
                    className="user-followed-24"
                    style={{ minWidth: "32px", minHeight: "32px" }}
                  ></div>
                  <div className="fx-centered">
                    <h4>{data.userProfile?.follows_count || 0}</h4>
                    <p className="gray-c">Following</p>
                  </div>
                </div>
                <div
                  className="sc-s-18 fx fx-centered fx-col fx-start-h fx-start-v box-pad-h box-pad-v fit-height"
                  style={{ backgroundColor: "transparent", gap: "16px" }}
                >
                  <div
                    className="user-followed-24"
                    style={{ minWidth: "32px", minHeight: "32px" }}
                  ></div>
                  <div className="fx-centered">
                    <h4>{data.userProfile?.followers_count || 0}</h4>
                    <p className="gray-c">Followers</p>
                  </div>
                </div>
              </div>
              <div className="fit-container fx-centered fx">
                <div
                  className="fx sc-s-18 fx fx-centered fx-col fx-start-v box-pad-h box-pad-v fit-height"
                  style={{ backgroundColor: "transparent", gap: "16px" }}
                >
                  <div
                    className="note-24"
                    style={{ minWidth: "32px", minHeight: "32px" }}
                  ></div>
                  <div className="fx-centered">
                    <h4>{data.userProfile?.note_count || 0}</h4>
                    <p className="gray-c">Notes</p>
                  </div>
                </div>
                <div
                  className="fx sc-s-18 fx fx-centered fx-col fx-start-v box-pad-h box-pad-v fit-height"
                  style={{ backgroundColor: "transparent", gap: "16px" }}
                >
                  <div
                    className="comment-icon"
                    style={{ minWidth: "32px", minHeight: "32px" }}
                  ></div>
                  <div className="fx-centered">
                    <h4>{data.userProfile?.reply_count || 0}</h4>
                    <p className="gray-c">Replies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="fit-container fx-centered fx-wrap">
            <div
              className="sc-s-18 fx fx-centered fx-col fx-start-h fx-start-v box-pad-h box-pad-v "
              style={{
                backgroundColor: "transparent",
                gap: "16px",
                flex: "1 1 400px",
              }}
            >
              <div
                className="bolt-24"
                style={{ minWidth: "32px", minHeight: "32px" }}
              ></div>
              <div className="fx-centered">
                <h4>
                  <NumberShrink
                    value={data.userProfile?.total_zap_count || 0}
                  />
                </h4>
                <p className="gray-c">Zaps received</p>
                <p className="gray-c p-medium">&#8226; </p>
                <h4>
                  <NumberShrink
                    value={data.userProfile?.total_satszapped || 0}
                  />
                </h4>
                <p className="gray-c">Total amount</p>
              </div>
            </div>
            <div
              className="sc-s-18 fx fx-centered fx-col fx-start-h fx-start-v box-pad-h box-pad-v "
              style={{
                backgroundColor: "transparent",
                gap: "16px",
                flex: "1 1 400px",
              }}
            >
              <div
                className="bolt-24"
                style={{ minWidth: "32px", minHeight: "32px" }}
              ></div>
              <div className="fx-centered">
                <h4>
                  {
                    <NumberShrink
                      value={data.userProfile?.zaps_sent?.count || 0}
                    />
                  }
                </h4>
                <p className="gray-c">Zaps sent</p>
                <p className="gray-c p-medium">&#8226; </p>
                <h4>
                  <NumberShrink
                    value={(data.userProfile?.zaps_sent?.msats || 0) / 1000}
                  />
                </h4>
                <p className="gray-c">Total amount</p>
              </div>
            </div>
          </div>
        </div>
        {data.latestPublished.length > 0 && (
          <div className="fit-container fx-centered fx-start-v fx-col box-pad-v-m">
            <p className="gray-c p-big">Latest published</p>
            <div className="fit-container fx-centered fx-col fx-start-v">
              {data.latestPublished.map((event) => {
                return (
                  <ContentCard
                    key={event.id}
                    event={event}
                    setPostToNote={setPostToNote}
                    setDeleteEvent={setDeleteEvent}
                    setEditItem={handleEditItem}
                    setAddArtsToCur={setAddArtsToCur}
                  />
                );
              })}
            </div>
          </div>
        )}
        {(data.localDraft || data.drafts.length > 0) && (
          <div className="fit-container fx-centered fx-start-v fx-col box-pad-v-m">
            <p className="gray-c p-big">Drafts</p>
            <div className="fit-container fx-centered fx-col fx-start-v">
              {data.localDraft && (
                <>
                  <p className="c1-c">Ongoing</p>
                  {data.localDraft.noteDraft && (
                    <ContentCard
                      event={data.localDraft.noteDraft}
                      setPostToNote={setPostToNote}
                    />
                  )}
                  {data.localDraft.artDraft && (
                    <ContentCard event={data.localDraft.artDraft} />
                  )}
                  {data.localDraft.smartWidgetDraft && (
                    <ContentCard event={data.localDraft.smartWidgetDraft} />
                  )}
                </>
              )}
              {data.drafts.length > 0 && (
                <>
                  <div className="fit-container fx-scattered">
                    <p>Saved</p>
                    {data.drafts.length > 4 && (
                      <p
                        className="btn-text-gray pointer"
                        onClick={() => {
                          setSelectedTab(1);
                          setContentFilter("drafts");
                        }}
                      >
                        See all
                      </p>
                    )}
                  </div>
                  {data.drafts.slice(0, 4).map((event) => {
                    return <ContentCard key={event.id} event={event} />;
                  })}
                </>
              )}
            </div>
          </div>
        )}
        {data.popularNotes.length > 0 && (
          <div className="fit-container fx-centered fx-start-v fx-col box-pad-v-m">
            <p className="gray-c p-big">Popular notes</p>
            <div className="fit-container fx-centered fx-col">
              {data.popularNotes.map((event) => {
                return <ContentCard key={event.id} event={event} />;
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const ContentCard = ({
  event,
  setDeleteEvent,
  setEditItem,
  setAddArtsToCur,
  setPostToNote,
}) => {
  return (
    <>
      {[1, 6].includes(event.kind) && <NoteCard event={event} />}
      {[11, 300311].includes(event.kind) && (
        <DraftCardOthers event={event} setPostToNote={setPostToNote} />
      )}
      {event.kind === 30024 && (
        <DraftCard event={event} setDeleteEvent={setDeleteEvent} />
      )}
      {[30004, 30005, 30023, 34235, 30031].includes(event.kind) && (
        <RepCard
          event={event}
          setDeleteEvent={setDeleteEvent}
          setPostToNote={setPostToNote}
          setEditItem={setEditItem}
          setAddArtsToCur={setAddArtsToCur}
        />
      )}
      {event.kind === 30003 && <BookmarkCard event={event} />}
    </>
  );
};

const DraftCard = ({ event, setDeleteEvent }) => {
  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-m box-pad-v-m pointer"
      style={{
        backgroundColor: "transparent",
        gap: "32px",
        overflow: "visible",
        borderColor: event.local ? "var(--c1)" : "",
      }}
      onClick={(e) => {
        e.stopPropagation();
        event.local
          ? customHistory.push("/write-article")
          : customHistory.push("/write-article", {
              post_pubkey: event.pubkey,
              post_id: event.id,
              post_kind: event.kind,
              post_title: event.title,
              post_desc: event.summary,
              post_thumbnail: event.image,
              post_tags: event.items,
              post_d: event.d,
              post_content: event.content,
              post_published_at: event.published_at,
            });
      }}
    >
      <div className="fx-centered fx-start-v">
        <div className="round-icon">
          <div className="posts-24"></div>
        </div>

        <div className="fx-centered fx-col fx-start-h fx-start-v">
          <div className="fx-centered">
            <p className="gray-c p-medium">
              Last updated{" "}
              <Date_ toConvert={new Date(event.created_at * 1000)} />
            </p>
            {event.local && (
              <div className="sticker sticker-normal sticker-gray-black">
                article
              </div>
            )}
          </div>
          <p className="p-two-lines">
            {event.title || <span className="p-italic gray-c">Untitled</span>}
          </p>
        </div>
      </div>
      {/* {!event.local && ( */}
      <div className="fx-centered" style={{ minWidth: "max-content" }}>
        <OptionsDropdown
          options={[
            <Link
              className="pointer"
              to={"/write-article"}
              state={{
                post_pubkey: event.pubkey,
                post_id: event.id,
                post_kind: event.kind,
                post_title: event.title,
                post_desc: event.summary,
                post_thumbnail: event.image,
                post_tags: event.items,
                post_d: event.d,
                post_content: event.content,
                post_published_at: event.published_at,
              }}
            >
              <p>Edit draft</p>
            </Link>,
            setDeleteEvent && (
              <div
                className="fit-container"
                onClick={() => setDeleteEvent(event)}
              >
                <p className="red-c">Delete</p>
              </div>
            ),
          ]}
        />
      </div>
      {/* )} */}
    </div>
  );
};
const DraftCardOthers = ({ event, setPostToNote }) => {
  const handleRedirect = (e) => {
    e.stopPropagation();
    if (event.kind === 11) {
      setPostToNote("");
      return;
    }
    if (event.kind === 300311) {
      customHistory.push("/smart-widget-builder");
    }
  };
  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-m box-pad-v-m pointer"
      style={{
        backgroundColor: "transparent",
        gap: "32px",
        overflow: "visible",
        borderColor: "var(--c1)",
      }}
      onClick={handleRedirect}
    >
      <div className="fx-centered fx-start-v">
        <div className="round-icon">
          {event.kind === 11 && <div className="note-24"></div>}
          {event.kind === 300311 && <div className="smart-widget-24"></div>}
        </div>

        <div className="fx-centered fx-col fx-start-h fx-start-v">
          <div className="fx-centered">
            <p className="gray-c p-medium">
              Last updated{" "}
              {event.created_at ? (
                <Date_ toConvert={new Date(event.created_at * 1000)} />
              ) : (
                "recent"
              )}
            </p>
            <div className="sticker sticker-normal sticker-gray-black">
              {eventKinds[event.kind]}
            </div>
          </div>
          <p className="p-two-lines">
            {event.kind === 11 && <>{compactContent(event.content)}</>}
            {event.kind === 300311 && (
              <>
                <span className="c1-c">{event.content.components.length}</span>{" "}
                components in this smart widget
              </>
            )}
          </p>
        </div>
      </div>
      <OptionsDropdown
        options={[
          <div className="pointer" onClick={handleRedirect}>
            <p>Edit draft</p>
          </div>,
        ]}
      />
    </div>
  );
};

const RepCard = ({
  event,
  setDeleteEvent,
  setEditItem,
  setAddArtsToCur,
  setPostToNote,
}) => {
  const dispatch = useDispatch();

  const copyID = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(event.naddr);
    dispatch(
      setToast({
        type: 1,
        desc: `Note ID was copied! 👏`,
      })
    );
  };
  const getOptions = () => {
    if (event.kind === 30031) {
      return [
        <div
          className="fit-container"
          onClick={(e) => {
            e.stopPropagation();
            setPostToNote(
              // `https://yakihonne.com/smart-widget-checker?naddr=${event.naddr}`
              event
            );
          }}
        >
          <p>Post {eventKinds[event.kind]} in note</p>
        </div>,
        <div onClick={copyID} className="pointer">
          <p>Copy naddr</p>
        </div>,
        <Link
          className="fit-container"
          to={"/smart-widget-builder"}
          state={{
            ops: "clone",
            metadata: { ...{ metadata: JSON.parse(event.content), ...event } },
          }}
        >
          <p>Clone</p>
        </Link>,
        <Link
          className="fit-container"
          to={`/smart-widget-checker?naddr=${event.naddr}`}
        >
          <p>Check validity</p>
        </Link>,
        setDeleteEvent && (
          <Link
            className="fit-container"
            to={"/smart-widget-builder"}
            state={{
              ops: "edit",
              metadata: {
                ...{ metadata: JSON.parse(event.content), ...event },
              },
            }}
          >
            <p>Edit</p>
          </Link>
        ),
        setDeleteEvent && (
          <div className="fit-container" onClick={() => setDeleteEvent(event)}>
            <p className="red-c">Delete</p>
          </div>
        ),
        <div className="fit-container fx-centered fx-start-h pointer">
          <ShareLink
            label={`Share ${eventKinds[event.kind]}`}
            path={`/${event.naddr}`}
            title={userMetadata.display_name || userMetadata.name}
            description={event.content}
            kind={1}
            shareImgData={{
              post: event,
              author: userMetadata,
              label: "Note",
            }}
          />
        </div>,
      ];
    }
    return [
      <div
        className="fit-container"
        onClick={(e) => {
          e.stopPropagation();
          setPostToNote(event);
          // setPostToNote(event.naddr);
        }}
      >
        <p>Post {eventKinds[event.kind]} in a note</p>
      </div>,
      <div onClick={copyID} className="pointer">
        <p>Copy naddr</p>
      </div>,
      setAddArtsToCur && [30004, 30005].includes(event.kind) && (
        <div
          className="fit-container"
          onClick={(e) => {
            e.stopPropagation();
            setAddArtsToCur(event);
          }}
        >
          <p>Add items</p>
        </div>
      ),
      ([30023, 30024].includes(event.kind) ||
        (setEditItem && event.kind !== 34235)) && (
        <div
          className="fit-container"
          onClick={() => {
            [30023, 30024].includes(event.kind)
              ? navigate("/write-article", {
                  state: {
                    post_pubkey: event.pubkey,
                    post_id: event.id,
                    post_kind: event.kind,
                    post_title: event.title,
                    post_desc: event.summary,
                    post_thumbnail: event.image,
                    post_tags: event.items,
                    post_d: event.d,
                    post_content: event.content,
                    post_published_at: event.published_at,
                  },
                })
              : setEditItem(event);
          }}
        >
          <p>Edit</p>
        </div>
      ),
      setDeleteEvent && (
        <div className="fit-container" onClick={() => setDeleteEvent(event)}>
          <p className="red-c">Delete</p>
        </div>
      ),
      <div className="fit-container fx-centered fx-start-h pointer">
        <ShareLink
          label={`Share ${eventKinds[event.kind]}`}
          path={`/${event.naddr}`}
          title={userMetadata.display_name || userMetadata.name}
          description={event.content}
          kind={1}
          shareImgData={{
            post: event,
            author: userMetadata,
            label: "Note",
          }}
        />
      </div>,
    ];
  };

  const navigate = useNavigate();
  const userMetadata = useSelector((state) => state.userMetadata);
  const { postActions } = useRepEventStats(event.aTag, event.pubkey);
  const options = useMemo(() => {
    return getOptions();
  }, []);

  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-m box-pad-v-m pointer"
      style={{
        backgroundColor: "transparent",
        gap: "32px",
        overflow: "visible",
      }}
      onClick={(e) => {
        e.stopPropagation();
        customHistory.push(getLinkFromAddr(event.naddr));
        // customHistory.push(`/${event.naddr}`);
      }}
    >
      <div className="fx-centered fx-start-v">
        {!event.image && (
          <div className="round-icon">
            {[30004, 30003].includes(event.kind) && (
              <div className="curation-24"></div>
            )}
            {[30023].includes(event.kind) && <div className="posts-24"></div>}
            {[34235].includes(event.kind) && <div className="play-24"></div>}
            {[30031].includes(event.kind) && (
              <div className="smart-widget-24"></div>
            )}
          </div>
        )}
        {event.image && (
          <div
            className="sc-s-18 bg-img cover-bg"
            style={{
              backgroundImage: `url(${event.image})`,
              minWidth: "48px",
              aspectRatio: "1/1",
            }}
          ></div>
        )}

        <div className="fx-centered fx-col fx-start-h fx-start-v">
          <p className="gray-c p-medium">
            Last updated <Date_ toConvert={new Date(event.created_at * 1000)} />
          </p>
          <p className="p-two-lines">
            {event.title || <span className="p-italic gray-c">Untitled</span>}
          </p>
          <div className="fx-centered">
            <div className="fx-centered">
              <div className="heart"></div>
              <div className="gray-c">{postActions.likes.likes.length}</div>
            </div>
            <div className="fx-centered">
              <div className="comment-icon"></div>
              <p className="gray-c">{postActions.replies.replies.length}</p>
            </div>
            <div className="fx-centered">
              <div className="bolt"></div>
              <p className="gray-c">{postActions.zaps.total}</p>
            </div>
            <div className="box-pad-h-s">
              <div className="sticker sticker-normal sticker-gray-black">
                {eventKinds[event.kind]}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!event.local && (
        <div
          className="fx-centered"
          onClick={(e) => e.stopPropagation()}
          style={{ minWidth: "max-content" }}
        >
          <OptionsDropdown options={options} />
        </div>
      )}
    </div>
  );
};

const NoteCard = ({ event }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userMetadata = useSelector((state) => state.userMetadata);
  const isRepost = event.kind === 6 ? JSON.parse(event.content) : event;
  const { postActions } = useNoteStats(isRepost.id, isRepost.pubkey);
  const isFlashNews = isRepost.tags.find(
    (tag) => tag[0] === "l" && tag[1] === "FLASH NEWS"
  )
    ? true
    : false;
  const copyID = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nip19.noteEncode(isRepost.id));
    dispatch(
      setToast({
        type: 1,
        desc: `Note ID was copied! 👏`,
      })
    );
  };
  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-m box-pad-v-m  pointer"
      style={{
        backgroundColor: "transparent",
        gap: "32px",
        overflow: "visible",
      }}
      onClick={(e) => {
        e.stopPropagation();
        customHistory.push(`/notes/${nip19.noteEncode(isRepost.id)}`);
      }}
    >
      <div className="fx-centered fx-start-v">
        <div className="round-icon">
          <div className="note-24"></div>
        </div>
        <div className="fx-centered fx-col fx-start-h fx-start-v">
          <div className="fx-centered">
            <p className="gray-c p-medium">
              Published on{" "}
              <Date_ toConvert={new Date(isRepost.created_at * 1000)} />
            </p>
          </div>
          <p className="p-two-lines">{compactContent(isRepost.content)}</p>
          <div className="fx-centered">
            <div className="fx-centered">
              <div className="heart"></div>
              <div className="gray-c">{postActions.likes.likes.length}</div>
            </div>
            <div className="fx-centered">
              <div className="comment-icon"></div>
              <p className="gray-c">{postActions.replies.replies.length}</p>
            </div>
            <div className="fx-centered">
              <div className="bolt"></div>
              <p className="gray-c">{postActions.zaps.total}</p>
            </div>
            {isFlashNews && (
              <div className="sticker sticker-normal sticker-gray-black">
                Paid
              </div>
            )}
            {event.kind === 6 && (
              <div className="sticker sticker-normal sticker-gray-black fx-centered">
                Reposted <div className="switch-arrows"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="fx-centered" style={{ minWidth: "max-content" }}>
        <OptionsDropdown
          options={[
            <div onClick={copyID} className="pointer">
              <p>Copy note ID</p>
            </div>,
            <div className="fit-container fx-centered fx-start-h pointer">
              <ShareLink
                label="Share note"
                path={`/notes/${nip19.noteEncode(isRepost.id)}`}
                title={userMetadata.display_name || userMetadata.name}
                description={isRepost.content}
                kind={1}
                shareImgData={{
                  post: isRepost,
                  author: userMetadata,
                  label: "Note",
                }}
              />
            </div>,
          ]}
        />
      </div>
    </div>
  );
};

const BookmarkCard = ({ event, showDetails, deleteEvent, editEvent }) => {
  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-m box-pad-v-m pointer"
      style={{
        backgroundColor: "transparent",
        gap: "32px",
        overflow: "visible",
      }}
      onClick={(e) => {
        e.stopPropagation();
        showDetails(event);
      }}
    >
      <div className="fx-centered fx-start-v">
        {!event.image && (
          <div className="round-icon">
            <div className="bookmark-24"></div>
          </div>
        )}
        {event.image && (
          <div
            className="sc-s-18 bg-img cover-bg"
            style={{
              backgroundImage: `url(${event.image})`,
              minWidth: "48px",
              aspectRatio: "1/1",
            }}
          ></div>
        )}

        <div className="fx-centered fx-col fx-start-h fx-start-v">
          <p className="gray-c p-medium">
            Last updated <Date_ toConvert={new Date(event.created_at * 1000)} />
          </p>
          <div className="fx-centered">
            <p className="p-two-lines">
              {event.title || <span className="p-italic gray-c">Untitled</span>}
            </p>
            <span className="sticker sticker-gray-black sticker-small">
              {event.items.length} items
            </span>
          </div>
        </div>
      </div>

      <div className="fx-centered" style={{ minWidth: "max-content" }}>
        <OptionsDropdown
          options={[
            <div
              className="fit-container"
              onClick={(e) => {
                e.stopPropagation();
                editEvent(event);
              }}
            >
              <p>Edit</p>
            </div>,
            <div
              className="fit-container"
              onClick={(e) => {
                e.stopPropagation();
                deleteEvent(event);
              }}
            >
              <p className="red-c">Delete</p>
            </div>,
          ]}
        />
      </div>
    </div>
  );
};

const BookmarkContent = ({ bookmark, exit }) => {
  const [content, setContent] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [postKind, setPostKind] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const itemsNumber = useMemo(() => {
    if (postKind === 0)
      return content.length >= 10 || content.length === 0
        ? content.length
        : `0${content.length}`;
    let num = content.filter((item) => item.kind === postKind).length;
    return num >= 10 || num === 0 ? num : `0${num}`;
  }, [postKind, content]);

  useEffect(() => {
    const fetchData = async () => {
      let tags = bookmark.tags.filter((tag) => ["a", "e"].includes(tag[0]));
      let aDs = [];
      let aKinds = [];
      let eIDs = [];
      for (let tag of tags) {
        tag[0] === "a" &&
          aDs.push(tag[1].split(":").splice(2, 100).join(":")) &&
          aKinds.push(parseInt(tag[1].split(":")[0]));
        tag[0] === "e" && eIDs.push(tag[1]);
      }
      aKinds = [...new Set(aKinds)];

      let filter = [];
      aDs.length > 0 && filter.push({ kinds: aKinds, "#d": aDs });
      eIDs.length > 0 && filter.push({ kinds: [1], ids: eIDs });
      setIsLoading(true);
      let events = await getSubData(filter);

      events = events.data.map((event) => {
        if ([30004, 30005, 30023, 34235].includes(event.kind)) {
          let parsedEvent = getParsedRepEvent(event);
          return parsedEvent;
        }

        let l = event.tags.find((tag) => tag[0] === "l" && tag[1]);
        let kind = l
          ? event.kind === 1 && l[1] === "FLASH NEWS"
            ? 1
            : 11
          : 111;
        let tempEvent = { ...event };
        tempEvent.kind = kind;
        return tempEvent;
      });
      setContent(events);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div
      className="fit-container fx-centered"
      onClick={(e) => {
        e.stopPropagation();
        setShowFilter(false);
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="fit-container fx-scattered box-marg-s">
          <div className="fx-centered fx-start-h pointer" onClick={exit}>
            <div className="round-icon">
              <div
                className="arrow"
                style={{ transform: "rotate(90deg)" }}
              ></div>
            </div>
            <p>Back to Bookmarks</p>
          </div>
        </div>
        <div className="fx-centered fx-start-h  fx-col fx-stretch">
          <div
            className="fit-container bg-img cover-bg sc-s-18 fx-centered fx-end-v box-marg-s"
            style={{
              backgroundImage: `url(${bookmark.image})`,
              aspectRatio: "10 / 3",
            }}
          ></div>
          <div className="fx-scattered fx-col fx-start-v">
            <div className="fx-centered fx-col fx-start-v">
              <h3 className="p-caps">{bookmark.title}</h3>
              <p className="gray-c">{bookmark.description}</p>
            </div>
            <p className="gray-c">
              {bookmark.items.length} item(s) &#8226;{" "}
              <span className="orange-c">
                Edited{" "}
                <Date_ toConvert={new Date(bookmark.created_at * 1000)} />
              </span>
            </p>
          </div>
        </div>
        {content.length > 0 && !isLoading && (
          <div className="fx-centered fx-col" style={{ marginTop: "1rem" }}>
            <div className="box-marg-s fit-container fx-scattered">
              <h4 className="gray-c fx-start-h">List</h4>

              <Select
                options={bookmarkFilterOptions}
                setSelectedValue={setPostKind}
                value={postKind}
              />
            </div>
            {itemsNumber === 0 && (
              <div
                className="fx-centered fx-col fit-container"
                style={{ height: "20vh" }}
              >
                <h4>No items</h4>
                <p className="gray-c p-centered" style={{ maxWidth: "350px" }}>
                  Change your filter to get more items
                </p>
              </div>
            )}
            {content.map((item) => {
              let content = getParsedRepEvent(item);
              let naddr = [30004, 30023, 30005, 34235].includes(item.kind)
                ? nip19.naddrEncode({
                    identifier: content.d,
                    pubkey: item.pubkey,
                    kind: item.kind,
                  })
                : "";
              let nEvent = [1, 11, 111].includes(item.kind)
                ? nip19.neventEncode({
                    author: item.pubkey,
                    id: item.id,
                  })
                : "";
              if (!postKind && [30004, 30023, 30005, 34235].includes(item.kind))
                return (
                  <div
                    className="sc-s-18 fit-container fx-scattered box-pad-h-s box-pad-v-s"
                    style={{ position: "relative" }}
                    key={item.id}
                  >
                    {[30004].includes(item.kind) && (
                      <div
                        style={{
                          position: "absolute",
                          padding: "0 1rem",
                          left: "-2rem",
                          top: "50%",
                          transform: "translateY(-50%) rotate(-90deg)",
                          transformOrigin: "center",
                          backgroundColor: "var(--green-main)",
                          color: "white",
                          borderRadius: "var(--border-r-18)",
                        }}
                      >
                        <p className="p-small">curation</p>
                      </div>
                    )}
                    {[30005].includes(item.kind) && (
                      <div
                        style={{
                          position: "absolute",
                          padding: "0 1rem",
                          left: "-2rem",
                          top: "50%",
                          transform: "translateY(-50%) rotate(-90deg)",
                          transformOrigin: "center",
                          backgroundColor: "var(--orange-main)",
                          color: "white",
                          borderRadius: "var(--border-r-18)",
                        }}
                      >
                        <p className="p-small">curation</p>
                      </div>
                    )}
                    {[34235].includes(item.kind) && (
                      <div
                        style={{
                          position: "absolute",
                          padding: "0 1rem",
                          left: "-1.65rem",
                          top: "50%",
                          transform: "translateY(-50%) rotate(-90deg)",
                          transformOrigin: "center",
                          backgroundColor: "var(--blue-main)",
                          color: "white",
                          borderRadius: "var(--border-r-18)",
                        }}
                      >
                        <p className="p-small">video</p>
                      </div>
                    )}
                    <div
                      className={`fx-centered ${
                        [30004, 30005, 34235].includes(item.kind) &&
                        "box-pad-h-m"
                      }`}
                    >
                      <div
                        className="bg-img cover-bg sc-s-18"
                        style={{
                          aspectRatio: "1 / 1",
                          minWidth: "64px",
                          backgroundImage: `url(${content.image})`,
                          backgroundColor: "var(--dim-gray)",
                        }}
                      ></div>
                      <div>
                        <p className="p-one-line">{content.title}</p>
                        <p className="p-medium gray-c">
                          Edited on{" "}
                          <Date_ toConvert={new Date(item.created_at * 1000)} />
                        </p>
                      </div>
                    </div>
                    <div className="box-pad-h-s fx-centered">
                      <Link
                        target={"_blank"}
                        to={
                          (item.kind === 30023 && `/article/${naddr}`) ||
                          ([30005, 30004].includes(item.kind) &&
                            `/curations/${naddr}`) ||
                          (item.kind === 34235 && `/videos/${naddr}`)
                        }
                      >
                        <div className="share-icon-24"></div>
                      </Link>
                      <BookmarkEvent
                        pubkey={item.pubkey}
                        kind={item.kind}
                        d={content.d}
                        image={content.image}
                      />
                    </div>
                  </div>
                );
              if (
                (!postKind && item.kind === 1) ||
                (postKind && postKind === 1 && item.kind === 1)
              )
                return (
                  <div
                    className="sc-s-18 fit-container fx-scattered box-pad-h-s box-pad-v-s"
                    style={{ position: "relative" }}
                    key={item.id}
                  >
                    <div
                      style={{
                        position: "absolute",
                        padding: "0 1rem",
                        left: "-2.5rem",
                        top: "50%",
                        transform: "translateY(-50%) rotate(-90deg)",
                        transformOrigin: "center",
                        backgroundColor: "var(--black)",
                        color: "var(--white)",
                        borderRadius: "var(--border-r-18)",
                      }}
                    >
                      <p className="p-small">Paid notes</p>
                    </div>
                    <div className="fx-centered box-pad-h-m">
                      <div
                        className="sc-s-18 fx-centered"
                        style={{
                          aspectRatio: "1 / 1",
                          minWidth: "64px",
                        }}
                      >
                        <div className="news-24"></div>
                      </div>
                      <div>
                        <p className="p-one-line">
                          {item.content.substring(0, 100)}
                        </p>
                        <p className="p-medium gray-c">
                          Edited on{" "}
                          <Date_ toConvert={new Date(item.created_at * 1000)} />
                        </p>
                      </div>
                    </div>
                    <div className="box-pad-h-s fx-centered">
                      <Link target={"_blank"} to={`/flash-news/${nEvent}`}>
                        <div className="share-icon-24"></div>
                      </Link>
                      <BookmarkEvent
                        pubkey={item.id}
                        kind={item.kind}
                        itemType="e"
                      />
                    </div>
                  </div>
                );

              if (
                (!postKind && item.kind === 111) ||
                (postKind && postKind === 111 && item.kind === 111)
              )
                return (
                  <div
                    className="sc-s-18 fit-container fx-scattered box-pad-h-s box-pad-v-s"
                    style={{ position: "relative" }}
                    key={item.id}
                  >
                    <div
                      style={{
                        position: "absolute",
                        padding: "0 1rem",
                        left: "-1.4rem",
                        top: "50%",
                        transform: "translateY(-50%) rotate(-90deg)",
                        transformOrigin: "center",
                        backgroundColor: "var(--blue-main)",
                        color: "white",
                        borderRadius: "var(--border-r-18)",
                      }}
                    >
                      <p className="p-small">Note</p>
                    </div>
                    <div className="fx-centered box-pad-h-m">
                      <div
                        className="bg-img cover-bg sc-s-18"
                        style={{
                          aspectRatio: "1 / 1",
                          minWidth: "64px",
                          backgroundImage: `url(${content.image})`,
                          backgroundColor: "var(--dim-gray)",
                        }}
                      ></div>
                      <div>
                        <p className="p-one-line">
                          {item.content.substring(0, 100)}
                        </p>
                        <p className="p-medium gray-c">
                          Edited on{" "}
                          <Date_ toConvert={new Date(item.created_at * 1000)} />
                        </p>
                      </div>
                    </div>
                    <div className="box-pad-h-s fx-centered">
                      <Link target={"_blank"} to={`/notes/${nEvent}`}>
                        <div className="share-icon-24"></div>
                      </Link>
                      <BookmarkEvent pubkey={item.id} kind={1} itemType="e" />
                    </div>
                  </div>
                );
              if (item.kind === postKind)
                return (
                  <div
                    className="sc-s-18 fit-container fx-scattered box-pad-h-s box-pad-v-s"
                    style={{ position: "relative" }}
                    key={item.id}
                  >
                    {[30004].includes(item.kind) && (
                      <div
                        style={{
                          position: "absolute",
                          padding: "0 1rem",
                          left: "-2rem",
                          top: "50%",
                          transform: "translateY(-50%) rotate(-90deg)",
                          transformOrigin: "center",
                          backgroundColor: "var(--c1)",
                          color: "var(--white)",
                          borderRadius: "var(--border-r-18)",
                        }}
                      >
                        <p className="p-small">curation</p>
                      </div>
                    )}
                    <div
                      className={`fx-centered ${
                        [30004].includes(item.kind) && "box-pad-h-m"
                      }`}
                    >
                      <div
                        className="bg-img cover-bg sc-s-18"
                        style={{
                          aspectRatio: "1 / 1",
                          minWidth: "64px",
                          backgroundImage: `url(${content.image})`,
                          backgroundColor: "var(--dim-gray)",
                        }}
                      ></div>
                      <div>
                        <p className="p-one-line">{content.title}</p>
                        <p className="p-medium gray-c">
                          Edited on{" "}
                          <Date_ toConvert={new Date(item.created_at * 1000)} />
                        </p>
                      </div>
                    </div>
                    <div className="box-pad-h-s fx-centered">
                      <Link
                        target={"_blank"}
                        to={
                          item.kind === 30023
                            ? `/article/${naddr}`
                            : `/curations/${naddr}`
                        }
                      >
                        <div className="share-icon-24"></div>
                      </Link>
                      <BookmarkEvent
                        pubkey={item.pubkey}
                        kind={item.kind}
                        d={content.d}
                        image={content.image}
                      />
                    </div>
                  </div>
                );
            })}
          </div>
        )}
        {content.length === 0 && !isLoading && (
          <div
            className="fx-centered fx-col fit-container"
            style={{ height: "30vh" }}
          >
            <h4>No items</h4>
            <p className="gray-c p-centered" style={{ maxWidth: "350px" }}>
              You can bookmark articles and curation in one set
            </p>
          </div>
        )}
        {isLoading && (
          <div className="fx-centered fit-container" style={{ height: "30vh" }}>
            <LoadingLogo />
          </div>
        )}
      </div>
    </div>
  );
};

const ManageInterest = ({ exit }) => {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userInterestList = useSelector((state) => state.userInterestList);
  const [interests, setInterest] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const oldState = useMemo(() => {
    return getInterestList(userInterestList);
  }, [userInterestList]);
  const isChanged = useMemo(() => {
    return JSON.stringify(interests) !== JSON.stringify(oldState);
  }, [interests, oldState]);

  useEffect(() => {
    let tempList = getInterestList(userInterestList);
    setInterest(tempList);
    setIsLoading(false);
  }, [userInterestList]);

  const handleItemInList = (action, index) => {
    let tempArray = structuredClone(interests);
    if (action) {
      tempArray[index].toDelete = false;
      setInterest(tempArray);
    } else {
      tempArray[index].toDelete = true;
      setInterest(tempArray);
    }
  };

  const saveInterestList = async () => {
    try {
      if (isLoading || !isChanged) return;
      setIsLoading(true);
      let tags = interests
        .filter((_) => !_.toDelete)
        .map((_) => ["t", _.item.toLowerCase()]);

      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10015,
          content: "",
          tags: tags,
          allRelays: [],
        })
      );
      return true;
    } catch (err) {
      setIsLoading(false);
      console.log(err);
      return false;
    }
  };

  const addItemToList = (item) => {
    let tempArray = getInterestList([
      item.toLowerCase(),
      ...new Set([...interests.map((_) => _.item)]),
    ]);
    setInterest(tempArray);
    if (newInterest) setNewInterest("");
  };

  const handleItemsFromSuggestion = (item, isAdded) => {
    if (isAdded) {
      let index = interests.findIndex((_) => _.item === item.toLowerCase());
      let tempArray = structuredClone(interests);
      tempArray.splice(index, 1);
      setInterest(tempArray);
    } else {
      addItemToList(item);
    }
  };

  const handleDragEnd = (res) => {
    if (!res.destination) return;
    let tempArr = structuredClone(interests);
    let [reorderedArr] = tempArr.splice(res.source.index, 1);
    tempArr.splice(res.destination.index, 0, reorderedArr);
    setInterest(tempArr);
  };

  return (
    <div className="fx-centered fit-container fx-col ">
      <div className="fit-container fx-scattered box-marg-s box-pad-h ">
        <div className="fx-centered fx-start-h pointer" onClick={exit}>
          <div className="round-icon">
            <div className="arrow" style={{ transform: "rotate(90deg)" }}></div>
          </div>
          <p>Back to interests</p>
        </div>
        <button
          className={`btn ${isChanged ? "btn-normal" : "btn-disabled"}`}
          onClick={saveInterestList}
        >
          {isLoading ? <LoadingDots /> : "Update list"}
        </button>
      </div>
      <div className="fit-container fx-centered fx-col box-pad-h">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newInterest) addItemToList(newInterest);
          }}
          className="if fit-container fx-scattered"
        >
          <div className="search-24"></div>
          <input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            type="text"
            placeholder="Add your interest"
            className="if ifs-full if-no-border"
            style={{ padding: 0 }}
          />
          {newInterest && <p className="gray-c slide-down">&#8626;</p>}
        </form>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="set-carrousel">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={{
                  borderRadius: "var(--border-r-18)",
                  transition: ".2s ease-in-out",
                  height: "100%",
                  ...provided.droppableProps.style,
                }}
                className="box-pad-v-m fit-container fx-centered fx-start-h fx-start-v fx-col"
              >
                {interests.map((item, index) => {
                  return (
                    <Draggable
                      key={index}
                      draggableId={`${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                          style={{
                            borderRadius: "var(--border-r-18)",
                            boxShadow: snapshot.isDragging
                              ? "14px 12px 105px -41px rgba(0, 0, 0, 0.55)"
                              : "",
                            ...provided.draggableProps.style,
                            overflow: "visible",
                            backgroundColor: item.toDelete
                              ? "var(--red-side)"
                              : "transparent",
                            borderBottom: "1px solid var(--very-dim-gray)",
                            gap: 0,
                          }}
                          className="fx-scattered  sc-s-18 box-pad-h-m box-pad-v-m fit-container"
                        >
                          <div className="fx-centered">
                            <div
                              style={{
                                minWidth: `38px`,
                                aspectRatio: "1/1",
                                position: "relative",
                              }}
                              className="sc-s-18 fx-centered"
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  zIndex: 2,
                                  backgroundImage: `url(${item.icon})`,
                                }}
                                className="bg-img cover-bg  fit-container fit-height"
                              ></div>
                              <p
                                className={"p-bold p-caps p-big"}
                                style={{ position: "relative", zIndex: 1 }}
                              >
                                {item.item.charAt(0)}
                              </p>
                            </div>
                            <p className="p-caps">{item.item}</p>
                          </div>
                          <div className="fx-centered">
                            {!item.toDelete && (
                              <div
                                onClick={() => handleItemInList(false, index)}
                                className="round-icon-small"
                              >
                                <div className="trash"></div>
                              </div>
                            )}
                            {item.toDelete && (
                              <div
                                onClick={() => handleItemInList(true, index)}
                                className="round-icon-small"
                              >
                                <div className="undo"></div>
                              </div>
                            )}
                            <div
                              className="drag-el"
                              style={{
                                minWidth: "16px",
                                aspectRatio: "1/1",
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                  // return (
                  //   <div
                  //     className="fx-scattered  sc-s-18 box-pad-h-m box-pad-v-m fit-container"
                  //     style={{
                  //       overflow: "visible",
                  //       backgroundColor: item.toDelete
                  //         ? "var(--red-side)"
                  //         : "transparent",
                  //       borderBottom: "1px solid var(--very-dim-gray)",
                  //       gap: 0,
                  //     }}
                  //     key={index}
                  //   >
                  //     <div className="fx-centered">
                  //       <div
                  //         style={{
                  //           minWidth: `38px`,
                  //           aspectRatio: "1/1",
                  //           position: "relative",
                  //         }}
                  //         className="sc-s-18 fx-centered"
                  //       >
                  //         <div
                  //           style={{
                  //             position: "absolute",
                  //             left: 0,
                  //             top: 0,
                  //             zIndex: 2,
                  //             backgroundImage: `url(${item.icon})`,
                  //           }}
                  //           className="bg-img cover-bg  fit-container fit-height"
                  //         ></div>
                  //         <p
                  //           className={"p-bold p-caps p-big"}
                  //           style={{ position: "relative", zIndex: 1 }}
                  //         >
                  //           {item.item.charAt(0)}
                  //         </p>
                  //       </div>
                  //       <p className="p-caps">{item.item}</p>
                  //     </div>
                  //     <div>
                  //       {!item.toDelete && (
                  //         <div
                  //           onClick={() => handleItemInList(false, index)}
                  //           className="round-icon-small"
                  //         >
                  //           <div className="trash"></div>
                  //         </div>
                  //       )}
                  //       {item.toDelete && (
                  //         <div
                  //           onClick={() => handleItemInList(true, index)}
                  //           className="round-icon-small"
                  //         >
                  //           <div className="undo"></div>
                  //         </div>
                  //       )}
                  //     </div>
                  //   </div>
                  // );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* <p className="p-big p-bold">Suggestions</p> */}
      <InterestSuggestionsCards
        list={interests.map((_) => _.item)}
        addItemToList={handleItemsFromSuggestion}
      />
    </div>
  );
};

{
  /* <div
  className=" fx-centered fx-col fx-start-v extras-homepage"
  style={{
    position: "sticky",
    top: 0,
    // backgroundColor: "var(--white)",
    zIndex: "100",
    flex: 1,
  }}
>
  <div className="sticky fit-container">
    <SearchbarNOSTR />
  </div>
  <ImportantFlashNews />
  <Footer />
</div>; */
}
