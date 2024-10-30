import React, { useMemo } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { useState } from "react";
import { useEffect } from "react";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import { getParsedRepEvent } from "../../Helpers/Encryptions";
import Footer from "../../Components/Footer";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import ArrowUp from "../../Components/ArrowUp";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import TopCreators from "../../Components/Main/TopCreators";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { handleReceivedEvents } from "../../Helpers/Controlers";

const getTopCreators = (posts) => {
  if (!posts) return [];
  let netCreators = posts.filter((creator, index, posts) => {
    if (index === posts.findIndex((item) => item.pubkey === creator.pubkey))
      return creator;
  });

  let tempCreators = [];

  for (let creator of netCreators) {
    let stats = getCreatorStats(creator.pubkey, posts);
    tempCreators.push({
      ...getEmptyuserMetadata(creator.pubkey),
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

const getCreatorStats = (pubkey, posts) => {
  let articles_number = 0;

  for (let creator of posts) {
    if (creator.author_pubkey === pubkey) {
      articles_number += 1;
    }
  }
  return {
    articles_number,
  };
};

export default function Articles() {
  const [activeRelay, setActiveRelay] = useState("");
  const [posts, setPosts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [artsLastEventTime, setArtsLastEventTime] = useState(undefined);
  const topCreators = useMemo(() => {
    return getTopCreators(posts);
  }, [posts]);

  useEffect(() => {
    setIsLoaded(false);
    setIsLoading(true);
    let { filter } = getArtsFilter();
    let events = [];

    let subscription = ndkInstance.subscribe(filter, {
      cacheUsage: "CACHE_FIRST",
    });

    subscription.on("event", (event) => {
      let parsedEvent = getParsedRepEvent(event);
      setPosts((prev) => {
        return handleReceivedEvents(prev, parsedEvent);
      });
      events.push(parsedEvent.pubkey);
    });
    subscription.on("close", () => {
      saveUsers(events);
      setIsLoading(false);
    });

    let timer = setTimeout(() => subscription.stop(), 3000);

    return () => {
      if (subscription) subscription.stop();
      clearTimeout(timer);
    };
  }, [artsLastEventTime]);

  useEffect(() => {
    const handleScroll = () => {
      if (posts.length === 0) return;
      if (
        document.querySelector(".main-page-nostr-container").scrollHeight -
          document.querySelector(".main-page-nostr-container").scrollTop -
          60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }

      setArtsLastEventTime(posts[posts.length - 1].created_at);
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  const getArtsFilter = () => {
    let filter = [{ kinds: [30023], limit: 50, until: artsLastEventTime }];
    return {
      filter,
    };
  };

  return (
    <>
      <div>
        <Helmet>
          <title>Yakihonne | My articles</title>
          <meta
            name="description"
            content={"Browse all published articles on Nostr"}
          />
          <meta
            property="og:description"
            content={"Browse all published articles on Nostr"}
          />

          <meta property="og:url" content={`https://yakihonne.com/articles`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | Articles" />
          <meta property="twitter:title" content="Yakihonne | Articles" />
          <meta
            property="twitter:description"
            content={"Browse all published articles on Nostr"}
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
                <div
                  style={{ width: "min(100%,700px)" }}
                  className="box-pad-h-m"
                >
                  <div className="box-pad-v-m fit-container fx-scattered sticky">
                    <div className="fx-centered fx-col fx-start-v">
                      <div className="fx-centered">
                        <h4>{posts.length} Articles</h4>
                      </div>
                    </div>
                  </div>
                  <div className="fit-container fx-scattered fx-wrap fx-stretch">
                    {posts.length > 0 && (
                      <>
                        {posts.map((post) => {
                          if (post.kind === 30023 && post.title)
                            return (
                              <div
                                key={post.id}
                                className="fit-container fx-centered "
                              >
                                <RepEventPreviewCard item={post} />
                              </div>
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
                        <p>Loading articles</p>
                        <LoadingDots />
                      </div>
                    )}
                    {posts.length === 0 && !isLoading && (
                      <div
                        className="fit-container fx-centered fx-col"
                        style={{ height: "40vh" }}
                      >
                        <h4>No articles were found!</h4>
                        <p className="gray-c p-centered">
                          No articles were found in this relay
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="box-pad-h-s fx-centered fx-col fx-start-v sticky extras-homepage"
                  style={{
                    position: "sticky",

                    zIndex: "100",
                    width: "min(100%, 400px)",
                  }}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>
                  <div
                    className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v box-marg-s"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      rowGap: "24px",
                      border: "none",
                      overflow: "visible",
                    }}
                  >
                    <div className="fx-centered fx-start-h">
                      <h4>Top creators</h4>
                      {isLoading && (
                        <p className="gray-c p-medium">(Getting stats...)</p>
                      )}
                    </div>
                    <TopCreators top_creators={topCreators} />
                  </div>
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
