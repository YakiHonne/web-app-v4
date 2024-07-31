import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { Helmet } from "react-helmet";
import { Context } from "../../Context/Context";
import bannedList from "../../Content/BannedList";
import relaysOnPlatform from "../../Content/Relays";
import { SimplePool, nip19 } from "nostr-tools";
import {
  filterRelays,
  getBech32,
  getEmptyNostrUser,
} from "../../Helpers/Encryptions";
import UserProfilePicNOSTR from "../../Components/NOSTR/UserProfilePicNOSTR";
import { getNoteTree } from "../../Helpers/Helpers";
import Date_ from "../../Components/Date_";
import SearchbarNOSTR from "../../Components/NOSTR/SearchbarNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import TopCreators from "../../Components/NOSTR/TopCreators";
import Footer from "../../Components/Footer";
import UploadFile from "../../Components/UploadFile";
import { useNavigate } from "react-router-dom";
import KindOne from "../../Components/NOSTR/KindOne";
import WriteNote from "../../Components/NOSTR/WriteNote";
import KindSix from "../../Components/NOSTR/KindSix";
import axios from "axios";
import TrendingNotes from "../../Components/NOSTR/TrendingNotes";

var pool = new SimplePool();

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
      pubkey: creator.pubkey,
      name: creator.author_name,
      img: creator.author_img,
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

