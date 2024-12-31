import React, { useRef } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { useState } from "react";
import { useEffect } from "react";
import ToDeletePostNOSTR from "../../Components/Main/ToDeletePostNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import {
  getParsedNote,
} from "../../Helpers/Encryptions";
import KindOne from "../../Components/Main/KindOne";
import Footer from "../../Components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";

export default function MyNotesHidden() {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [notes, setNotes] = useState([]);
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
          { cacheUsage: "CACHE_FIRST" }
        );
        sub.on("event", async (event) => {
          let event_ = await getParsedNote(event);
          if (event_) {
            setNotes((prev) => {
              let existed = prev.find((note) => note.id === event.id);
              if (existed) return prev;
              else return [...prev, event_];
            });
            setIsLoading(false);
          }
          // setIsLoading(false);
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
  }, [userKeys]);

  const initDeletedPost = (state) => {
    if (!state) {
      setPostToDelete(false);
      return;
    }
    removeCurrentPost();
    setPostToDelete(false);
    // setTimestamp(new Date().getTime());
  };

  const removeCurrentPost = () => {
    let index = notes.findIndex((item) => item.id === postToDelete.id);
    let tempArray = Array.from(notes);

    if (index !== -1) {
      tempArray.splice(index, 1);
      setNotes(tempArray);
    }
  };

 
  return (
    <>
      {postToDelete && (
        <ToDeletePostNOSTR
          exit={() => initDeletedPost(false)}
          exitAndRefresh={() => initDeletedPost(true)}
          post_id={postToDelete.id}
          title={postToDelete.content}
          thumbnail={""}
          relayToDeleteFrom={userRelays}
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
                          {/* <p className="gray-c p-medium">
                            (In{" "}
                            {activeRelay === ""
                              ? "all relays"
                              : activeRelay.split("wss://")[1]}
                            )
                          </p> */}
                        </div>
                      </div>
                      {/* <div className="fx-centered">
                        <div style={{ position: "relative" }}>
                          <div
                            style={{ position: "relative" }}
                            className="round-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRelaysList(!showRelaysList);
                              setShowFilter(false);
                            }}
                          >
                            <div className="server"></div>
                          </div>
                          {showRelaysList && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                bottom: "-5px",
                                backgroundColor: "var(--dim-gray)",
                                border: "none",
                                transform: "translateY(100%)",
                                maxWidth: "300px",
                                rowGap: "12px",
                              }}
                              className="box-pad-h box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v"
                            >
                              <h5>Relays</h5>
                              <button
                                className={`btn-text-gray pointer fx-centered`}
                                style={{
                                  width: "max-content",
                                  fontSize: "1rem",
                                  textDecoration: "none",
                                  color: activeRelay === "" ? "var(--c1)" : "",
                                  transition: ".4s ease-in-out",
                                }}
                                onClick={() => {
                                  switchActiveRelay("");
                                  setShowRelaysList(false);
                                }}
                              >
                                {isLoading && activeRelay === "" ? (
                                  <>Connecting...</>
                                ) : (
                                  "All relays"
                                )}
                              </button>
                              {userMetadata &&
                                userMetadata.relays.length > 0 &&
                                userMetadata.relays.map((relay) => {
                                  return (
                                    <button
                                      key={relay}
                                      className={`btn-text-gray pointer fx-centered `}
                                      style={{
                                        width: "max-content",
                                        fontSize: "1rem",
                                        textDecoration: "none",
                                        color:
                                          activeRelay === relay
                                            ? "var(--c1)"
                                            : "",
                                        transition: ".4s ease-in-out",
                                      }}
                                      onClick={() => {
                                        switchActiveRelay(relay);
                                        setShowRelaysList(false);
                                      }}
                                    >
                                      {isLoading && relay === activeRelay ? (
                                        <>Connecting...</>
                                      ) : (
                                        relay.split("wss://")[1]
                                      )}
                                    </button>
                                  );
                                })}
                              {(!userMetadata ||
                                (userMetadata && userMetadata.relays.length === 0)) &&
                                relays.map((relay) => {
                                  return (
                                    <button
                                      key={relay}
                                      className={`btn-text-gray pointer fx-centered`}
                                      style={{
                                        width: "max-content",
                                        fontSize: "1rem",
                                        textDecoration: "none",
                                        color:
                                          activeRelay === relay
                                            ? "var(--c1)"
                                            : "",
                                        transition: ".4s ease-in-out",
                                      }}
                                      onClick={() => {
                                        switchActiveRelay(relay);
                                        setShowRelaysList(false);
                                      }}
                                    >
                                      {isLoading && relay === activeRelay ? (
                                        <>Connecting..</>
                                      ) : (
                                        relay.split("wss://")[1]
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div> */}
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
                            <div
                              style={{
                                minWidth: "48px",
                                minHeight: "48px",
                                backgroundColor: "var(--dim-gray)",
                                borderRadius: "var(--border-r-50)",
                              }}
                              className="fx-centered pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                !isPublishing
                                  ? setPostToDelete({
                                      id: note.id,
                                      content: note.content,
                                    })
                                  : dispatch(
                                      setToast({
                                        type: 3,
                                        desc: "An event publishing is in process!",
                                      })
                                    );
                              }}
                            >
                              <div className="trash-24"></div>
                            </div>
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
                    className={`fx-centered  fx-wrap box-pad-v-m box-pad-v sticky extras-homepage`}
                    ref={extrasRef}
                  >
                   
                    
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
