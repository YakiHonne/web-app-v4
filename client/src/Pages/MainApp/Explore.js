import React, { Fragment, useEffect, useRef, useState } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import ArrowUp from "../../Components/ArrowUp";
import { Helmet } from "react-helmet";
import { SelectTabs } from "../../Components/Main/SelectTabs";
import Slider from "../../Components/Slider";
import { useSelector } from "react-redux";
import {
  getParsedRepEvent,
  removeEventsDuplicants,
  sortEvents,
} from "../../Helpers/Encryptions";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import { saveUsers } from "../../Helpers/DB";
import { getSubData } from "../../Helpers/Controlers";
import SmallButtonDropDown from "../../Components/Main/SmallButtonDropDown";
import LoadingLogo from "../../Components/LoadingLogo";
import UserToFollowSuggestionsCards from "../../Components/SuggestionsCards/UserToFollowSuggestionsCards";
import { getNotesByTag, getTrendingNotes1h } from "../../Helpers/WSInstance";
import ContentSuggestionsCards from "../../Components/SuggestionsCards/ContentSuggestionCards";
import InterestSuggestionsCards from "../../Components/SuggestionsCards/InterestSuggestionsCards";
import DonationBoxSuggestionCards from "../../Components/SuggestionsCards/DonationBoxSuggestionCards";
import ProfileShareSuggestionCards from "../../Components/SuggestionsCards/ProfileShareSuggestionCards";
import { useTranslation } from "react-i18next";

const MixEvents = (articles, curations, videos) => {
  const interleavedArray = [];

  const length = Math.max(articles.length, curations.length, videos.length);

  for (let i = 0; i < length; i++) {
    if (i < articles.length) {
      interleavedArray.push(articles[i]);
    }
    if (i < curations.length) {
      interleavedArray.push(curations[i]);
    }
    if (i < videos.length) {
      interleavedArray.push(videos[i]);
    }
  }
  return interleavedArray;
};

