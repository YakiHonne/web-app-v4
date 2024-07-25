import React, { useContext, useRef } from "react";
import { Context } from "../../Context/Context";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { useState } from "react";
import { useEffect } from "react";
import { SimplePool, nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import Date_ from "../../Components/Date_";
import ToDeletePostNOSTR from "../../Components/NOSTR/ToDeletePostNOSTR";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import { filterRelays, getBech32, getEmptyNostrUser } from "../../Helpers/Encryptions";
import { getNoteTree } from "../../Helpers/Helpers";
import UploadFile from "../../Components/UploadFile";
import { nanoid } from "nanoid";

import KindOne from "../../Components/NOSTR/KindOne";
import TopCreators from "../../Components/NOSTR/TopCreators";
import TrendingNotes from "../../Components/NOSTR/TrendingNotes";
import Footer from "../../Components/Footer";
import SearchbarNOSTR from "../../Components/NOSTR/SearchbarNOSTR";
import axios from "axios";

var pool = new SimplePool();

export default function NostrMyNotes() {
  const { state } = useLocation();
  const { nostrKeys, nostrUser, isPublishing, setToast } = useContext(Context);
  const [relays, setRelays] = useState(relaysOnPlatform);
  const [activeRelay, setActiveRelay] = useState("");
  const [notes, setNotes] = useState([]);
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [topCreators, setTopCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [postToDelete, setPostToDelete] = useState(false);
  const [showRelaysList, setShowRelaysList] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showAddNote, setShowAddNote] = useState(
    state ? state?.addNote : false
  );
  const extrasRef = useRef(null);

  useEffect(() => {
    setShowAddNote(state ? state?.addNote : false);
  }, [state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setNotes([]);

        let relaysToFetchFrom =
          activeRelay == ""
            ? filterRelays(nostrUser?.relays || [], relaysOnPlatform)
            : [activeRelay];

        var sub = pool.subscribeMany(
          relaysToFetchFrom,
          [{ kinds: [1], authors: [nostrKeys.pub] }],
          {
            async onevent(event) {
              let event_ = await onEvent(event);
              if (event_) {
                setNotes((prev) => {
                  let existed = prev.find((note) => note.id === event.id);
                  if (existed) return prev;
                  else return [...prev, event_];
                });
                setIsLoading(false);
              }
              setIsLoading(false);
            },
            oneose() {
              setIsLoading(false);
            },
          }
        );
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    if (nostrKeys) {
      fetchData();
      return;
    }
  }, [nostrKeys, activeRelay]);

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
  const switchActiveRelay = (source) => {
    if (isLoading) return;
    if (source === activeRelay) return;
    pool = new SimplePool();
    setNotes([]);
    setActiveRelay(source);
  };

  const onEvent = async (event) => {
    try {
      let checkForComment = event.tags.find(
        (tag) => tag[0] === "e" || tag[0] === "a"
      );
      let checkForQuote = event.tags.find((tag) => tag[0] === "q");
      if (checkForComment && event.kind === 1) return false;
      let author_img = "";
      let author_name = getBech32("npub", event.pubkey).substring(0, 10);
      let author_pubkey = event.pubkey;
      let nEvent = nip19.neventEncode({
        id: event.id,
        author: event.pubkey,
      });
      if (event.kind === 1) {
        let note_tree = await getNoteTree(event.content);
        return {
          ...event,
          note_tree,
          checkForQuote: checkForQuote ? checkForQuote[1] : "",
          author_img,
          author_name,
          author_pubkey,
          stringifiedEvent: JSON.stringify(event),
          nEvent,
        };
      }

      //   let relatedEvent = await onEvent(JSON.parse(event.content));
      //   if (!relatedEvent) return false;
      //   return {
      //     ...event,
      //     relatedEvent,
      //   };
    } catch (err) {
      console.log(err);
      return false;
    }
  };
  useEffect(() => {
    const getTrendingNotes = async () => {
      try {
        let [nostrBandNotes, nostrBandProfiles] = await Promise.all([
          axios.get("https://api.nostr.band/v0/trending/notes"),
          axios.get("https://api.nostr.band/v0/trending/profiles"),
        ]);
        let tNotes = nostrBandNotes.data?.notes.splice(0, 10) || [];

        let profiles = nostrBandProfiles.data.profiles
          ? nostrBandProfiles.data.profiles
              .filter((profile) => profile.profile)
              .map((profile) => {
                let author = getEmptyNostrUser(profile.profile.pubkey);
                try {
                  author = JSON.parse(profile.profile.content);
                } catch (err) {
                  console.log(err);
                }
                return {
                  pubkey: profile.profile.pubkey,
                  articles_number: profile.new_followers_count,
                  ...author,
                };
              })
          : [];
        setTopCreators(profiles.slice(0, 6));
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
      {/* {showAddNote && (
        <AddNote
          exit={() => {
            setShowAddNote(false);
          }}
        />
      )} */}
      {postToDelete && (
        <ToDeletePostNOSTR
          exit={() => initDeletedPost(false)}
          exitAndRefresh={() => initDeletedPost(true)}
          post_id={postToDelete.id}
          title={postToDelete.content}
          thumbnail={""}
          relayToDeleteFrom={
            activeRelay == ""
              ? filterRelays(nostrUser?.relays || [], relaysOnPlatform)
              : [activeRelay]
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
                  setShowRelaysList(false);
                  setShowFilter(false);
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
                              {nostrUser &&
                                nostrUser.relays.length > 0 &&
                                nostrUser.relays.map((relay) => {
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
                              {(!nostrUser ||
                                (nostrUser && nostrUser.relays.length === 0)) &&
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
                            {/* <div
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
                                  : setToast({
                                      type: 3,
                                      desc: "An event publishing is in process!",
                                    });
                              }}
                            >
                              <div className="trash-24"></div>
                            </div> */}
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
                    <div
                      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v box-marg-s"
                      style={{
                        backgroundColor: "var(--c1-side)",
                        rowGap: "24px",
                        border: "none",
                        overflow: "visible",
                      }}
                    >
                      <h4>Trending users</h4>
                      <TopCreators
                        top_creators={topCreators}
                        kind="Followers"
                      />
                    </div>
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

// const AddNote = ({ exit }) => {
//   const { setToast } = useContext(Context);
//   const [noteURL, setNoteURL] = useState("");
//   const [noteTitle, setNoteTitle] = useState("");
//   const [noteDesc, setNoteDesc] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [noteMetadata, setNoteMetadata] = useState(false);
//   const [type, setType] = useState("");
//   const [showFinalStep, setShowFinalStep] = useState();
//   const [eventTags, setEventTags] = useState([]);

//   const initPublishing = async () => {
//     if (!(noteURL && noteTitle)) {
//       setToast({
//         type: 2,
//         desc: "Please provide a note URL and title.",
//       });
//       return;
//     }
//     let duration = "0";

//     try {
//     } catch (err) {}
//     let tags = [
//       ["d", nanoid()],
//       ["url", noteURL],
//       ["title", noteTitle],
//       ["summary", noteDesc],
//       ["published_at", `${Math.floor(Date.now() / 1000)}`],
//       [
//         "client",
//         "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
//       ],
//       ["m", noteMetadata ? noteMetadata.type : "note/mp4"],
//       ["duration", duration],
//       ["size", noteMetadata ? `${noteMetadata.size}` : "0"],
//     ];
//     setEventTags(tags);
//     setShowFinalStep(true);
//   };

//   const validate = async () => {
//     if (type === "link") {
//       setType("");
//       return;
//     }
//     if (type === "1063") {
//       try {
//         let naddr = nip19.decode(noteURL);
//         if (naddr.data.kind !== 1063) {
//           setToast({
//             type: 2,
//             desc: "The nEvent is not a file sharing address.",
//           });
//           return;
//         }
//         setIsLoading(true);
//         let event = await pool.get(
//           filterRelays(relaysOnPlatform, naddr.data?.relays || []),
//           {
//             kinds: [1063],
//             ids: [naddr.data.id],
//           }
//         );
//         if (!event) {
//           setToast({
//             type: 2,
//             desc: "Could not retrieve URL from this nEvent.",
//           });
//           setIsLoading(false);
//           return;
//         }
//         let mime = "";
//         let url = "";

//         for (let tag of event.tags) {
//           if (tag[0] === "m") mime = tag[1];
//           if (tag[0] === "url") url = tag[1];
//         }

//         if (!mime.includes("note")) {
//           setToast({
//             type: 2,
//             desc: "The file found is not a note",
//           });
//           setIsLoading(false);
//           return;
//         }
//         if (!url) {
//           setToast({
//             type: 2,
//             desc: "No url found from this nEvent.",
//           });
//           setIsLoading(false);
//           return;
//         }

//         setNoteURL(url);
//         setType("");
//         setIsLoading(false);
//         return;
//       } catch (err) {
//         setToast({
//           type: 2,
//           desc: "Error parsing the nEvent.",
//         });
//         return;
//       }
//     }
//   };
//   // console.log(
//   //   nip19.neventEncode({
//   //     kind: 1063,
//   //     id: "42a944b03557dfde9bd7d47402a5152fae086dcfd8078a50e40271f9da58fad2",
//   //   })
//   // );
//   return (
//     <>
//       {showFinalStep && (
//         <ToPublishNote
//           title={noteTitle}
//           tags={eventTags}
//           exit={() => {
//             setShowFinalStep(false);
//             exit();
//           }}
//         />
//       )}
//       <div className="fixed-container fx-centered box-pad-h">
//         <div
//           className="sc-s-18"
//           style={{ position: "relative", width: "min(100%, 600px)" }}
//         >
//           {!noteURL && !type && (
//             <div className="fit-container fx-centered fx-col box-pad-h box-pad-v">
//               <p>Pick your note</p>
//               <p className="p-medium gray-c p-centered box-marg-s">
//                 You can upload, paste a link or choose a kind 1063 event to your
//                 note
//               </p>
//               <div className="fx-centered" style={{ columnGap: "16px" }}>
//                 <div className="fx-centered fx-col">
//                   <UploadFile
//                     kind={"note/mp4,note/x-m4v,note/*"}
//                     setImageURL={setNoteURL}
//                     setIsUploadsLoading={setIsLoading}
//                     setFileMetadata={setNoteMetadata}
//                     round={true}
//                   />
//                   <p className="p-medium gray-c">Local</p>
//                 </div>
//                 <p className="p-small gray-c">|</p>
//                 <div
//                   className="fx-centered fx-col"
//                   style={{ opacity: isLoading ? ".5" : "1" }}
//                   onClick={() => setType("link")}
//                 >
//                   <div className="round-icon">
//                     <div className="link-24"></div>
//                   </div>
//                   <p className="p-medium gray-c">Link</p>
//                 </div>
//                 <p className="p-small gray-c">|</p>
//                 <div
//                   className="fx-centered fx-col"
//                   style={{ opacity: isLoading ? ".5" : "1" }}
//                   onClick={() => setType("1063")}
//                 >
//                   <div className="round-icon">
//                     <div className="share-icon-2-24"></div>
//                   </div>
//                   <p className="p-medium gray-c">Filesharing</p>
//                 </div>
//               </div>
//             </div>
//           )}
//           {noteURL && !type && (
//             <div className="fit-container box-pad-h box-pad-v-s">
//               <div className="box-pad-v-s fx-scattered fit-container">
//                 <div>
//                   <h4>Preview</h4>
//                   <p className="p-medium orange-c p-one-line">{noteURL}</p>
//                 </div>
//                 <div
//                   className="round-icon"
//                   onClick={() => {
//                     setType("");
//                     setNoteURL("");
//                   }}
//                 >
//                   <div className="trash"></div>
//                 </div>
//               </div>
//               {getNoteFromURL(noteURL)}
//             </div>
//           )}
//           <hr />
//           {type && (
//             <div className="fit-container fx-centered fx-start-v fx-col box-pad-h box-pad-v">
//               <div>
//                 <p className="p-left fit-container">
//                   {type === "link" ? "Note link" : "Kind 1063"}
//                 </p>
//                 {type === "1063" && (
//                   <p className="gray-c p-medium">
//                     Paste your kind 1063 nEvent.
//                   </p>
//                 )}
//               </div>
//               <div className="fx-centered fit-container">
//                 <input
//                   type="text"
//                   className="if ifs-full"
//                   placeholder={
//                     type === "link"
//                       ? "Link to remote note, Youtube note or Vimeo"
//                       : "nEvent"
//                   }
//                   value={noteURL}
//                   onChange={(e) => setNoteURL(e.target.value)}
//                   disabled={isLoading}
//                 />
//                 <div className="fx-centered">
//                   <button
//                     className="btn btn-normal"
//                     onClick={() => (noteURL ? validate() : null)}
//                     disabled={isLoading}
//                   >
//                     {isLoading ? <LoadingDots /> : "validate"}
//                   </button>
//                   <button
//                     className="btn btn-gst-red"
//                     onClick={() => {
//                       setType("");
//                       setNoteURL("");
//                     }}
//                     disabled={isLoading}
//                   >
//                     {isLoading ? <LoadingDots /> : "cancel"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//           <hr />
//           <div className="fit-container fx-centered fx-col box-pad-h box-pad-v">
//             <input
//               type="text"
//               placeholder="Note title"
//               className="if ifs-full"
//               value={noteTitle}
//               onChange={(e) => setNoteTitle(e.target.value)}
//             />
//             <textarea
//               placeholder="Note description"
//               className="txt-area ifs-full"
//               value={noteDesc}
//               onChange={(e) => setNoteDesc(e.target.value)}
//             />
//           </div>
//           <hr />
//           <div className="fit-container fx-centered box-pad-h box-pad-v">
//             <button className="btn btn-gst-red" onClick={exit}>
//               Cancel
//             </button>
//             <button
//               className="btn btn-normal fx-centered"
//               onClick={initPublishing}
//             >
//               Finilize publishing{" "}
//               <div className="arrow" style={{ rotate: "-90deg" }}></div>
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };
