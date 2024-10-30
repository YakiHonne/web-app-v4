import React, { useRef } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { useState } from "react";
import { useEffect } from "react";
import { nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import ToDeletePostNOSTR from "../../Components/Main/ToDeletePostNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import { filterRelays, getParsedNote } from "../../Helpers/Encryptions";

import KindOne from "../../Components/Main/KindOne";
import TrendingNotes from "../../Components/Main/TrendingNotes";
import Footer from "../../Components/Footer";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import axios from "axios";
import { useSelector } from "react-redux";
import { ndkInstance } from "../../Helpers/NDKInstance";
import TrendingUsers from "../../Components/Main/TrendingUsers";

export default function MyNotes() {
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);

  const [activeRelay, setActiveRelay] = useState("");
  const [notes, setNotes] = useState([]);
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [postToDelete, setPostToDelete] = useState(false);
  const extrasRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setNotes([]);
        var sub = ndkInstance.subscribe(
          [{ kinds: [1], authors: [userKeys.pub] }],
          { closeOnEose: true, cacheUsage: "CACHE_FIRST" }
        );

        sub.on("event", async (event) => {
          let event_ = await getParsedNote(event);
          if (event_ && !(event_.isComment || event_.isFlashNews)) {
            setNotes((prev) => {
              let existed = prev.find((note) => note.id === event.id);
              if (existed) return prev;
              else
                return [...prev, event_].sort(
                  (note_1, note_2) => note_2.created_at - note_1.created_at
                );
            });
            setIsLoading(false);
          }
          setIsLoading(false);
        });
        sub.on("eose", () => {
          setIsLoading(false);
        });
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    if (userKeys) {
      fetchData();
      return;
    }
  }, [userKeys, activeRelay]);

  const initDeletedPost = (state) => {
    if (!state) {
      setPostToDelete(false);
      return;
    }
    removeCurrentPost();
    setPostToDelete(false);
  };

  const removeCurrentPost = () => {
    let index = notes.findIndex((item) => item.id === postToDelete.id);
    let tempArray = Array.from(notes);

    if (index !== -1) {
      tempArray.splice(index, 1);
      setNotes(tempArray);
    }
  };

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
  return (
    <>
      {postToDelete && (
        <ToDeletePostNOSTR
          exit={() => initDeletedPost(false)}
          exitAndRefresh={() => initDeletedPost(true)}
          post_id={postToDelete.id}
          title={postToDelete.content}
          thumbnail={""}
          relayToDeleteFrom={
            userRelays
          }
        />
      )}
      <div>
        <Helmet>
          <title>Yakihonne | My notes</title>
          <meta name="description" content={"Browse your posted notes"} />
          <meta
            property="og:description"
            content={"Browse your posted notes"}
          />
          <meta property="og:url" content={`https://yakihonne.com/my-notes`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | My notes" />
          <meta property="twitter:title" content="Yakihonne | My notes" />
          <meta
            property="twitter:description"
            content={"Browse your posted notes"}
          />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <div className="fit-container fx-centered">
              <SidebarNOSTR />
              <main
                className={`main-page-nostr-container`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="fx-centered fit-container fx-start-h fx-start-v">
                  <div
                    style={{ flex: 2, width: "min(100%,700px)" }}
                    className="box-pad-h-m"
                  >
                    <div
                      className="box-pad-v-m fit-container fx-scattered"
                      style={{
                        position: "relative",
                        zIndex: "100",
                      }}
                    >
                      <div className="fx-centered fx-col fx-start-v">
                        <div className="fx-centered">
                          <h4>{notes.length} Notes</h4>
                        </div>
                      </div>
                    </div>
                    {isLoading && notes.length === 0 && (
                      <div
                        className="fit-container fx-centered fx-col"
                        style={{ height: "50vh" }}
                      >
                        <p>Loading notes</p>
                        <LoadingDots />
                      </div>
                    )}
                    {/* )} */}
                    <div className="fit-container fx-scattered fx-wrap fx-stretch">
                      {notes.map((note) => {
                        return (
                          <div
                            className="fit-container fx-start-v fx-scattered"
                            key={note.id}
                          >
                            <KindOne event={note} />
                          </div>
                        );
                      })}
                      {notes.length === 0 && !isLoading && (
                        <div
                          className="fit-container fx-centered fx-col"
                          style={{ height: "40vh" }}
                        >
                          <h4>No notes were found!</h4>
                          <p className="gray-c p-centered">
                            No notes were found in this relay
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      top:
                        extrasRef.current?.getBoundingClientRect().height >=
                        window.innerHeight
                          ? `calc(95vh - ${
                              extrasRef.current?.getBoundingClientRect()
                                .height || 0
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
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