export default function NostrNotes() {
  const { nostrKeys, nostrUser, addNostrAuthors, mutedList } =
    useContext(Context);
  const [notes, setNotes] = useState([]);
  const memoNotes = useMemo(() => notes, [notes]);
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [activeRelay, setActiveRelay] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contentFrom, setContentFrom] = useState("all");
  const [sub, setSub] = useState();
  const [lastEventTime, setLastTimeEventTime] = useState(undefined);
  const [topCreators, setTopCreators] = useState([]);
  const extrasRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoaded(false);
        setIsLoading(true);
        let { filter, relaysToFetchFrom } = getFilter();
        let events = [];
        let sub_ = pool.subscribeMany(relaysToFetchFrom, filter, {
          async onevent(event) {
            if (![...bannedList, ...mutedList].includes(event.pubkey)) {
              events.push(event.pubkey);
              let event_ = await onEvent(event);
              if (event_) {
                if (event.kind === 6) {
                  events.push(event_.repostPubkey);
                }
                setNotes((prev) => {
                  let existed = prev.find((note) => note.id === event.id);
                  if (existed) return prev;
                  else return [...prev, event_];
                });
                setIsLoading(false);
              }
            }
          },
          oneose() {
            onEOSE(events);
            setIsLoading(false);
          },
        });
        setSub(sub_);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };

    if (Array.isArray(mutedList)) fetchData();
  }, [lastEventTime, activeRelay, mutedList, contentFrom]);

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

  useEffect(() => {
    const handleScroll = () => {
      if (notes.length === 0) return;
      if (
        document.querySelector(".main-page-nostr-container").scrollHeight -
          document.querySelector(".main-page-nostr-container").scrollTop -
          60 >
        document.documentElement.offsetHeight
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

  useEffect(() => {
    if (!nostrKeys) {
      switchContentSource("all");
    }
  }, [nostrKeys]);

  const getFilter = () => {
    let relaysToFetchFrom;
    let filter;

    if (activeRelay) relaysToFetchFrom = [activeRelay];
    if (!activeRelay)
      relaysToFetchFrom = !nostrUser
        ? relaysOnPlatform
        : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])];
    if (contentFrom === "followings") {
      let authors =
        nostrUser && nostrUser.following.length > 0
          ? [...nostrUser.following.map((item) => item[1])]
          : [];
      filter = [{ authors, kinds: [1, 6], limit: 10, until: lastEventTime }];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom === "smart-widget") {
      filter = [
        { kinds: [1], limit: 10, "#l": ["smart-widget"], until: lastEventTime },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    filter = [{ kinds: [1, 6], limit: 10, until: lastEventTime }];
    return {
      relaysToFetchFrom,
      filter,
    };
  };

  const onEOSE = (events) => {
    if (events) {
      addNostrAuthors(events);
    }
    if (activeRelay) pool.close([activeRelay]);
    if (!activeRelay)
      pool.close(
        !nostrUser
          ? relaysOnPlatform
          : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
      );
    setIsLoaded(true);
    setIsLoading(false);
  };

  const onEvent = async (event) => {
    try {
      let checkForComment = event.tags.find(
        (tag) => tag[0] === "e" || tag[0] === "a"
      );
      let checkForQuote = event.tags.find((tag) => tag[0] === "q");
      let checkForLabel = event.tags.find((tag) => tag[0] === "l");
      if (
        checkForLabel &&
        ["UNCENSORED NOTE", "FLASH NEWS"].includes(checkForLabel[1])
      )
        return false;
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
          checkForQuote:
            checkForQuote && !event.content.includes("nostr:nevent")
              ? checkForQuote[1]
              : "",
          author_img,
          author_name,
          author_pubkey,
          stringifiedEvent: JSON.stringify(event),
          nEvent,
        };
      }

      let relatedEvent = await onEvent(JSON.parse(event.content));
      if (!relatedEvent) return false;
      return {
        ...event,
        relatedEvent,
      };
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const switchContentSource = (source) => {
    if (source === contentFrom) return;
    if (sub) sub.close();
    setContentFrom(source);
    setNotes([]);
    setIsLoading(true);
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
                style={{ width: "min(100%,1400px)" }}
                className="fx-centered fx-start-v fx-start-h"
              >
                <div
                  style={{ flex: 1.5, maxWidth: "700px" }}
                  className={`fx-centered  fx-wrap box-pad-h `}
                >
                  <div className="fit-container fx-centered sticky">
                    {nostrKeys && (
                      <div
                        className={`list-item fx-centered fx ${
                          contentFrom === "followings" ? "selected-list-item" : ""
                        }`}
                        onClick={() => switchContentSource("followings")}
                      >
                        Following
                      </div>
                    )}
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
                        contentFrom === "smart-widget" ? "selected-list-item" : ""
                      }`}
                      onClick={() => switchContentSource("smart-widget")}
                    >
                      Widget notes
                    </div>
                  </div>
                  {nostrKeys && (nostrKeys.sec || nostrKeys.ext) && (
                    <WriteNote />
                  )}
                  {memoNotes.map((note) => {
                    if (note.kind === 6)
                      return <KindSix event={note} key={note.id} />;
                    return <KindOne event={note} key={note.id} />;
                  })}
                  {isLoading && (
                    <div
                      className="fit-container fx-centered fx-col"
                      style={{ height: "50vh" }}
                    >
                      <p>Loading notes</p>
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
                    <TopCreators top_creators={topCreators} kind="Followers" />
                  </div>
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

// const KindOne = ({ event, reactions = true }) => {
//   const { nostrKeys, nostrAuthors, getNostrAuthor } = useContext(Context);
//   const navigate = useNavigate();
//   const [user, setUser] = useState(getEmptyNostrUser(event.pubkey));
//   const [relatedEvent, setRelatedEvent] = useState(false);

//   useEffect(() => {
//     let tempPubkey = event.pubkey;
//     let auth = getNostrAuthor(tempPubkey);

//     if (auth) {
//       setUser(auth);
//     }
//     if (event.checkForQuote && !relatedEvent) {
//       let pool = new SimplePool();

//       pool.subscribeMany(
//         relaysOnPlatform,
//         [{ kinds: [1], ids: [event.checkForQuote] }],
//         {
//           async onevent(event) {
//             setRelatedEvent(await onEvent(event));
//           },
//         }
//       );
//     }
//   }, [nostrAuthors]);

//   const onEvent = async (event) => {
//     try {
//       let checkForComment = event.tags.find((tag) => tag[0] === "e");
//       let checkForQuote = event.tags.find((tag) => tag[0] === "q");
//       if (checkForComment && event.kind === 1) return false;
//       let author_img = "";
//       let author_name = getBech32("npub", event.pubkey).substring(0, 10);
//       let author_pubkey = event.pubkey;
//       let nEvent = nip19.neventEncode({
//         id: event.id,
//         author: event.pubkey,
//       });
//       if (event.kind === 1) {
//         let note_tree = await getNoteTree(event.content);
//         return {
//           ...event,
//           note_tree,
//           checkForQuote,
//           author_img,
//           author_name,
//           author_pubkey,
//           nEvent,
//         };
//       }
//     } catch (err) {
//       console.log(err);
//       return false;
//     }
//   };

//   const onClick = (e) => {
//     let isSelected = window.getSelection().toString();

//     if (isSelected) return null;
//     navigate(`/notes/${event.nEvent}`);
//   };

//   return (
//     <div
//       className="box-pad-h-m box-pad-v-m sc-s-18 fit-container pointer"
//       style={{ backgroundColor: "var(--c1-side)" }}
//     >
//       <div className="fit-container fx-scattered box-marg-s" onClick={onClick}>
//         <div className="fx-centered fx-start-h ">
//           <UserProfilePicNOSTR
//             size={30}
//             mainAccountUser={false}
//             ring={false}
//             user_id={user.pubkey}
//             img={user.picture}
//           />
//           <div>
//             <p className="p-medium">{user.display_name || user.name}</p>
//             <p className="p-medium gray-c">@{user.name || user.display_name}</p>
//           </div>
//         </div>
//         <p className="gray-c p-medium">
//           <Date_ toConvert={new Date(event.created_at * 1000)} time={true} />
//         </p>
//       </div>
//       <div className="fx-centered fx-col fit-container">
//         <div className="fit-container" onClick={onClick}>
//           {event.note_tree}
//         </div>
//         {relatedEvent && (
//           <div className="fit-container">
//             <KindOne event={relatedEvent} reactions={false} />
//           </div>
//         )}
//       </div>
//       {reactions && (
//         <div
//           className="fx-scattered fit-container"
//           style={{ paddingTop: "1rem" }}
//         >
//           <div className="fx-centered" style={{ columnGap: "16px" }}>
//             <div className="fx-centered">
//               <div className="comment-icon"></div>
//               <p className="p-medium ">0</p>
//             </div>
//             <div className="fx-centered">
//               <div className="heart"></div>
//               <p className="p-medium ">0</p>
//             </div>
//             <div className="fx-centered">
//               <div className="switch-arrows"></div>
//               <p className="p-medium ">0</p>
//             </div>
//             <div className="fx-centered">
//               <div className="quote"></div>
//               <p className="p-medium ">0</p>
//             </div>
//             <div className="fx-centered">
//               <div className="bolt"></div>
//               <p className="p-medium ">0</p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const KindSix = ({ event }) => {
//   const { nostrKeys, nostrAuthors, getNostrAuthor } = useContext(Context);
//   const [user, setUser] = useState(getEmptyNostrUser(event.pubkey));
//   // const [sourceUser, setSourceUser] = useState(
//   //   getEmptyNostrUser(event.repostPubkey)
//   // );
//   // const navigate = useNavigate();

//   useEffect(() => {
//     let auth = getNostrAuthor(event.pubkey);
//     // let sourceAuth = getNostrAuthor(event.repostPubkey);

//     if (auth) {
//       setUser(auth);
//     }
//     // if (sourceAuth) {
//     //   setSourceUser(sourceAuth);
//     // }
//   }, [nostrAuthors]);

//   // const onClick = (e) => {
//   //   let isSelected = window.getSelection().toString();

//   //   if (isSelected) return null;
//   //   navigate(`/notes/${event.repostedNEvent}`);
//   // };

//   return (
//     <div
//       className="box-pad-h-m box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v fit-container"
//       style={{
//         backgroundColor: "var(--c1-side)",
//         rowGap: "10px",
//         overflow: "visible",
//       }}
//     >
//       <div
//         className="fx-centered fx-start-h sc-s-18 box-pad-h-s box-pad-v-s round-icon-tooltip pointer"
//         style={{ overflow: "visible" }}
//         data-tooltip={`${user.display_name} reposted this on ${new Date(
//           event.created_at * 1000
//         ).toLocaleDateString()}`}
//       >
//         <UserProfilePicNOSTR
//           size={20}
//           mainAccountUser={false}
//           ring={false}
//           user_id={user.pubkey}
//           img={user.picture}
//         />
//         <div>
//           <p className="p-medium">{user.display_name || user.name}</p>
//         </div>
//         <div className="switch-arrows"></div>
//       </div>
//       <KindOne event={event.relatedEvent} />
//       {/* <div
//         className="fit-container"
//         // style={{ backgroundColor: "var(--c1-side)" }}
//       >
//         <div
//           className="fit-container fx-scattered box-marg-s pointer"
//           onClick={onClick}
//         >
//           <div className="fx-centered fx-start-h">
//             <UserProfilePicNOSTR
//               size={30}
//               mainAccountUser={false}
//               ring={false}
//               user_id={sourceUser.pubkey}
//               img={sourceUser.picture}
//             />
//             <div>
//               <p className="p-medium">
//                 {sourceUser.display_name || sourceUser.name}
//               </p>
//               <p className="p-medium gray-c">
//                 @{sourceUser.name || sourceUser.display_name}
//               </p>
//             </div>
//           </div>
//           <p className="gray-c p-medium">
//             <Date_
//               toConvert={new Date(event.repostCreatedAt * 1000)}
//               time={true}
//             />
//           </p>
//         </div>
//         <div onClick={onClick} className="pointer">
//           {event.note_tree}
//         </div>
//       </div> */}
//       {/* <div
//         className="fx-scattered fit-container"
//         style={{ paddingTop: "1rem" }}
//       >
//         <div className="fx-centered" style={{ columnGap: "16px" }}>
//           <div className="fx-centered">
//             <div className="comment-icon"></div>
//             <p className="p-medium ">0</p>
//           </div>
//           <div className="fx-centered">
//             <div className="heart"></div>
//             <p className="p-medium ">0</p>
//           </div>
//           <div className="fx-centered">
//             <div className="switch-arrows"></div>
//             <p className="p-medium ">0</p>
//           </div>
//           <div className="fx-centered">
//             <div className="quote"></div>
//             <p className="p-medium ">0</p>
//           </div>
//           <div className="fx-centered">
//             <div className="bolt"></div>
//             <p className="p-medium ">0</p>
//           </div>
//         </div>
//       </div> */}
//     </div>
//   );
// };
