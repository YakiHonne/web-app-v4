import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import ArrowUp from "../../Components/ArrowUp";
import { Helmet } from "react-helmet";
import { SelectTabs } from "../../Components/Main/SelectTabs";
import Slider from "../../Components/Slider";
import { useSelector } from "react-redux";
import { ndkInstance } from "../../Helpers/NDKInstance";
import {
  getParsedRepEvent,
  removeEventsDuplicants,
  sortEvents,
} from "../../Helpers/Encryptions";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import VideosPreviewCards from "../../Components/Main/VideosPreviewCards";
import { saveUsers } from "../../Helpers/DB";
import LoadingDots from "../../Components/LoadingDots";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import TrendingUsers from "../../Components/Main/TrendingUsers";
import RecentTags from "../../Components/Main/RecentTags";
import Footer from "../../Components/Footer";
import { getSubData } from "../../Helpers/Controlers";
import SmallButtonDropDown from "../../Components/Main/SmallButtonDropDown";

const tabs = ["All", "Articles", "Curations", "Videos"];
const smallButtonDropDownOptions = ["discover", "followings"];

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
  const sideContentRef = useRef(null);
  const userInterestList = useSelector((state) => state.userInterestList);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("discover");
  const [isLoading, setIsLoading] = useState(true);
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
                className={`fit-container fx-centered fx-start-v fx-wrap  fit-container`}
                style={{
                  height: "100vh",
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
                  {/* <div
                  className="sticky fit-container " 
                  style={{
                    padding: "1rem",
                    pointerEvents: isLoading ? "none" : "auto",
                  }}
                > */}
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
                  className="fit-height  main-middle feed-container"
                  style={{ overflow: "scroll", marginBottom: "4rem" }}
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
                
                <TrendingUsers />
                <RecentTags />
                <Footer />
              </div> */}
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
  const userFollowings = useSelector((state) => state.userFollowings);
  const [content, setContent] = useState([]);
  // const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(false);
  const [lastEventsTimestamps, setLastEventsTimestamps] = useState({
    articles: undefined,
    curations: undefined,
    videos: undefined,
  });
  const [isEndOfQuerying, setIsEndOfQuerying] = useState(false);

  useEffect(() => {
    const initSub = async () => {
      setIsLoading(true);
      const { artsFilter, curationsFilter, videosFilter } = getFilter();
      let [articles, curations, videos] = await Promise.all([
        getSubData(artsFilter),
        getSubData(curationsFilter),
        getSubData(videosFilter),
      ]);

      setLastEventsTimestamps({
        articles:
          articles.data.length > 0
            ? articles.data[articles.data.length - 1].created_at - 1
            : undefined,
        curations:
          curations.data.length > 0
            ? curations.data[curations.data.length - 1].created_at - 1
            : undefined,
        videos:
          videos.data.length > 0
            ? videos.data[videos.data.length - 1].created_at - 1
            : undefined,
      });

      if (
        articles.data.length === 0 &&
        curations.data.length === 0 &&
        videos.data.length === 0
      )
        setIsEndOfQuerying(true);
      setContent((prev) =>
        removeEventsDuplicants([
          ...prev,
          ...MixEvents(articles.data, curations.data, videos.data).map(
            (event) => getParsedRepEvent(event)
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

  const getFilter = () => {
    let tag = !["discover", "followings"].includes(selectedCategory)
      ? [selectedCategory]
      : undefined;
    let authors =
      selectedCategory === "followings" ? userFollowings : undefined;
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

  return (
    <div className="fit-container fx-centered fx-col ">
      {content.map((item) => {
        // if (
        //   item.title &&
        //   !([30004, 30005].includes(item.kind) && item.items.length === 0)
        // )
        return (
          <div key={item.id} className="fit-container fx-centered">
            <RepEventPreviewCard item={item} />
          </div>
        );
      })}
      {content.length === 0 && !isLoading && (
        <div
          className="fit-container fx-centered fx-col"
          style={{ height: "30vh" }}
        >
          <div className="search"></div>
          <h4>No more data</h4>
          <p className="gray-c">Nothing to show here</p>
        </div>
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