export default function Explore() {
  const userInterestList = useSelector((state) => state.userInterestList);
  const userKeys = useSelector((state) => state.userKeys);
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("explore");
  const [smallButtonDropDownOptions, setSmallButtonDropDownOptions] = useState([
    "explore",
    "following",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const extrasRef = useRef(null);
  const tabs = [t("AR9ctVs"), t("AesMg52"), t("AVysZ1s"), t("AStkKfQ")];
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
    if (userKeys && smallButtonDropDownOptions.length > 1)
      setSmallButtonDropDownOptions(["explore", "following"]);
    else setSmallButtonDropDownOptions(["explore"]);
  }, [userKeys]);

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Discover</title>
        <meta name="description" content={"Discover media content on nostr"} />
        <meta
          property="og:description"
          content={"Discover media content on nostr"}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="700" />
        <meta property="og:url" content={`https://yakihonne.com/discover`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content={"Yakihonne | Discover"} />
        <meta property="twitter:title" content={"Yakihonne | Discover"} />
        <meta
          property="twitter:description"
          content={"Discover media content on nostr"}
        />
      </Helmet>

      <div className="fit-container fx-centered">
        <div className="main-container">
          <SidebarNOSTR />
          <main className="main-page-nostr-container">
            <ArrowUp />
            <div
              className="fit-container fx-centered fx-start-h fx-start-v"
              style={{ gap: 0 }}
            >
              <div
                className={`fit-container fx-centered fx-start-v fx-wrap  fit-container mobile-container`}
                style={{
                  position: "relative",
                }}
              >
                <div
                  className="fit-container sticky fx-centered box-pad-h fx-col"
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--very-dim-gray)",
                  }}
                >
                  <Slider
                    smallButtonDropDown={
                      <SmallButtonDropDown
                        options={smallButtonDropDownOptions}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                      />
                    }
                    items={[
                      ...userInterestList.map((tag, index) => {
                        return (
                          <div
                            className={
                              "btn sticker-gray-black p-caps fx-centered"
                            }
                            style={{
                              backgroundColor:
                                selectedCategory === tag ? "" : "transparent",
                              color:
                                selectedCategory === tag ? "" : "var(--gray)",
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

                <div
                  className=" main-middle feed-container"
                  style={{
                    overflow: "scroll",
                    marginBottom: "4rem",
                    height: "calc(100dvh - 4.375rem)",
                  }}
                >
                  <ExploreFeed
                    selectedTab={selectedTab}
                    selectedCategory={selectedCategory}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    pointerEvents: isLoading ? "none" : "auto",
                    zIndex: 101,
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
  );
}

const ExploreFeed = ({
  selectedCategory,
  selectedTab,
  isLoading,
  setIsLoading,
}) => {
  const userKeys = useSelector((state) => state.userKeys);
  const userInterestList = useSelector((state) => state.userInterestList);
  const userFollowings = useSelector((state) => state.userFollowings);
  const { t } = useTranslation();
  const [content, setContent] = useState([]);
  const [timestamp, setTimestamp] = useState(false);
  const [lastEventsTimestamps, setLastEventsTimestamps] = useState({
    articles: undefined,
    curations: undefined,
    videos: undefined,
  });
  const [notesSuggestions, setNotesSuggestions] = useState([]);
  const [isEndOfQuerying, setIsEndOfQuerying] = useState(false);

  useEffect(() => {
    const initSub = async () => {
      setIsLoading(true);
      let dateCheckerArts = lastEventsTimestamps.articles
        ? lastEventsTimestamps.articles - 86400
        : Math.floor(Date.now() / 1000) - 86400;
      let dateCheckerCurations = lastEventsTimestamps.curations
        ? lastEventsTimestamps.curations - 86400
        : Math.floor(Date.now() / 1000) - 86400;
      let dateCheckerVideos = lastEventsTimestamps.videos
        ? lastEventsTimestamps.videos - 86400
        : Math.floor(Date.now() / 1000) - 86400;
      const { artsFilter, curationsFilter, videosFilter } = getFilter();
      let [articles, curations, videos] = await Promise.all([
        getSubData(artsFilter),
        getSubData(curationsFilter),
        getSubData(videosFilter),
      ]);

      let articles_ = sortEvents(articles.data).filter(
        (_) => _.created_at > dateCheckerArts
      );
      let curations_ = sortEvents(curations.data).filter(
        (_) => _.created_at > dateCheckerCurations
      );
      let videos_ = sortEvents(videos.data).filter(
        (_) => _.created_at > dateCheckerVideos
      );

      articles_ = articles_.length === 0 ? articles.data : articles_;
      curations_ = curations_.length === 0 ? curations.data : curations_;
      videos_ = videos_.length === 0 ? videos.data : videos_;

      setLastEventsTimestamps({
        articles:
          articles_.length > 0
            ? articles_[articles_.length - 1].created_at - 1
            : undefined,
        curations:
          curations_.length > 0
            ? curations_[curations_.length - 1].created_at - 1
            : undefined,
        videos:
          videos_.length > 0
            ? videos_[videos_.length - 1].created_at - 1
            : undefined,
      });

      if (
        articles_.length === 0 &&
        curations_.length === 0 &&
        videos_.length === 0
      )
        setIsEndOfQuerying(true);
      setContent((prev) =>
        removeEventsDuplicants([
          ...prev,
          ...MixEvents(articles_, curations_, videos_).map((event) =>
            getParsedRepEvent(event)
          ),
        ]).filter((event) => {
          if (
            event.title &&
            !([30004, 30005].includes(event.kind) && event.items.length === 0)
          )
            return event;
        })
      );
      saveUsers([
        ...new Set([
          ...articles.pubkeys,
          ...curations.pubkeys,
          ...videos.pubkeys,
        ]),
      ]);
      setIsLoading(false);
      return;
    };
    if (timestamp) initSub();
  }, [timestamp]);

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || isEndOfQuerying) return;
      let container = document.querySelector(".feed-container");
      if (!container) return;
      if (
        container.scrollHeight - container.scrollTop - 60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      setTimestamp(Date.now());
    };

    document
      .querySelector(".feed-container")
      ?.addEventListener("scroll", handleScroll);

    return () =>
      document
        .querySelector(".feed-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  useEffect(() => {
    setContent([]);
    setLastEventsTimestamps({
      articles: undefined,
      curations: undefined,
      videos: undefined,
    });
    setTimestamp(Date.now());
    setIsEndOfQuerying(false);
  }, [selectedCategory, selectedTab]);

  useEffect(() => {
    let checkHiddenSuggestions = localStorage.getItem("hsuggest2");
    const fetchContentSuggestions = async () => {
      if (["explore", "following"].includes(selectedCategory)) {
        let data = await getTrendingNotes1h();
        setNotesSuggestions(data.slice(0, 10));
        saveUsers(data.splice(0, 10).map((event) => event.pubkey));
      }
      if (!["explore", "following"].includes(selectedCategory)) {
        let data = await getNotesByTag(selectedCategory);
        setNotesSuggestions(data);
        saveUsers(data.map((event) => event.pubkey));
      }
    };
    if (!checkHiddenSuggestions) fetchContentSuggestions();
  }, [selectedCategory]);

  // useEffect(() => {
  //   if (selectedCategory === "following") {
  //     setContent([]);
  //     setLastEventsTimestamps({
  //       articles: undefined,
  //       curations: undefined,
  //       videos: undefined,
  //     });
  //     setTimestamp(Date.now());
  //   }
  // }, [userFollowings]);

  const getFilter = () => {
    let tag = !["explore", "following"].includes(selectedCategory)
      ? [selectedCategory]
      : undefined;
    let authors =
      selectedCategory === "following"
        ? [userKeys.pub, ...userFollowings]
        : undefined;
    return {
      artsFilter: [0, 1].includes(selectedTab)
        ? [
            {
              kinds: [30023],
              limit: 20,
              "#t": tag,
              authors,
              until: lastEventsTimestamps.articles,
            },
          ]
        : [],
      curationsFilter: [0, 2].includes(selectedTab)
        ? [
            {
              kinds: [30004, 30005],
              limit: 20,
              "#t": tag,
              authors,
              until: lastEventsTimestamps.curations,
            },
          ]
        : [],
      videosFilter: [0, 3].includes(selectedTab)
        ? [
            {
              kinds: [34235],
              limit: 20,
              "#t": tag,
              authors,
              until: lastEventsTimestamps.videos,
            },
          ]
        : [],
    };
  };

  const getContentCard = (index) => {
    if (index === 15)
      return (
        <ContentSuggestionsCards
          tag={
            !["explore", "following"].includes(selectedCategory)
              ? selectedCategory
              : false
          }
          content={notesSuggestions}
          kind="notes"
        />
      );
    if (index === 30) return <UserToFollowSuggestionsCards />;
    if (index === 45)
      return (
        <InterestSuggestionsCards
          limit={5}
          list={userInterestList}
          update={true}
          expand={true}
        />
      );
    if (index === 60) return <DonationBoxSuggestionCards />;
    if (index === 75) return <ProfileShareSuggestionCards />;
  };

  return (
    <div className="fit-container fx-centered fx-col " style={{ gap: 0 }}>
      {content.map((item, index) => {
        return (
          <Fragment key={item.id}>
            <div className="fit-container fx-centered">
              <RepEventPreviewCard item={item} />
            </div>
            {getContentCard(index)}
          </Fragment>
        );
      })}
      {content.length === 0 && !isLoading && (
        <div
          className="fit-container fx-centered fx-col"
          style={{ height: "30vh" }}
        >
          <div className="search"></div>
          <h4>{t("AUrhqmn")}</h4>
          <p className="gray-c">{t("AtL4qoU")}</p>
        </div>
      )}
      <div className="box-pad-v"></div>
      {isLoading && (
        <div
          className="fit-container box-pad-v fx-centered fx-col"
          style={{ height: "30vh" }}
        >
          <LoadingLogo />
        </div>
      )}
    </div>
  );
};
