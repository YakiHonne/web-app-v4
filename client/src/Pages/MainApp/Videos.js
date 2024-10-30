import React, { useMemo, useRef } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { useState } from "react";
import { useEffect } from "react";
import { nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import Date_ from "../../Components/Date_";
import { Link, useNavigate } from "react-router-dom";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import {
  filterRelays,
  getBech32,
  getEmptyuserMetadata,
} from "../../Helpers/Encryptions";
import Footer from "../../Components/Footer";
import bannedList from "../../Content/BannedList";
import ArrowUp from "../../Components/ArrowUp";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import TopCreators from "../../Components/Main/TopCreators";
import { getNoteTree, getVideoContent } from "../../Helpers/Helpers";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import axios from "axios";
import { useSelector } from "react-redux";
import { getUser, handleReceivedEvents } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";

const getTopCreators = (videos) => {
  if (!videos) return [];
  let netCreators = videos.filter((creator, index, videos) => {
    if (index === videos.findIndex((item) => item.pubkey === creator.pubkey))
      return creator;
  });

  let tempCreators = [];

  for (let creator of netCreators) {
    let stats = getCreatorStats(creator.pubkey, videos);
    tempCreators.push({
      pubkey: creator.pubkey,
      name: getBech32("npub", creator.pubkey).substring(0, 10),
      img: "",
      articles_number: stats.articles_number,
    });
  }

  return (
    tempCreators
      .sort(
        (curator_1, curator_2) =>
          curator_2.articles_number - curator_1.articles_number
      )
      .splice(0, 6) || []
  );
};

const getCreatorStats = (pubkey, videos) => {
  let articles_number = 0;

  for (let creator of videos) {
    if (creator.pubkey === pubkey) {
      articles_number += 1;
    }
  }
  return {
    articles_number,
  };
};

export default function Videos() {
  const userRelays = useSelector((state) => state.userRelays);
  const userMutedList = useSelector((state) => state.userMutedList);
  
  const [activeRelay, setActiveRelay] = useState("");
  const [videos, setVideos] = useState([]);
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [landscapeMode, setLandscapeMode] = useState(true);
  const [vidsLastEventTime, setVidsLastEventTime] = useState(undefined);
  const extrasRef = useRef(null);
  const topCreators = useMemo(() => {
    return getTopCreators(videos);
  }, [videos]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoaded(false);
        setIsLoading(true);

        let { filter } = getArtsFilter();

        let events = [];
        let sub = ndkInstance.subscribe(filter, {
          closeOnEose: true,
          cacheUsage: "CACHE_FIRST",
        });

        sub.on("event", (event) => {
          let parsedEvent = getVideoContent(event);
          setVideos((prev) => {
            return handleReceivedEvents(prev, parsedEvent);
          });
          events.push(parsedEvent);
        });
        sub.on("eose", () => {
          onEOSE(events);
        });
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    if (Array.isArray(userMutedList)) fetchData();
  }, [vidsLastEventTime, activeRelay, landscapeMode, userMutedList]);

  useEffect(() => {
    const handleScroll = () => {
      if (videos.length === 0) return;
      if (
        document.querySelector(".main-page-nostr-container").scrollHeight -
          document.querySelector(".main-page-nostr-container").scrollTop -
          60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      setVidsLastEventTime(videos[videos.length - 1].created_at);
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoaded]);

  useEffect(() => {
    const getExternalData = async () => {
      try {
        let [trendingNotes] = await Promise.all([
          axios.get("https://api.nostr.band/v0/trending/videos"),
        ]);

        if (trendingNotes.data?.videos) {
          let tempTrendingNotes = await Promise.all(
            trendingNotes.data?.videos.slice(0, 5).map(async (item) => {
              let note_tree = await getNoteTree(item.event.content);
              let author_parsed = getEmptyuserMetadata(item.pubkey);
              let nEvent = nip19.neventEncode({
                id: item.id,
                author: item.pubkey,
                relays: item.relays,
              });
              try {
                author_parsed = JSON.parse(item.author.content);
              } catch (err) {
                console.log(err);
              }
              return {
                author_parsed,
                ...item,
                note_tree,
                nEvent,
              };
            })
          );
          setTrendingNotes(tempTrendingNotes);
        }
      } catch (err) {
        console.log(err);
      }
    };
    getExternalData();
  }, []);

  const getArtsFilter = () => {
    let relaysToFetchFrom;
    let filter;

    if (activeRelay) relaysToFetchFrom = [activeRelay];
    if (!activeRelay)
      relaysToFetchFrom = userRelays

    filter = [
      {
        kinds: landscapeMode ? [34235] : [34236],
        limit: 50,
        until: vidsLastEventTime,
      },
    ];
    return {
      relaysToFetchFrom,
      filter,
    };
  };

  const onEOSE = (events) => {
    if (events) {
      let filteredEvents = events.filter((event) => event);
      saveUsers(filteredEvents.map((item) => item.pubkey));
    }
    setIsLoaded(true);
    setIsLoading(false);
  };

  return (
    <>
      <div>
        <Helmet>
          <title>Yakihonne | Videos</title>
          <meta
            name="description"
            content={"Browse all published videos on Nostr"}
          />
          <meta
            property="og:description"
            content={"Browse all published videos on Nostr"}
          />

          <meta property="og:url" content={`https://yakihonne.com/videos`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | Videos" />
          <meta property="twitter:title" content="Yakihonne | Videos" />
          <meta
            property="twitter:description"
            content={"Browse all published videos on Nostr"}
          />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <ArrowUp />
            <main
              className={`main-page-nostr-container`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="fx-centered fit-container fx-start-h fx-start-v">
                <div style={{ flex: 1.8 }} className="box-pad-h-m">
                  <div className="box-pad-v-m fit-container fx-scattered sticky">
                    <div className="fx-centered fx-col fx-start-v">
                      <div className="fx-centered">
                        <h4>{videos.length} Videos</h4>
                      </div>
                    </div>
                  </div>
                  <div
                    className="fit-container fx-scattered fx-wrap fx-stretch"
                    style={{ rowGap: "20px" }}
                  >
                    {videos.length > 0 && (
                      <>
                        {videos.map((video) => {
                          return (
                            <Link
                              key={video.id}
                              className=" fx-start-h fx-start-v fx-centered fx-col"
                              style={{ flexBasis: "48%" }}
                              to={`/videos/${video.naddr}`}
                            >
                              <div
                                className="sc-s-18 bg-img cover-bg fit-container fx-centered fx-end-h fx-end-v box-pad-h-s box-pad-v-s"
                                style={{
                                  aspectRatio: "16/9",
                                  backgroundImage: `url(${video.image})`,
                                  border: "none",
                                }}
                              >
                                <div
                                  className="sticker sticker-small"
                                  style={{
                                    backgroundColor: "black",
                                    color: "white",
                                  }}
                                >
                                  {video.duration}
                                </div>
                              </div>
                              <p className="p-two-lines">{video.title}</p>
                              <div className="fit-container fx-centered fx-start-h">
                                <AuthorPreview pubkey={video.pubkey} />
                                <p className="p-small gray-c">&#9679;</p>
                                <p className="gray-c p-medium">
                                  <Date_
                                    toConvert={
                                      new Date(video.published_at * 1000)
                                    }
                                  />
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                        <div style={{ flex: "1 1 400px" }}></div>
                        <div style={{ flex: "1 1 400px" }}></div>
                        <div style={{ flex: "1 1 400px" }}></div>
                      </>
                    )}
                    {isLoading && (
                      <div
                        className="fit-container fx-centered fx-col"
                        style={{ height: "20vh" }}
                      >
                        <p>Loading videos</p>
                        <LoadingDots />
                      </div>
                    )}
                    {videos.length === 0 && !isLoading && (
                      <div
                        className="fit-container fx-centered fx-col"
                        style={{ height: "40vh" }}
                      >
                        <h4>No videos were found!</h4>
                        <p className="gray-c p-centered">
                          No videos were found in this relay
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="box-pad-h-s fx-centered fx-col fx-start-v sticky extras-homepage"
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
                    zIndex: "100",
                    flex: 1,
                  }}
                  ref={extrasRef}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>
                  <div
                    className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      rowGap: "24px",
                      border: "none",
                    }}
                  >
                    <div className="fx-centered fx-start-h">
                      <h4>Top creators</h4>
                      {isLoading && (
                        <p className="gray-c p-medium">(Getting stats...)</p>
                      )}
                    </div>
                    <TopCreators top_creators={topCreators} kind={"videos"} />
                  </div>
                  {trendingNotes.length > 0 && (
                    <div
                      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v box-marg-s"
                      style={{
                        backgroundColor: "var(--c1-side)",
                        rowGap: "24px",
                        border: "none",
                      }}
                    >
                      <div className="fx-centered fx-start-h">
                        <h4>Trending notes</h4>
                      </div>
                      <div className="fit-container fx-col fx-centered">
                        {trendingNotes.map((note) => {
                          return (
                            <div
                              className="fit-container fx-centered fx-col fx-start-v"
                              key={note.id}
                            >
                              <div className="fit-container fx-scattered">
                                <div className="fx-centered">
                                  <UserProfilePicNOSTR
                                    size={30}
                                    mainAccountUser={false}
                                    ring={false}
                                    user_id={note.pubkey}
                                    img={note.author_parsed.picture}
                                  />
                                  <div>
                                    <p className="p-medium">
                                      {note.author_parsed.display_name}
                                    </p>
                                    <p className="p-medium gray-c">
                                      @{note.author_parsed.name}
                                    </p>
                                  </div>
                                </div>
                                <Link to={`/notes/${note.nEvent}`}>
                                  <div className="share-icon"></div>
                                </Link>
                              </div>
                              <div className="fit-container">
                                {note.note_tree}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <Footer />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const AuthorPreview = ({ pubkey }) => {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [author, setAuthor] = useState({
    pubkey,
    name: getBech32("npub", pubkey).substring(0, 10),
    picture: "",
  });
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!isLoaded) {
      let auth = getUser(pubkey);
      if (auth) {
        setAuthor(auth);
        setIsLoaded(true);
      }
    }
  }, [nostrAuthors]);

  return (
    <div className="fx-centered">
      <UserProfilePicNOSTR
        size={16}
        ring={false}
        img={author.picture}
        mainAccountUser={false}
        user_id={author.pubkey}
      />

      <p className="p-one-line p-medium">{author.name}</p>
    </div>
  );
};
