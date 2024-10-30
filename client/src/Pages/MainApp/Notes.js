import React, { useEffect, useMemo, useRef, useState } from "react";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { Helmet } from "react-helmet";
import { nip19 } from "nostr-tools";
import { getBech32, getParsedNote } from "../../Helpers/Encryptions";
import { getNoteTree } from "../../Helpers/Helpers";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import TrendingUsers from "../../Components/Main/TrendingUsers";
import Footer from "../../Components/Footer";
import KindOne from "../../Components/Main/KindOne";
import WriteNote from "../../Components/Main/WriteNote";
import KindSix from "../../Components/Main/KindSix";
import axios from "axios";
import TrendingNotes from "../../Components/Main/TrendingNotes";
import { useSelector } from "react-redux";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";

export default function Notes() {
  const userKeys = useSelector((state) => state.userKeys);
  const userFollowings = useSelector((state) => state.userFollowings);

  const [notes, setNotes] = useState([]);
  const memoNotes = useMemo(() => notes, [notes]);
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [contentFrom, setContentFrom] = useState("followings");
  const [sub, setSub] = useState();
  const [lastEventTime, setLastTimeEventTime] = useState(undefined);
  const extrasRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    let c = lastEventTime;
    let { filter } = getFilter();
    let usersPubkeys = [];
    let subscription = ndkInstance.subscribe(filter, {
      closeOnEose: true,
      cacheUsage: "CACHE_FIRST",
    });

    subscription.on("event", async (event, relay) => {
      // if (![...bannedList, ...userMutedList].includes(event.pubkey)) {
      usersPubkeys.push(event.pubkey);
      let event_ = await getParsedNote(event);
      if (event_ && !(event_.isComment || event_.isFlashNews)) {
        if (event.kind === 6) {
          usersPubkeys.push(event_.relatedEvent.pubkey);
        }

        setNotes((prev) => {
          let existed = prev.find((note) => note.id === event.id);
          if (existed) return prev;
          else {
            let a = [...prev, event_].sort(
              (note_1, note_2) => note_2.created_at - note_1.created_at
            );
            c = a[a.length - 1].created_at;
            return a;
          }
        });
      }
    });
    subscription.on("close", () => {
      setIsLoaded(c);
      setIsLoading(false);
      saveUsers([...new Set(usersPubkeys)]);
    });

    setSub(subscription);
    let timeout = setTimeout(() => subscription.stop(), 3000);
    return () => {
      if (subscription) subscription.stop();
      clearTimeout(timeout);
    };
    // if (Array.isArray(userMutedList)) fetchData();
  }, [lastEventTime, contentFrom, userFollowings]);

  useEffect(() => {
    const getTrendingNotes = async () => {
      try {
        let nostrBandNotes = await axios.get(
          "https://api.nostr.band/v0/trending/notes"
        );

        let tNotes = nostrBandNotes.data?.notes.splice(0, 10) || [];

        setTrendingNotes(
          tNotes.map((note) => {
            return {
              ...note,
              nEvent: nip19.neventEncode({
                id: note.id,
                author: note.pubkey,
                relays: note.relays,
              }),
            };
          })
        );
      } catch (err) {
        console.log(err);
      }
    };
    getTrendingNotes();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (notes.length === 0 || isLoading) return;

      if (
        document.querySelector(".main-page-nostr-container").scrollHeight -
          document.querySelector(".main-page-nostr-container").scrollTop -
          100 >
          document.documentElement.offsetHeight ||
        isLoading
      ) {
        return;
      }
      setLastTimeEventTime(notes[notes.length - 1].created_at);
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoaded]);

  // useEffect(() => {
  //   if (!userKeys) {
  //     switchContentSource("all");
  //   }
  // }, [userKeys]);

  const getFilter = () => {
    let filter;
    if (contentFrom === "followings") {
      let authors =
        userFollowings.length > 0
          ? Array.from(userFollowings)
          : [process.env.REACT_APP_YAKI_PUBKEY];
      filter = [{ authors, kinds: [1, 6], limit: 60, until: lastEventTime }];
      return {
        filter,
      };
    }
    if (contentFrom === "smart-widget") {
      filter = [
        { kinds: [1], limit: 60, "#l": ["smart-widget"], until: lastEventTime },
      ];
      return {
        filter,
      };
    }
    filter = [{ kinds: [1, 6], limit: 60, until: lastEventTime }];
    return {
      filter,
    };
  };

  // const onEvent = async (event) => {
  //   try {
  //     let isComment = event.tags.find(
  //       (tag) => tag[0] === "e" || tag[0] === "a"
  //     );
  //     let isQuote = event.tags.find((tag) => tag[0] === "q");
  //     let checkForLabel = event.tags.find((tag) => tag[0] === "l");
  //     if (
  //       checkForLabel &&
  //       ["UNCENSORED NOTE", "FLASH NEWS"].includes(checkForLabel[1])
  //     )
  //       return false;
  //     if (isComment && event.kind === 1) return false;
  //     let author_img = "";
  //     let author_name = getBech32("npub", event.pubkey).substring(0, 10);
  //     let author_pubkey = event.pubkey;
  //     let nEvent = nip19.neventEncode({
  //       id: event.id,
  //       author: event.pubkey,
  //     });
  //     if (event.kind === 1) {
  //       let note_tree = await getNoteTree(event.content);
  //       return {
  //         ...event,
  //         note_tree,
  //         isQuote:
  //           isQuote && !event.content.includes("nostr:nevent")
  //             ? isQuote[1]
  //             : "",
  //         author_img,
  //         author_name,
  //         author_pubkey,
  //         // stringifiedEvent: JSON.stringify(event),
  //         nEvent,
  //       };
  //     }
  //     if (!event.content) return false;
  //     let relatedEvent = await onEvent(JSON.parse(event.content));
  //     if (!relatedEvent) return false;
  //     return {
  //       ...event,
  //       relatedEvent,
  //     };
  //   } catch (err) {
  //     console.log(err);
  //     return false;
  //   }
  // };

  const switchContentSource = (source) => {
    const straightUp = () => {
      let el = document.querySelector(".main-page-nostr-container");
      if (!el) return;
      el.scrollTop = 0;
    };
    if (source === contentFrom) return;
    if (sub) sub.stop();
    straightUp();
    setContentFrom(source);
    setNotes([]);
    // setIsLoading(true);
    setLastTimeEventTime(undefined);
  };

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Notes</title>
        <meta name="description" content={"Enjoy what people write on NOSTR"} />
        <meta
          property="og:description"
          content={"Enjoy what people write on NOSTR"}
        />
        <meta property="og:url" content={`https://yakihonne.com/notes`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content={"Yakihonne | Notes"} />
        <meta property="twitter:title" content={"Yakihonne | Notes"} />
        <meta
          property="twitter:description"
          content={"Enjoy what people write on NOSTR"}
        />
      </Helmet>
      <div className="fit-container fx-centered" style={{ columnGap: 0 }}>
        <div className="main-container">
          <SidebarNOSTR />
          <main className="main-page-nostr-container">
            <ArrowUp />
            <div className="fit-container fx-centered fx-start-h">
              <div
                // style={{ width: "min(100%,1400px)" }}
                style={{ gap: 0 }}
                className="fx-centered fx-start-v fx-start-h"
              >
                <div
                  style={{ flex: 1.8, maxWidth: "700px" }}
                  className={`fx-centered  fx-wrap box-pad-h `}
                >
                  <div className="fit-container fx-centered sticky">
                    <div
                      className={`list-item fx-centered fx ${
                        contentFrom === "all" ? "selected-list-item" : ""
                      }`}
                      onClick={() => switchContentSource("all")}
                    >
                      Universal
                    </div>
                    <div
                      className={`list-item fx-centered fx ${
                        contentFrom === "followings" ? "selected-list-item" : ""
                      }`}
                      onClick={() => switchContentSource("followings")}
                    >
                      Following
                    </div>
                    <div
                      className={`list-item fx-centered fx ${
                        contentFrom === "smart-widget"
                          ? "selected-list-item"
                          : ""
                      }`}
                      onClick={() => switchContentSource("smart-widget")}
                    >
                      Widget notes
                    </div>
                  </div>
                  {userKeys && (userKeys.sec || userKeys.ext) && <WriteNote />}
                  {memoNotes.map((note) => {
                    if (note.kind === 6)
                      return <KindSix event={note} key={note.id} />;
                    return <KindOne event={note} key={note.id} />;
                  })}

                  <div className="box-pad-v"></div>
                  {/* <div className="box-pad-v"></div>
                  <div className="box-pad-v"></div> */}
                  {/* <button
                    className="btn btn-normal"
                    onClick={() =>
                      setLastTimeEventTime(notes[notes.length - 1].created_at)
                    }
                  >
                    Load more
                  </button> */}
                  {isLoading && (
                    <div
                      className="fit-container fx-centered fx-col"
                      style={{ height: "10vh" }}
                    >
                      {/* <p>Loading notes</p> */}
                      <LoadingDots />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    top:
                      extrasRef.current?.getBoundingClientRect().height >=
                      window.innerHeight
                        ? `calc(95vh - ${
                            extrasRef.current?.getBoundingClientRect().height ||
                            0
                          }px)`
                        : 0,
                  }}
                  className={`fx-centered  fx-wrap  box-pad-v sticky extras-homepage`}
                  ref={extrasRef}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>

                  {trendingNotes.length > 0 && (
                    <div
                      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v "
                      style={{
                        backgroundColor: "var(--c1-side)",
                        rowGap: "24px",
                        border: "none",
                      }}
                    >
                      <h4>Trending notes</h4>
                      <TrendingNotes notes={trendingNotes} />
                    </div>
                  )}
                  <TrendingUsers />
                  <Footer />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
